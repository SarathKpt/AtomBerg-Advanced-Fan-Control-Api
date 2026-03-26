// server.js — Local dev server (not for production)
// Run with: npm run dev
// Homepage: http://localhost:3000
// API:      POST http://localhost:3000/api/fan-sleep

import http from "http";
import fs   from "fs";
import path from "path";
import { fileURLToPath } from "url";
import handler from "./api/fan-sleep.js";

const PORT    = 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const server = http.createServer(async (req, res) => {

  // ── Serve homepage ────────────────────────────────────────────
  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    const file = path.join(__dirname, "public", "index.html");
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404); return res.end("Not found");
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    });
    return;
  }

  // ── API endpoint ──────────────────────────────────────────────
  if (req.url === "/api/fan-sleep") {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Method not allowed" }));
    }

    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", async () => {
      try { req.body = body ? JSON.parse(body) : {}; }
      catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Invalid JSON body" }));
      }

      const shimRes = {
        _status: 200,
        _headers: { "Content-Type": "application/json" },
        status(code)      { this._status = code; return this; },
        setHeader(k, v)   { this._headers[k] = v; return this; },
        json(data) {
          res.writeHead(this._status, this._headers);
          res.end(JSON.stringify(data, null, 2));
        },
      };

      try   { await handler(req, shimRes); }
      catch (err) {
        console.error("Handler error:", err.message);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`\n  🌀  AtomBerg Fan Sleep — Dev Server`);
  console.log(`  ──────────────────────────────────`);
  console.log(`  Homepage → http://localhost:${PORT}`);
  console.log(`  API      → POST http://localhost:${PORT}/api/fan-sleep\n`);
});
