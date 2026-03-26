# AtomBerg Advanced Fan Sleep Mod

A stateless Vercel Serverless Function (Node.js) that acts as a middle-layer API for controlling Atomberg Smart Fans.

---

## Endpoint

```
POST /api/fan-sleep
```

---

## Payload Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `api_key` | string | ✅ | Atomberg developer API key |
| `refresh_token` | string | ✅ | Atomberg refresh token |
| `device_id` | string | ❌ | Target fan. Omit for discovery mode |
| `speed` | number | ❌ | Speed command (see table below). Omit for query mode |

### `speed` values

| Value | Behaviour |
|---|---|
| *(omitted)* | **Query mode** — read state, no changes |
| `-1` | Decrement speed by 1 (min 1) |
| `0` | Turn fan off |
| `1`–`6` | Set absolute speed (auto power-on if fan is off) |
| `7` | Increment speed by 1 (starts at 1 if fan is off) |

---

## Modes

### 1. Discovery mode
`device_id` not provided — lists all devices and their IDs. No changes made.

**Request:**
```json
{ "api_key": "...", "refresh_token": "..." }
```
**Response:**
```json
{
  "status": "discovery",
  "device_id.1": "f412fa220b50",
  "name.1": "Guest Fan",
  "device_id.2": "80659932c550",
  "name.2": "Master Fan",
  "device_id.3": "b8f86215e354",
  "name.3": "Sarath's Fan"
}
```

---

### 2. Query mode
`device_id` provided, `speed` omitted — reads current state, no changes made.

**Request:**
```json
{ "api_key": "...", "refresh_token": "...", "device_id": "b8f86215e354" }
```
**Response:**
```json
{
  "status": "query",
  "power": true,
  "current_speed": 4,
  "device_id": "b8f86215e354",
  "name": "Sarath's Fan"
}
```

---

### 3. Control mode
`device_id` and `speed` both provided — sends a command to the fan.

**Request:**
```json
{ "api_key": "...", "refresh_token": "...", "device_id": "b8f86215e354", "speed": 3 }
```
**Response:**
```json
{
  "status": "success",
  "action_taken": "speed_set",
  "power": true,
  "current_speed": 3,
  "device_id": "b8f86215e354",
  "name": "Sarath's Fan"
}
```

**`action_taken` values:**
| Value | Meaning |
|---|---|
| `none` | No action needed (already at target state) |
| `speed_lowered` | Speed decremented |
| `speed_set` | Speed set to target |
| `speed_increased` | Speed incremented |
| `turned_off` | Fan turned off |
| `turned_on` | Fan turned on (speed 7 while off) |
| `turned_on_and_set_speed` | Fan turned on then speed set (speed 1–6 while off) |

---

## Running Locally

```bash
npm run dev
# → http://localhost:3000       (test UI)
# → POST http://localhost:3000/api/fan-sleep
```

## Deploying to Vercel

```bash
vercel
```

---

## Getting Credentials

Enable **Developer Mode** in the Atomberg Home app to generate your `api_key` and `refresh_token`.  
Access token quota: **100 API calls/day**, **5 calls/second**.
