# RPIKit

**Research → Plan → Implement.** A systematic feature development workflow for Claude Code and Codex.

RPIKit guides AI-first developers through a structured 3-phase pipeline with validation gates, multi-role agent teams, and adaptive depth — so you research before you plan, and plan before you code.

## Install

### Claude Code

**From the marketplace (recommended):**

```bash
claude plugin install rpi-kit
```

**From npm:**

```bash
npm install -g rpi-kit
```

The postinstall script registers the plugin automatically. If it fails, register manually:

```bash
claude plugin install /path/to/rpi-kit
```

> **Tip:** `npm root -g` shows where global packages are installed. The path is usually something like `~/.nvm/versions/node/vX.X.X/lib/node_modules/rpi-kit`.

**From source:**

```bash
git clone https://github.com/dmend3z/rpi-kit.git
claude --plugin-dir ./rpi-kit
```

### Codex (OpenAI)

Copy `AGENTS.md` and `codex.md` to your project root. The workflow rules and agent definitions will be available to Codex automatically.

## Quick Start

```bash
# 1. Initialize config (once per project)
/rpi:init

# 2. Describe your feature
/rpi:new oauth2-auth

# 3. Research feasibility (GO/NO-GO verdict)
/rpi:research oauth2-auth

# 4. Generate implementation plan
/rpi:plan oauth2-auth

# 5. Build it (with automatic simplify + review)
/rpi:implement oauth2-auth
```

## Commands

| Command | Purpose |
|---------|---------|
| `/rpi:init` | Configure RPI for this project (folder, tier, preferences) |
| `/rpi:new` | Interactive interview → REQUEST.md |
| `/rpi:research` | Parallel agent research → RESEARCH.md + GO/NO-GO |
| `/rpi:plan` | Adaptive plan artifacts → PLAN.md + eng/pm/ux.md |
| `/rpi:implement` | Execute plan with task tracking + simplify + review |
| `/rpi:test` | TDD cycles (RED → GREEN → REFACTOR) per task |
| `/rpi:simplify` | Code simplification (reuse, quality, efficiency) |
| `/rpi:status` | Show all features and their current phase |
| `/rpi:review` | Code review against plan requirements + test coverage |

## Research Tiers

Control depth and cost with tier flags:

| Tier | Agents | Use when |
|------|--------|----------|
| `--quick` | 2 (requirements + codebase) | Small features, quick feasibility check |
| `--standard` | 4 (+ PM + engineer) | Default. Most features. |
| `--deep` | 5-6 (+ CTO + UX designer if UI) | Large features, risky changes, new architecture |

## Agent Team

RPIKit simulates a product team with 11 specialized agents:

| Agent | Perspective |
|-------|-------------|
| Requirement Parser | Structured requirements, unknowns, implicit needs |
| Product Manager | Scope, user stories, effort, acceptance criteria |
| UX Designer | User flows, interaction patterns, existing components |
| Senior Engineer | Architecture, dependencies, technical decisions |
| CTO Advisor | Risk assessment, strategic alignment, alternatives |
| Doc Synthesizer | Merges research into executive summary + verdict |
| Codebase Explorer | Scans existing code for patterns and context |
| Plan Executor | Implements tasks surgically, one at a time |
| Test Engineer | Writes failing tests before implementation (TDD) |
| Code Simplifier | Reuse, quality, efficiency checks with direct fixes |
| Code Reviewer | Reviews against plan requirements + test coverage |

All agents follow behavioral constraints inspired by [Karpathy's coding guidelines](https://x.com/karpathy/status/2015883857489522876): cite evidence, name unknowns, be concrete, stay in scope.

## Test-Driven Development

RPIKit supports strict TDD workflows. When enabled, each task follows vertical slices:

```
RED (write one failing test) → VERIFY RED → GREEN (minimal code) → VERIFY GREEN → REFACTOR → commit
```

### Why vertical slices?

LLMs tend to write tests in bulk ("horizontal slices"), creating tests that mock internals and verify imagined behavior. Vertical slices force one-test-at-a-time cycles — if a test fails first, the implementation can't be faked.

### Enable TDD

```yaml
# .rpi.yaml
tdd: true
test_runner: auto  # or "npm test", "npx vitest", "pytest", etc.
```

### Two ways to use TDD

1. **Integrated:** Enable `tdd: true` in config. `/rpi:implement` automatically runs RED → GREEN → REFACTOR per task.
2. **Standalone:** Run `/rpi:test {feature-slug} --task 1.2` to TDD a specific task, or `--all` for all tasks.

### What changes with TDD enabled

- **PLAN.md** includes a `Test:` field per task describing what behavior to verify
- **Implementation** writes a failing test first, verifies failure, then implements minimal code
- **Review** checks test coverage and verifies tests exercise real code through public interfaces

## Feature Folder Structure

Each feature lives in its own folder (configurable via `.rpi.yaml`):

```
{folder}/{feature-slug}/        # folder defaults to rpi/
├── REQUEST.md              # What and why
├── research/
│   └── RESEARCH.md         # GO/NO-GO analysis
├── plan/
│   ├── PLAN.md             # Task checklist with effort + deps
│   ├── eng.md              # Technical specification
│   ├── pm.md               # Product requirements (adaptive)
│   └── ux.md               # UX design (adaptive)
└── implement/
    └── IMPLEMENT.md        # Full audit trail
```

## Configuration

Run `/rpi:init` or create `.rpi.yaml` manually:

```yaml
folder: rpi                    # Feature folder location
tier: standard                 # Default research tier
auto_simplify: true            # Run simplify before review
commit_style: conventional     # Commit message format
parallel_threshold: 8          # Task count for parallel mode
skip_artifacts: []             # Artifacts to never generate
review_after_implement: true   # Mandatory review gate
isolation: none                # none | branch | worktree
tdd: false                     # Enable Test-Driven Development
test_runner: auto              # Test command (auto-detect or explicit)
```

## How It Compares

| | OpenSpec (OPSX) | RPIKit | GSD |
|---|---|---|---|
| Focus | Spec-driven artifacts | Feature lifecycle with gates | Full project management |
| Phases | Fluid (propose/apply) | 3 phases (R→P→I) | Roadmap → phases → tasks |
| Agents | None | 11 specialized roles | 15+ orchestrated agents |
| TDD | None | Integrated RED→GREEN→REFACTOR | None |
| Validation | None | GO/NO-GO research gate | Goal-backward verification |
| Scope | Single change | Single feature | Entire project |
| Complexity | Lightweight | Medium | Heavy |

## License

MIT

## Credits

Inspired by [GSD](https://github.com/gsd), [OpenSpec](https://github.com/Fission-AI/OpenSpec), and [Andrej Karpathy's coding guidelines](https://x.com/karpathy/status/2015883857489522876).
