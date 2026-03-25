# STACK.md — Technology Stack

> **Status:** Pre-source. No application code exists yet. This is a blank-slate project workspace initialized with GSD tooling.

## Languages

| Language | Role | Status |
|----------|------|--------|
| TBD | Application language | Not yet chosen |

## Runtime / Platform

| Platform | Version | Notes |
|----------|---------|-------|
| TBD | — | Not yet determined |

## Frameworks

None yet — project not initialized.

## Dependencies

No `package.json`, `requirements.txt`, `Cargo.toml`, `go.mod`, or equivalent dependency manifest exists in the project root. The only `package.json` is `.agent/package.json` which contains `{"type":"commonjs"}` — used exclusively for GSD tooling.

## Build & Dev Tooling

| Tool | Purpose | Config file |
|------|---------|------------|
| GSD (get-shit-done) | AI planning/execution workflow | `.agent/get-shit-done/` |
| Node.js (CJS) | GSD CLI runtime | `.agent/package.json` |

## Configuration Files

| File | Purpose |
|------|---------|
| `.agent/settings.json` | GSD agent settings |
| `.agent/gsd-file-manifest.json` | GSD file tracking manifest |
| `.github/copilot-instructions.md` | Copilot/AI tooling instructions |

## Environment

No `.env`, `.env.example`, or environment config files exist. Environment configuration is TBD.

---
*Mapped: 2026-03-26 | State: Pre-source (no application code)*
