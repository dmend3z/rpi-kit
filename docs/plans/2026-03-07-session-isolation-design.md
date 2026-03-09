# Anti-Hallucination Session Isolation for RPI

**Date:** 2026-03-07
**Status:** Approved
**Scope:** Preventive architecture to eliminate context-driven hallucination in the RPI workflow

## Problem

As features grow larger, the orchestrator session accumulates context from agents across all phases (research, plan, implement). Context growth is the primary failure mode — not task complexity. More context means more drift, cross-task confusion, and quality degradation.

## Core Principle

Every design decision minimizes orchestrator context accumulation while maximizing agent autonomy through filesystem-mediated communication. Agents resolve dependencies by reading code state, not conversation state.

---

## 1. Adaptive Tier Detection

Tier is computed from PLAN.md metadata using a composite heuristic:

```
context_weight = task_count + (total_files_touched * 0.5) + (max_dependency_depth * 2)

Tier 1 (Inline):         context_weight <= 8
Tier 2 (File-mediated):  context_weight 9-18
Tier 3 (Wave-isolated):  context_weight > 18
```

### Two-Phase Detection

1. `/rpi:plan` computes and writes suggested tier + raw metrics into PLAN.md metadata:

```markdown
## Metadata
tasks: 9 | files: 23 | max_depth: 3
context_weight: 26.5
suggested_tier: 3
plan_hash: sha256:<hash of files listed in tasks>
```

2. `/rpi:implement` recalculates at start. If codebase changed since planning (file hash drift), it may override the suggested tier.

### Phase Boundary Rules (Adaptive)

| Complexity | Research -> Plan | Plan -> Implement | Within Implement |
|---|---|---|---|
| S (weight <= 8) | Same session | Same session | No boundaries |
| M (weight 9-18) | Same session | Same session | Warning after 5 tasks |
| L (weight 19-30) | Session boundary | Session boundary | Checkpoint every 5 tasks |
| XL (weight > 30) | Session boundary | Session boundary | Checkpoint every 4 tasks |

---

## 2. Agent Communication Protocol

All tiers use **foreground agents with parallel waves**. No background agents — reliability and visibility over speed.

### Tier 1 — Inline (small features, weight <= 8)

- Single session, sequential tasks
- Agent returns full result
- Orchestrator extracts structured status, discards verbose output
- No checkpoint files

### Tier 2 — File-Mediated (medium features, weight 9-18)

- Single session, sequential tasks
- Agent writes per-task checkpoint file + returns 1-line status
- Orchestrator carries only status lines forward
- Session warning after `max_tasks_per_session` (default: 5)

### Tier 3 — Wave-Isolated (large features, weight > 18)

- Multiple sessions with forced checkpoints
- Parallel waves: independent tasks launch as concurrent foreground agents (one message, multiple Agent calls)
- Each agent writes its own checkpoint file
- Session boundary forced after each wave
- Resume command printed at each boundary

---

## 3. Agent Prompt Template

All tiers use this template. Key enforcement: the `CONTEXT_READ` step is mandatory.

```markdown
You are implementing a single task from the RPI plan.

## Pre-Implementation (MANDATORY)
Before writing ANY code, read the target files and output:
CONTEXT_READ: [list of files examined]
EXISTING_PATTERNS: [key patterns observed -- naming, error handling, imports]

## Your Task
**{task_id}** {task_description}
Effort: {effort}
Files: {files}
Test: {test_spec}

## Technical Context
{contents of eng.md}

## Rules
- Only touch files listed for this task
- Match patterns from CONTEXT_READ -- do not invent new patterns
- If blocked, report the blocker -- don't improvise
- When done, write checkpoint file and return status line

## Deviation Classification
If you deviate from the task, classify the severity:
- cosmetic: naming, formatting changes (auto-accepted)
- interface: changed signatures, added parameters (flags downstream tasks)
- scope: did more or less than specified (blocks, requires human decision)

## Output Protocol
Write to `{folder}/{feature-slug}/implement/checkpoints/{task_id}.md`:

    ## Status: {task_id}
    status: done | blocked | deviated
    files_read: ["src/existing/file.ts"]
    files_changed: ["src/api/handler.ts", "src/types/index.ts"]
    commit: {hash}
    deviations: none | {severity}: {description}
    duration: {seconds}s
    context_read: ["file1.ts", "file2.ts"]
    patterns_followed: ["error handling via AppError class", "barrel exports"]

Return to orchestrator: `DONE: {task_id} | files: N | deviations: none`
```

### Context Scoping

Each task agent receives ONLY:
- Its specific task from PLAN.md (not the full plan)
- eng.md for technical context
- Access to read actual codebase files (sees real state from previous tasks)

Does NOT receive: conversation history, previous agent outputs, full RESEARCH.md, or PLAN.md.

### Context Read Enforcement

If an agent's checkpoint file does not contain a `context_read` field, the orchestrator flags it as a quality concern and may re-run the task with explicit read instructions.

---

