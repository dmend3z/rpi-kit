# RPIKit -- Research -> Plan -> Implement

AI-assisted feature development with 13 named agents, delta specs, and knowledge compounding.

RPIKit works with **Claude Code**, **Gemini CLI**, and **Codex**. It guides developers through a structured 7-phase pipeline. Each phase is run by specialized agents with distinct personas -- so you research before you plan, plan before you code, and review before you ship.

## Quick Start

```bash
# Install via npm
npm install -g rpi-kit

# Install for your preferred tool
rpi-kit install

# First time: guided setup
/rpi:onboarding
```

## How It Works

RPIKit breaks feature development into 7 phases, each driven by named agents:

| # | Phase | Command | Agents | Output |
|---|-------|---------|--------|--------|
| 1 | **Request** | `/rpi:new` | Luna | `REQUEST.md` -- elicited requirements |
| 2 | **Research** | `/rpi:research` | Atlas + Scout + Nexus | `RESEARCH.md` -- GO/NO-GO verdict |
| 3 | **Plan** | `/rpi:plan` | Mestre + Clara + Pixel + Nexus | `PLAN.md` + `eng.md` + `pm.md` + `ux.md` + `delta/` |
| 4 | **Implement** | `/rpi:implement` | Forge + Sage | Code + `IMPLEMENT.md` |
| 5 | **Simplify** | `/rpi:simplify` | Razor | Simplified code |
| 6 | **Review** | `/rpi:review` | Hawk + Shield + Sage + Nexus | PASS / FAIL verdict |
| 7 | **Docs** | `/rpi:docs` | Quill | Updated documentation |

Use `/rpi <feature>` to auto-detect the current phase and progress to the next one.

## Commands

| Command | Description |
|---------|-------------|
| `/rpi <feature>` | Auto-progress to next phase -- detects current state and runs the appropriate step |
| `/rpi:new <feature>` | Interactive interview with Luna to create REQUEST.md |
| `/rpi:research <feature>` | Codebase analysis (Atlas) + technical investigation (Scout) |
| `/rpi:plan <feature>` | Architecture (Mestre) + product spec (Clara) + UX (Pixel) |
| `/rpi:implement <feature>` | Execute PLAN.md tasks with per-task commits (Forge) |
| `/rpi:simplify <feature>` | Dead code removal and simplification (Razor) |
| `/rpi:review <feature>` | Adversarial review (Hawk) + security audit (Shield) + test coverage (Sage) |
| `/rpi:docs <feature>` | Generate documentation from artifacts (Quill) |
| `/rpi:init` | Configure RPIKit and generate `rpi/context.md` |
| `/rpi:status` | Show all features and their current phase |
| `/rpi:party <topic>` | Multi-agent debate on any topic |
| `/rpi:learn` | Save a solution or insight to the knowledge base |
| `/rpi:archive <feature>` | Merge delta specs into `rpi/specs/` and clean up |
| `/rpi:update` | Update RPIKit plugin to the latest version |
| `/rpi:onboarding` | Guided first-time setup with codebase analysis |

## Agents

RPIKit uses 13 named agents, each with a distinct persona:

| Agent | Persona | Phase | Tools |
|-------|---------|-------|-------|
| **Luna** | Curious analyst who asks uncomfortable questions | Request | Read, Glob, Grep, AskUserQuestion |
| **Atlas** | Methodical explorer who maps every corner of the codebase | Research | Read, Glob, Grep |
| **Scout** | Skeptical investigator who researches external options | Research | Read, Glob, Grep, WebSearch, WebFetch |
| **Nexus** | Diplomatic synthesizer who merges outputs and facilitates debates | Cross-phase + Party | Read, Write, Glob, Grep, Agent, AskUserQuestion |
| **Mestre** | Pragmatic architect who hates over-engineering | Plan | Read, Glob, Grep |
| **Clara** | Value-driven PM who cuts scope without mercy | Plan | Read, Glob, Grep |
| **Pixel** | Empathetic UX designer who thinks from the user's perspective | Plan (conditional) | Read, Glob, Grep |
| **Forge** | Disciplined executor who follows the plan precisely | Implement | Read, Write, Edit, Bash, Glob, Grep |
| **Sage** | Paranoid tester who thinks in edge cases | Implement (TDD) + Review | Read, Write, Edit, Bash, Glob, Grep |
| **Razor** | Minimalist simplifier who measures quality by deletion count | Simplify | Read, Write, Edit, Bash, Glob, Grep |
| **Hawk** | Adversarial reviewer forced to find problems (zero findings = re-analyse) | Review | Read, Glob, Grep |
| **Shield** | Security sentinel who thinks like an attacker (OWASP, secrets, injection) | Review | Read, Glob, Grep |
| **Quill** | Concise technical writer who explains the "why", not the "what" | Docs | Read, Write, Edit, Glob, Grep |

## Key Features

### Delta Specs

Instead of maintaining full specifications, RPIKit captures only what changes. During planning, Mestre generates `delta/ADDED/`, `delta/MODIFIED/`, and `delta/REMOVED/` directories. On archive, Nexus merges deltas into `rpi/specs/`.

### Party Mode

`/rpi:party "GraphQL vs REST?"` starts a multi-agent debate. Nexus selects 3-5 relevant agents, each argues from their persona's perspective, and Nexus synthesizes a recommendation. Results can be saved to `rpi/solutions/decisions/`.

### Knowledge Compounding

Solutions discovered during review are automatically saved to `rpi/solutions/`. Use `/rpi:learn` to manually save insights. During research, Scout searches past solutions before looking externally.

### Auto-Flow

`/rpi <feature>` detects the current phase by checking which artifacts exist and runs the next phase automatically. No need to remember which command comes next.

### Quick Flow

For small features, use `--quick` to skip the full research and plan phases. Luna asks 1-2 questions, Forge generates a mini-plan inline, and Razor does a quick simplify. If Forge detects complexity > S during implementation, it stops and suggests the full pipeline.

## Configuration

Run `/rpi:init` to generate `.rpi.yaml`, or create it manually:

```yaml
version: 2

# Directories
folder: rpi/features
specs_dir: rpi/specs
solutions_dir: rpi/solutions
context_file: rpi/context.md

# Execution
parallel_threshold: 8
commit_style: conventional
tdd: false

# Conditional agents
ux_agent: auto                 # auto | always | never

# Quick flow
quick_complexity: S

# Knowledge compounding
auto_learn: true

# Party mode
party_default_agents: 4
```

## Directory Structure

```
rpi/
├── context.md                          # Project conventions and stack
├── specs/                              # Current system specifications
│   ├── auth/
│   │   └── session-management.md
│   └── ...
├── solutions/                          # Knowledge base (compounding)
│   ├── performance/
│   ├── security/
│   ├── database/
│   ├── testing/
│   ├── architecture/
│   ├── patterns/
│   └── decisions/                      # Party mode outputs
└── features/                           # Active features
    └── oauth/
        ├── REQUEST.md
        ├── research/
        │   └── RESEARCH.md
        ├── delta/
        │   ├── ADDED/
        │   ├── MODIFIED/
        │   └── REMOVED/
        ├── plan/
        │   ├── PLAN.md
        │   ├── eng.md
        │   ├── pm.md
        │   └── ux.md
        └── implement/
            └── IMPLEMENT.md
```

## License

MIT
