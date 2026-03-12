---
name: rpi-workflow
description: This skill should be used when the user wants to develop a feature systematically, asks "how do I start a new feature", "walk me through the workflow", "help me build this step by step", says "research plan implement", mentions TDD or test-driven development, mentions model profiles or model selection, or mentions any RPI command (/rpi:init, /rpi:new, /rpi:research, /rpi:plan, /rpi:implement, /rpi:test, /rpi:simplify, /rpi:status, /rpi:review, /rpi:docs, /rpi:add-todo, /rpi:set-profile).
version: 0.2.0
license: MIT
---

# RPI Workflow

RPI (Research → Plan → Implement) is a systematic feature development workflow with validation gates at each phase.

## Workflow Phases

### Phase 0: Init
Run `/rpi:init` once per project to configure:
- Feature folder location (default: `rpi/`)
- Default research tier
- Parallel threshold, commit style, and other preferences
- Creates `.rpi.yaml` at project root

### Phase 1: New Feature
Run `/rpi:new` to start. Adaptive interview:
- Start with core questions: what feature, what problem it solves
- Ask follow-ups based on answers (who uses it, complexity, constraints, references)
- Set up isolation based on `isolation` config:
  - `none`: work on current branch
  - `branch`: `git checkout -b feature/{slug}`
  - `worktree`: create `.worktrees/{slug}` with `git worktree add`
- Generate `{folder}/{feature-slug}/REQUEST.md` with structured sections

REQUEST.md sections: Summary, Problem, Target Users, Constraints, References, Complexity Estimate.

### Phase 2: Research
Run `/rpi:research {feature-slug}` with optional tier flag.

Research tiers control agent composition:
- `--quick`: requirement-parser + explore-codebase (feasibility only)
- `--standard` (default): + product-manager + senior-engineer (scope + approach)
- `--deep`: + cto-advisor + ux-designer if UI (full analysis + alternatives)

All selected agents run in **parallel fan-out**. Doc-synthesizer merges outputs into RESEARCH.md.

RESEARCH.md format:
1. Executive Summary (5 lines: verdict, complexity, risk, recommendation, key finding)
2. Requirements Analysis
3. Product Scope
4. Codebase Context
5. Technical Analysis
6. Strategic Assessment (deep tier only)
7. Alternatives (mandatory if NO-GO)

Verdicts: **GO**, **GO with concerns**, **NO-GO**
- NO-GO includes alternative approaches and scope reduction suggestions
- Override with `--force` flag

### Phase 3: Plan
Run `/rpi:plan {feature-slug}`.

Adaptive artifact generation:
- Always: PLAN.md (task checklist) + eng.md (technical spec)
- Adaptive: pm.md (user stories) and ux.md (user flows) — generated based on feature type
- After research, asks user to confirm which artifacts to generate

PLAN.md task format:
```markdown
## Phase 1: Phase Name

- [ ] **1.1** Task description
  Effort: S | Deps: none
  Files: src/path/to/file.ts
  Test: returns 200 for valid request with auth token

- [ ] **1.2** Another task
  Effort: M | Deps: 1.1
  Files: src/other/file.ts
  Test: rejects duplicate entries with 409 conflict
```

### Standalone: TDD
Run `/rpi:test {feature-slug}` to run TDD cycles on individual tasks.

- Works independently of `/rpi:implement` — use when you want TDD on specific tasks
- Strict RED → GREEN → REFACTOR per task, one test at a time
- Auto-detects test framework and conventions from the project
- Flags: `--task <id>` for single task, `--all` for all uncompleted tasks

### Phase 4: Implement
Run `/rpi:implement {feature-slug}`.

Smart execution mode:
- < 8 tasks: single plan-executor agent, sequential
- 8+ tasks: group into waves by dependency, execute in parallel
- Override: `--sequential` or `--parallel` flags

Pipeline per phase:
1. Execute tasks → commit per task
   - If TDD enabled: RED (write failing test) → VERIFY RED → GREEN (minimal code) → VERIFY GREEN → REFACTOR → commit
   - If TDD disabled: execute task → commit (original behavior)
2. Simplify (3 parallel sub-agents: reuse, quality, efficiency)
3. Review (code-reviewer checks against plan + test coverage)
4. Phase verdict: PASS or FAIL

IMPLEMENT.md tracks: task completion with commits, start/end times, files changed, deviations, simplify findings, review verdict.

After implementation, isolation cleanup runs based on config:
- `none`: nothing
- `branch`: asks to merge into main branch
- `worktree`: asks to merge + remove the worktree

## Configuration (.rpi.yaml)