## 4. Deviation Taxonomy

| Severity | Example | Orchestrator Action |
|---|---|---|
| cosmetic | Renamed variable for clarity | Auto-accept, log in checkpoint |
| interface | Changed function signature, added parameter | Check dependency graph. If downstream tasks reference changed interface: pause wave, ask user |
| scope | Implemented more or less than specified | Block. Require human decision: accept, revert, or re-plan |

Orchestrator logic:
```
if deviation.severity == "cosmetic": log, continue
if deviation.severity == "interface":
    downstream = tasks_depending_on(task_id)
    impacted = [t for t in downstream if t.files intersects deviation.files]
    if impacted: pause + ask_user("Task {task_id} changed an interface. Downstream tasks {impacted} may be affected.")
    else: log, continue
if deviation.severity == "scope": pause + ask_user
```

---

## 5. File Structure

```
{folder}/{feature-slug}/implement/
    IMPLEMENT.md              # Aggregated view (built from checkpoints)
    checkpoints/
        1.1.md               # Per-task checkpoint (permanent audit trail)
        1.2.md
        2.1.md
        ...
    sessions/
        session-001.md        # Session boundary record
        session-002.md
```

- **Checkpoint files** stay permanently as audit trail
- **IMPLEMENT.md** is rebuilt by reading all checkpoint files (aggregated view)
- **Session files** record: which tasks ran, start/end time, tier used, resume command

---

## 6. Rollback Protocol

Each checkpoint file records its commit hash. Rollback is surgical and dependency-aware.

When a task fails in a parallel wave:

1. Read dependency graph from PLAN.md
2. Identify invalidated tasks: any completed task in the same wave that depends on the failed task
3. For each invalidated task:
   - Read checkpoint file to get commit hash
   - `git revert {commit_hash} --no-commit`
   - Update checkpoint: `status: rolled_back`
4. Stage and commit all reverts: `revert: rollback tasks {list} due to {failed_task_id} failure`
5. Inform user:
   ```
   Task 3.2 blocked. Rolled back dependent tasks: 3.4, 3.5
   Task 3.3 has no dependency on 3.2 -- kept.
   Fix 3.2 and re-run: /rpi:implement {slug} --resume --from-task 3.2
   ```

Tasks with no dependency on the failed task are kept.

---

## 7. eng.md Drift Detection

### At Plan Time

Hash the content of files listed in PLAN.md tasks:
```
plan_hash = sha256(concat(sorted content of all files listed in task Files fields))
```

Written into PLAN.md metadata.

### At Implement Time (start or resume)

```
current_hash = sha256(concat(sorted content of same files))
if current_hash != plan_hash:
    warn user with list of changed files
    options: continue | re-plan | review manually
```

---

## 8. Session Boundaries & Resume

### Warning (Tier 2)

After `max_tasks_per_session` tasks:
```
Session getting long (5 tasks completed).
Consider starting a new session for better accuracy:
/rpi:implement {feature-slug} --resume
```

### Forced Checkpoint (Tier 3)

After each wave or threshold:

1. Aggregate checkpoint files into IMPLEMENT.md
2. Write session record to `sessions/session-{N}.md`:
   ```markdown
   # Session {N}
   Started: {timestamp}
   Ended: {timestamp}
   Tier: 3
   Tasks completed: 1.1, 1.2, 1.3, 2.1, 2.2
   Next task: 2.3
   Deviations: none
   ```
3. Print resume command:
   ```
   Session checkpoint saved.
   Completed: 5/12 tasks
   To continue in a new session:
   /rpi:implement {feature-slug} --resume
   ```

### Resume Logic

`/rpi:implement {slug} --resume`:
1. Read all checkpoint files in `checkpoints/`
2. Parse completed task IDs
3. Recalculate plan_hash for eng.md drift detection
4. Identify next uncompleted task
5. Continue from that task with fresh orchestrator context

---

## 9. Configuration

Single toggle with sensible auto-detection:

```yaml
# .rpi.yaml
session_isolation: auto    # auto | aggressive | off
max_tasks_per_session: 5   # override auto-calculated limit (Tier 2/3 only)
```

- **auto** (default): tier detected from plan metrics, thresholds apply
- **aggressive**: always Tier 3, checkpoint every 3 tasks, session boundaries between all phases
- **off**: current behavior, no isolation

---

## Implementation Scope

### Files to modify:
- `commands/rpi/implement.md` — add tier detection, checkpoint protocol, session boundaries, rollback
- `commands/rpi/plan.md` — add metadata section with context_weight and plan_hash
- `commands/rpi/status.md` — read checkpoint files for richer status
- `skills/rpi-workflow/SKILL.md` — document session isolation in workflow overview
- `agents/plan-executor.md` — update prompt template with CONTEXT_READ and checkpoint output

### Files to create:
- No new command files needed — all behavior integrates into existing commands

### Config changes:
- Add `session_isolation` and `max_tasks_per_session` to `.rpi.yaml` schema
