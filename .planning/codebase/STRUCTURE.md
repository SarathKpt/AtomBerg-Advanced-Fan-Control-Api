# STRUCTURE.md — Directory Structure

> **Status:** Pre-source. Application directory structure TBD.

## Root Layout

```
AtomBerg-Advanced-Fan-Sleep-Mod/
├── .agent/                    # GSD AI planning system (do not modify)
├── .claude/                   # Claude AI config (auto-managed)
├── .cursor/                   # Cursor IDE config (auto-managed)
├── .gemini/                   # Gemini AI config (auto-managed)
├── .opencode/                 # OpenCode config (auto-managed)
├── .codex/                    # Codex config (auto-managed)
└── .github/                   # GitHub config + AI tooling
```

## Key Locations

| Location | Purpose | Status |
|----------|---------|--------|
| `.agent/get-shit-done/` | GSD workflow engine | Active — do not edit |
| `.agent/skills/` | GSD skill definitions | Active — do not edit |
| `.planning/` | Planning docs (will be created by GSD) | Pending creation |
| Source code location | TBD | Not yet created |

## Naming Conventions

- Agent tooling dirs: lowercase with dots (`.agent`, `.claude`, etc.)
- Planning docs: SCREAMING_SNAKE_CASE (e.g., `PROJECT.md`, `ROADMAP.md`)
- Application naming: TBD

## File Counts

| Category | Count |
|----------|-------|
| Application source files | 0 |
| Config/tooling files | ~100+ (in `.agent/`) |
| Planning files | 0 (to be created) |

---
*Mapped: 2026-03-26 | State: Pre-source (no application code)*
