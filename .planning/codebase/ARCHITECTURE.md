# ARCHITECTURE.md — System Architecture

> **Status:** Pre-source. No application architecture exists yet. This document reflects the tooling infrastructure only.

## Architecture Pattern

**TBD** — Not yet determined. Will be defined during `/gsd-new-project` requirements and roadmap phases.

## Current Structure (Tooling Only)

The repository currently contains only AI agent tooling infrastructure:

```
AtomBerg-Advanced-Fan-Sleep-Mod/
├── .agent/                    # GSD AI workflow system
│   ├── get-shit-done/         # Core GSD workflows and templates
│   ├── skills/                # GSD command skills
│   ├── agents/                # Custom subagent definitions
│   ├── hooks/                 # Lifecycle hooks
│   ├── package.json           # CJS module declaration
│   ├── settings.json          # Agent settings
│   └── gsd-file-manifest.json # File tracking
├── .claude/                   # Claude AI config
├── .cursor/                   # Cursor IDE config
├── .gemini/                   # Gemini AI config
├── .opencode/                 # OpenCode config
├── .codex/                    # Codex config
└── .github/                   # GitHub Actions + AI instructions
    ├── agents/
    ├── skills/
    ├── get-shit-done/
    └── copilot-instructions.md
```

## Layers

No application layers exist. Once developed, architecture layers will be documented here.

## Entry Points

None yet.

## Data Flow

None yet.

## Key Abstractions

None yet.

---
*Mapped: 2026-03-26 | State: Pre-source (no application code)*