```yaml
folder: rpi                    # Feature folder location
tier: standard                 # Default research tier
commit_style: conventional     # Commit message format
parallel_threshold: 8          # Task count for parallel mode
skip_artifacts: []             # Artifacts to never generate
isolation: none                # none | branch | worktree
tdd: false                     # Enable Test-Driven Development
test_runner: auto              # Test command (auto-detect or explicit)
session_isolation: auto        # auto | aggressive | off
max_tasks_per_session: 5       # tasks before warning/checkpoint
profile: balanced              # quality-first | balanced | speed-first | budget (optional)
models:                        # Per-phase overrides (optional, takes precedence over profile)
  # research: opus
  # plan: opus
  # implement: sonnet
  # review: opus
```

## Model Resolution Algorithm

When a command spawns an agent, it resolves which model to use for the Agent tool's `model` parameter. The algorithm is:

### Resolution Order

1. **Per-phase override**: If `.rpi.yaml` has a `models.{phase}` value, use it.
2. **Profile default**: If `.rpi.yaml` has a `profile` value, look up the model for this phase in the profile table below.
3. **Inherit parent**: If neither is set, omit the `model` parameter entirely. The agent inherits the parent session's model (current default behavior).

### Profile Lookup Table

| Profile | research | plan | implement | review |
|---------|----------|------|-----------|--------|
| `quality-first` | opus | opus | opus | opus |
| `balanced` | opus | opus | sonnet | opus |
| `speed-first` | sonnet | sonnet | sonnet | sonnet |
| `budget` | haiku | sonnet | haiku | sonnet |

Note: The budget profile uses haiku for research and implement phases.
Research quality may degrade with haiku -- research agents require structured
analysis with citations and evidence. Recommended for small or simple features only.

### Phase-to-Command Mapping

| Phase | Commands |
|-------|----------|
| `research` | `/rpi:research` |
| `plan` | `/rpi:plan` |
| `implement` | `/rpi:implement`, `/rpi:test`, `/rpi:simplify` |
| `review` | `/rpi:review`, `/rpi:docs` |

Commands without a phase (`/rpi:init`, `/rpi:new`, `/rpi:status`, `/rpi:add-todo`, `/rpi:onboarding`, `/rpi:set-profile`) do not use model resolution. `/rpi:onboarding` spawns agents but always inherits the parent model -- it is not a workflow phase.

### Validation

Valid model names: `opus`, `sonnet`, `haiku`.

If a `models.{phase}` value or a `profile` value in `.rpi.yaml` is invalid:
- Log a warning: `Warning: Invalid model "{value}" for {phase} phase. Falling back to parent model.`
- Omit the `model` parameter (inherit parent model).
- Do NOT stop execution.

If `profile` is set to an unrecognized name:
- Log a warning: `Warning: Unknown profile "{value}". Valid profiles: quality-first, balanced, speed-first, budget. Falling back to parent model.`
- Treat all phases as "inherit parent".

### Status Messages

When a model is resolved (not inherited), the command outputs once before spawning agents:
```
Profile: {profile} | {phase} phase -> {model}
```

When inheriting the parent model (no profile, no override), output nothing extra -- this preserves current behavior silently.

## Feature Folder Structure

```
{folder}/{feature-slug}/
├── REQUEST.md
├── research/
│   └── RESEARCH.md
├── plan/
│   ├── PLAN.md
│   ├── pm.md          (adaptive)
│   ├── ux.md          (adaptive)
│   └── eng.md
└── implement/
    ├── IMPLEMENT.md
    ├── checkpoints/    (per-task status files)
    └── sessions/       (session boundary records)
```

## Session Isolation

RPI automatically manages session boundaries to prevent context drift in large features.

### How It Works

After `/rpi:plan`, the system computes a **context weight** from task count, files touched, and dependency depth. This determines the isolation tier:

| Tier | Context Weight | Behavior |
|---|---|---|
| 1 (Inline) | <= 8 | Single session, no checkpoints |
| 2 (File-mediated) | 9-18 | Single session, warns after N tasks |
| 3 (Wave-isolated) | > 18 | Multiple sessions, forced checkpoints per wave |

### Agent Communication

Agents write results to per-task checkpoint files in `implement/checkpoints/`. The orchestrator reads only 1-line status summaries — full agent output never accumulates in the session context.

Each agent receives only: its specific task + eng.md. No conversation history, no full plan, no research output.

### Deviation Handling

Agents classify deviations by severity:
- **cosmetic** (naming, formatting): auto-accepted
- **interface** (changed signatures): flags downstream tasks
- **scope** (did more/less): blocks for human decision

### Resuming

`/rpi:implement {slug} --resume` reads checkpoint files and continues from the last incomplete task with a fresh session context.

## Cross-Session Continuity

All state lives in markdown files. When resuming:
- `/rpi:status` shows all features with current phase, progress, tier, and session count
- `/rpi:implement` reads checkpoint files and resumes from last completed task
- Multiple features can be in progress simultaneously

## Related

For agent behavioral guidelines, see the **rpi-agents** skill or individual agent files in `agents/`.
