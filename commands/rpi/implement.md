---
name: rpi:implement
description: Execute the implementation plan with task-level tracking, smart parallelism, automatic simplification, and mandatory code review.
argument-hint: "<feature-slug> [--sequential|--parallel] [--skip-simplify] [--skip-review] [--resume]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
  - AskUserQuestion
---

<objective>
Execute tasks from PLAN.md with per-task commits, automatic code simplification, and mandatory code review. Track everything in IMPLEMENT.md.
</objective>

<process>

## 1. Load config and parse arguments

Read `.rpi.yaml` for configuration.
Parse `$ARGUMENTS`:
- First argument: `{feature-slug}` (required)
- `--sequential`: force single agent mode
- `--parallel`: force parallel wave mode
- `--skip-simplify`: skip the simplify step (overrides config)
- `--skip-review`: skip the review step (overrides config)
- `--resume`: resume from last completed task in existing IMPLEMENT.md

## 2. Validate prerequisites

Read `{folder}/{feature-slug}/plan/PLAN.md`. If missing:
```
Plan not found. Run /rpi:plan {feature-slug} first.
```

Also read eng.md (and pm.md, ux.md if they exist) for full context.

## 3. Handle resume

If `--resume` or IMPLEMENT.md already exists:
- Read IMPLEMENT.md
- Parse completed tasks (lines with `[x]`)
- Identify next uncompleted task
- Inform user: "Resuming from task {id}: {name}"

If IMPLEMENT.md exists and no `--resume`:
- Ask user: "Implementation in progress ({N}/{total} tasks). Resume or restart?"

## 4. Initialize IMPLEMENT.md

If starting fresh, create `{folder}/{feature-slug}/implement/IMPLEMENT.md`:

```markdown
# Implementation: {Feature Title}

Started: {timestamp}

## Tasks

{Copy task checklist from PLAN.md with all boxes unchecked}

## Deviations

_None yet._

## Simplify Findings

_Pending._

## Review

_Pending._
```

## 5. Determine execution mode

Count total uncompleted tasks.

If `--sequential` flag: single agent mode.
If `--parallel` flag: wave mode.
Otherwise, use smart default:
- < {parallel_threshold from config, default 8} tasks → single agent
- >= threshold → parallel waves

## 6. Execute tasks

### Single agent mode:

For each task in order (respecting dependencies):

1. Read PLAN.md task details (files, deps)
2. Read eng.md for technical context
3. Launch plan-executor agent:
   ```
   You are implementing a single task from the RPI plan.

   Read these files for context:
   - {folder}/{feature-slug}/plan/PLAN.md
   - {folder}/{feature-slug}/plan/eng.md
   - {additional plan files if they exist}

   Current task:
   **{task_id}** {task_description}
   Effort: {effort} | Files: {files}

   Rules:
   - Only touch files listed for this task
   - Match existing code style
   - If blocked, report the blocker — don't improvise
   - When done, report: files changed, any deviations
   ```
4. After agent completes, update IMPLEMENT.md:
   - Mark task as `[x]` with timestamp
   - Record files changed
   - Record any deviations
5. If config `commit_style` is `conventional`:
   - Stage changed files
   - Commit: `{type}({task_id}): {task_description}`

### Parallel wave mode:

1. Group tasks by phase from PLAN.md
2. Within each phase, identify dependency waves:
   - Wave 1: tasks with no deps (or deps already completed)
   - Wave 2: tasks depending only on wave 1
   - Wave 3: tasks depending on waves 1-2
3. For each wave, launch all tasks as parallel agents
4. Wait for all wave agents to complete
5. Update IMPLEMENT.md with all completed tasks
6. Proceed to next wave

## 7. Phase checkpoint

After all tasks in a phase complete:

Output:
```
Phase {N}: {Phase Name}
Tasks: {completed}/{total}
Commits: {list}
```

If any tasks failed or were blocked, ask user how to proceed.

## 8. Run simplify (unless --skip-simplify)

If `auto_simplify` is true in config (and no `--skip-simplify`):

Run the simplify process as defined in `/rpi:simplify {feature-slug}`.
Record findings in IMPLEMENT.md under "## Simplify Findings".

## 9. Run review (unless --skip-review)

If `review_after_implement` is true in config (and no `--skip-review`):

Run the review process as defined in `/rpi:review {feature-slug}`.
Record verdict in IMPLEMENT.md under "## Review".

## 10. Finalize IMPLEMENT.md

Update IMPLEMENT.md with:
```markdown
## Summary

Completed: {timestamp}
Total tasks: {N}
Commits: {list with hashes}
Phases: {M}

## Review Verdict: {PASS|FAIL}
{details}
```

## 11. Present result

If PASS:
```
Feature {feature-slug} implemented.
{N} tasks completed across {M} phases.
Review: PASS

All artifacts: {folder}/{feature-slug}/
```

If FAIL:
```
Feature {feature-slug} implementation complete but review found issues:
{list issues}

Fix and re-run: /rpi:review {feature-slug}
```

</process>
