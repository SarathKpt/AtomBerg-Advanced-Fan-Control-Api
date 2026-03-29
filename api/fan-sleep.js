// api/fan-sleep.js
// Vercel Serverless Function — Atomberg Fan Sleep Mod
//
// POST /api/fan-sleep
// Body: { api_key, refresh_token, device_id? }
//
// If device_id is omitted: discovery mode — returns all device IDs + speeds.
// If device_id is provided: steps that fan's speed down by 1 (min 1).

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Actual Atomberg developer API base (single canonical URL — no fallback needed)
const BASE_URL = "https://api.developer.atomberg-iot.com";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------


/**
 * Thin wrapper around fetch for the Atomberg API.
 * @param {string} path     — e.g. "/v1/get_access_token"
 * @param {RequestInit} options
 * @returns {Promise<Response>}
 */
async function atombergFetch(path, options) {
  return fetch(`${BASE_URL}${path}`, options);
}

/**
 * Throw if the HTTP response is not OK, or if the Atomberg payload
 * indicates failure (status !== "Success").
 * @param {Response} res
 * @param {object|null} data  — parsed JSON (pass null to skip payload check)
 * @param {string} context
 */
async function assertOk(res, data, context) {
  if (!res.ok) {
    let body = "";
    try { body = await res.text(); } catch (_) {}
    throw new Error(`Atomberg API error [${context}] HTTP ${res.status}: ${body}`);
  }
  if (data && data.status !== "Success") {
    throw new Error(`Atomberg API error [${context}] status=${data.status}: ${JSON.stringify(data.message ?? data)}`);
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  // ── Method guard ──────────────────────────────────────────────────────────
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── Parse & validate body ─────────────────────────────────────────────────
  const { api_key, refresh_token, device_id, speed: requestedSpeed, validate } = req.body ?? {};
  const speedProvided = req.body != null && "speed" in req.body;

  // Validate speed if provided
  if (req.body?.speed !== undefined && ![-1, 0, 1, 2, 3, 4, 5, 6, 7].includes(req.body.speed)) {
    return res.status(400).json({ error: "speed must be -1 (decrement), 0 (off), 1-6 (set), or 7 (increment)" });
  }

  if (!api_key || !refresh_token) {
    return res.status(400).json({
      error: "Missing required fields: api_key, refresh_token",
    });
  }

  // device_id is optional — omitting it triggers discovery mode (see below)

  // ── Step 2: Authenticate — get access_token ─────────────────────────────
  // Per official docs: BOTH x-api-key AND Authorization: Bearer {refresh_token} required
  const authRes  = await atombergFetch("/v1/get_access_token", {
    method:  "GET",
    headers: {
      "x-api-key":   api_key,
      Authorization: `Bearer ${refresh_token}`,
    },
  });
  const authData = await authRes.json();

  // ── Validate mode: return clean valid/invalid — no raw errors ────────────
  if (validate === true) {
    const isValid = authRes.ok && authData?.message?.access_token;
    return res.status(200).json(
      isValid
        ? { status: "valid",   message: "API key and refresh token are valid." }
        : { status: "invalid", message: "API key or refresh token is invalid or has expired." }
    );
  }

  await assertOk(authRes, authData, "get_access_token");

  const accessToken = authData?.message?.access_token;
  if (!accessToken) {
    return res.status(502).json({ error: "Could not extract access_token from Atomberg auth response", raw: authData });
  }

  const authHeaders = {
    "X-API-Key":    api_key,
    Authorization: `Bearer ${accessToken}`,
  };

  // ── Device list ───────────────────────────────────────────────────────────
  const listRes  = await atombergFetch("/v1/get_list_of_devices", { method: "GET", headers: authHeaders });
  const listData = await listRes.json();
  await assertOk(listRes, listData, "get_list_of_devices");
  const deviceList = listData?.message?.devices_list ?? [];

  // ── Discovery mode: device_id unknown ────────────────────────────────────
  if (!device_id) {
    // Fetch current speed for every device in parallel
    const deviceStates = await Promise.all(
      deviceList.map(async (device) => {
        try {
          const r     = await atombergFetch(`/v1/get_device_state?device_id=${encodeURIComponent(device.device_id)}`, {
            method:  "GET",
            headers: authHeaders,
          });
          const d     = await r.json();
          const state = d?.message?.device_state?.[0] ?? {};
          // Merge full state with the human-readable name from device list
          return { name: device.name ?? null, ...state };
        } catch (_) {
          return { device_id: device.device_id, name: device.name ?? null, error: "failed to fetch state" };
        }
      })
    );

    // Build name → device_id map: { "Fan Name": "device_id", ... }
    const flat = {};
    deviceStates.forEach(d => {
      if (d.device_id) flat[d.device_id] = d.name ?? d.device_id;
    });

    return res.status(200).json(flat);
  }

  // ── Normal mode: device_id known — fetch state then step down ────────────
  const stateRes  = await atombergFetch(`/v1/get_device_state?device_id=${encodeURIComponent(device_id)}`, {
    method:  "GET",
    headers: authHeaders,
  });
  const stateData = await stateRes.json();
  await assertOk(stateRes, stateData, "get_device_state");

  const deviceState = stateData?.message?.device_state?.[0];
  const currentSpeed = deviceState?.last_recorded_speed ?? null;
  const fanPower     = deviceState?.power ?? false;
  const deviceName   = deviceList.find(d => d.device_id === device_id)?.name ?? null;

  if (currentSpeed === null) {
    return res.status(502).json({
      error: "Could not extract speed from Atomberg device state response",
      raw:   stateData,
    });
  }

  // ── Query mode: speed not in payload — read only, no changes ───────────────
  if (!speedProvided) {
    return res.status(200).json({
      status:        "query",
      power:         fanPower,
      current_speed: currentSpeed,
      device_id:     device_id,
      name:          deviceName,
    });
  }

  // ── Speed control decision tree ──────────────────────────────────────────
  // requestedSpeed: -1 = decrement (default) | 0 = off | 1-6 = set | 7 = increment
  let actionTaken = "none";
  let finalSpeed  = currentSpeed;
  let finalPower  = fanPower;
  const commands  = []; // sent sequentially to Atomberg

  if (requestedSpeed === 0) {
    // ── Turn off ──────────────────────────────────────────────────────
    if (fanPower) {
      commands.push({ power: false });
      actionTaken = "turned_off";
      finalPower  = false;
    }

  } else if (requestedSpeed >= 1 && requestedSpeed <= 6) {
    // ── Set absolute speed ────────────────────────────────────────────
    if (!fanPower) {
      commands.push({ power: true }); // turn on first
      finalPower  = true;
      actionTaken = "turned_on_and_set_speed";
    } else {
      actionTaken = "speed_set";
    }
    commands.push({ speed: requestedSpeed });
    finalSpeed = requestedSpeed;

  } else if (requestedSpeed === 7) {
    // ── Increment speed ───────────────────────────────────────────────
    if (!fanPower) {
      commands.push({ power: true }, { speed: 1 });
      actionTaken = "turned_on";
      finalPower  = true;
      finalSpeed  = 1;
    } else {
      const next = Math.min(currentSpeed + 1, 6);
      if (next > currentSpeed) {
        commands.push({ speed: next });
        actionTaken = "speed_increased";
        finalSpeed  = next;
      }
    }

  } else {
    // ── Default (-1): decrement ───────────────────────────────────────
    if (fanPower && currentSpeed > 1) {
      commands.push({ speed: currentSpeed - 1 });
      actionTaken = "speed_lowered";
      finalSpeed  = currentSpeed - 1;
    } else if (fanPower && currentSpeed <= 1) {
      // Already at minimum speed — turn off instead
      commands.push({ power: false });
      actionTaken = "turned_off";
      finalPower  = false;
    }
  }

  // ── Send commands sequentially ────────────────────────────────────────────
  for (const command of commands) {
    const setRes  = await atombergFetch("/v1/send_command", {
      method:  "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ device_id, command }),
    });
    const setData = await setRes.json();
    await assertOk(setRes, setData, "send_command");
  }

  // Look up the device name from the device list
  // deviceName already resolved above alongside fanPower / currentSpeed

  return res.status(200).json({
    status:       "success",
    action_taken: actionTaken,
    power:        finalPower,
    current_speed: finalSpeed,
    device_id:    device_id,
    name:         deviceName,
  });
}
