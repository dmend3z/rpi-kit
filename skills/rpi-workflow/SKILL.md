---
name: rpi-workflow
description: This skill should be used when the user wants to develop a feature systematically, asks "how do I start a new feature", "walk me through the workflow", "help me build this step by step", says "research plan implement", mentions TDD or test-driven development, or mentions any RPI command (/rpi:init, /rpi:new, /rpi:research, /rpi:plan, /rpi:implement, /rpi:test, /rpi:simplify, /rpi:status, /rpi:review, /rpi:docs, /rpi:add-todo).
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
auto_simplify: true            # Run simplify before review
commit_style: conventional     # Commit message format
parallel_threshold: 8          # Task count for parallel mode
skip_artifacts: []             # Artifacts to never generate
review_after_implement: true   # Mandatory review gate
isolation: none                # none | branch | worktree
tdd: false                     # Enable Test-Driven Development
test_runner: auto              # Test command (auto-detect or explicit)
```

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
    └── IMPLEMENT.md
```

## Cross-Session Continuity

All state lives in markdown files. When resuming:
- `/rpi:status` shows all features with current phase and progress
- `/rpi:implement` reads IMPLEMENT.md and resumes from last completed task
- Multiple features can be in progress simultaneously

## Related

For agent behavioral guidelines, see the **rpi-agents** skill or individual agent files in `agents/`.
