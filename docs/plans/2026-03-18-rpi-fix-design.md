# /rpi:fix — Design

## Overview

A single command for bugfixes. Runs Luna → Mestre → Forge in sequence with bug-optimized prompts. Creates the same artifacts as the normal pipeline (`REQUEST.md`, `PLAN.md`, `IMPLEMENT.md`) but more compact. Each task generates a commit.

**Input:** `/rpi:fix auth-crash` or `/rpi:fix` (prompts for slug)
**Scope:** Bugfixes only. If it's a feature, redirect to `/rpi:new`.

## Flow

```
/rpi:fix {slug}
  │
  ├─ 1. Parse config (.rpi.yaml) + create directories
  │
  ├─ 2. Luna (bugfix mode)
  │     → 1 question: "Describe the bug: what happens, what should happen, where?"
  │     → Generates compact REQUEST.md with "## Bug Report" section
  │
  ├─ 3. Mestre (compact mode)
  │     → No eng.md, no delta specs — only PLAN.md with 1-3 tasks
  │     → Reads REQUEST.md + codebase (via context.md)
  │     → If >3 tasks needed, stops and redirects to /rpi:new
  │
  ├─ 4. Forge (normal mode)
  │     → Executes tasks, commit per task
  │     → Generates IMPLEMENT.md
  │
  └─ 5. Summary
        → Completed tasks, commits, next steps
```

## Luna — Bugfix Mode

Single question instead of the standard 3-batch interview:

> "Describe the bug: what happens, what should happen, and where it manifests (file, endpoint, component — if you know)."

If the slug is already descriptive (e.g., `login-crash`, `missing-validation`), Luna skips asking what the bug is — goes straight to details.

### REQUEST.md format (bugfix)

```markdown
# Fix: {slug}

## Bug Report
{bug description — what happens vs. what should happen}

## Location
{where it manifests — file, module, endpoint, or "Unknown"}

## Constraints
- {constraint if any, or "None identified"}

## Unknowns
- {at least one — e.g., "Root cause not confirmed"}

## Complexity Estimate
S — bugfix

## Quick Flow
This is a bugfix. Skipping research phase.
```

Differences from standard REQUEST.md:
- `## Bug Report` replaces `## Problem` and `## Target Users` (noise for bugs)
- `## Location` is new — gives Mestre a hint of where to look
- No `## References` section

## Mestre — Compact Mode

Receives REQUEST.md and generates **only PLAN.md** — no `eng.md`, no delta specs (`ADDED/`, `MODIFIED/`, `REMOVED/`).

Maximum **3 tasks**. If Mestre determines the fix needs more than 3, it stops:

> "This bug looks bigger than a fix. Consider using `/rpi:new {slug}` for the full pipeline."

### PLAN.md format (compact)

```markdown
# Plan: Fix {slug}

## Analysis
{2-3 sentences — probable root cause, affected files}

## Tasks

### Task 1: {description}
- Files: {files to change}
- Deps: none

### Task 2: {description}
- Files: {files to change}
- Deps: [1]

## Risks
- {if any, or "None — straightforward fix"}
```

No architecture sections, no design decisions, no alternatives. Mestre reads `context.md` and files indicated in `## Location` from REQUEST.md to understand context, and generates surgical tasks.

## Forge — Normal Mode

Forge runs exactly as in `/rpi:implement` — no changes. Receives the compact PLAN.md, executes task by task, commit per task, generates IMPLEMENT.md.

## Summary Output

```
Fix complete: {slug}

Tasks: {completed}/{total}
Commits:
- {hash1}: {task 1 description}
- {hash2}: {task 2 description}

Next:
- Review: /rpi:review {slug}
- Archive: /rpi:archive {slug}
- Full pipeline on this: /rpi {slug} --from=simplify
```

## Flags

| Flag | Effect |
|------|--------|
| `--resume` | If IMPLEMENT.md exists, resume from where it stopped |
| `--force` | Restart from scratch (overwrites existing artifacts) |

No `--quick` (already quick by nature), no `--skip` (no phases to skip).

## What It Does NOT Do

- Does not run research (Atlas/Scout) — overkill for bugfixes
- Does not generate eng.md or delta specs
- Does not run simplify/review/docs automatically
- If the bug is complex (>3 tasks), refuses and redirects to `/rpi:new`

## Agents Used

| Agent | Mode | Role |
|-------|------|------|
| Luna | bugfix | 1-question interview, compact REQUEST.md |
| Mestre | compact | PLAN.md only, max 3 tasks, no eng.md |
| Forge | normal | Execute tasks, commit per task |

## Artifacts Created

```
rpi/features/{slug}/
├── REQUEST.md          (bugfix format)
├── plan/
│   └── PLAN.md         (compact, 1-3 tasks)
└── implement/
    └── IMPLEMENT.md    (standard format)
```

No `research/`, no `delta/`, no `eng.md`.
