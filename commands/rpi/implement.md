---
name: rpi:implement
description: Execute the implementation plan with task-level tracking, smart parallelism, automatic simplification, and mandatory code review.
argument-hint: "<feature-slug> [--sequential|--parallel] [--skip-simplify] [--skip-review] [--resume] [--from-task <id>]"
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
- `--from-task {id}`: resume from a specific task ID (used with --resume)

## 2. Validate prerequisites

Read `{folder}/{feature-slug}/plan/PLAN.md`. If missing:
```
Plan not found. Run /rpi:plan {feature-slug} first.
```

Also read eng.md (and pm.md, ux.md if they exist) for full context.

## 2b. Detect session isolation tier

Read `session_isolation` from `.rpi.yaml` (default: `auto`).

If `session_isolation: off`, skip all isolation logic. Use current behavior.

If `session_isolation: aggressive`, set tier = 3 and max_tasks = 3.

If `session_isolation: auto`:
1. Read `## Metadata` section from PLAN.md
2. Extract `suggested_tier` and `context_weight`
3. If metadata section missing (old plans), compute from tasks:
   - Count tasks, unique files, max dependency depth
   - Calculate context_weight
4. Recalculate plan_hash from current file contents:
   ```bash
   cat {sorted existing files from PLAN.md tasks} | shasum -a 256 | cut -d' ' -f1
   ```
5. Compare with `plan_hash` from metadata. If different:
   ```
   Codebase has changed since planning.
   Changed files: {list files where content differs}
   Options:
   - Continue anyway (changes may be compatible)
   - Re-plan: /rpi:plan {feature-slug} --force
   - Review changes manually
   ```
   Use AskUserQuestion to let user decide.
6. Set tier and max_tasks_per_session based on context_weight:
   - Tier 1 (weight <= 8): max_tasks = unlimited
   - Tier 2 (weight 9-18): max_tasks = config value or 5
   - Tier 3 (weight > 18): max_tasks = config value or 4

Inform user:
```
Session isolation: Tier {N} (context weight: {weight})
{Tier 1: "Single session — no checkpoints needed"}
{Tier 2: "Session warning after {max_tasks} tasks"}
{Tier 3: "Forced checkpoints after each wave"}
```

## 3. Handle resume

If `--resume` or IMPLEMENT.md already exists:
1. Read all files in `{folder}/{feature-slug}/implement/checkpoints/`
2. Parse each checkpoint: extract task_id and status
3. Build completed set from checkpoints where status == "done"
4. If `--from-task {id}` specified, resume from that task
5. Otherwise, find first uncompleted task in PLAN.md order
6. Count completed tasks to determine session task counter start
7. Inform user: "Resuming from task {id}: {name} ({completed}/{total} done)"

If IMPLEMENT.md exists and no `--resume`:
- Ask user: "Implementation in progress ({N}/{total} tasks). Resume or restart?"

## 4. Initialize implementation directory

If starting fresh:
```bash
mkdir -p {folder}/{feature-slug}/implement/checkpoints
mkdir -p {folder}/{feature-slug}/implement/sessions
```

Create `{folder}/{feature-slug}/implement/IMPLEMENT.md`:

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

1. Read PLAN.md task details (files, deps, test spec if present)
2. Read eng.md for technical context

#### If TDD is enabled (`tdd: true` in config):

Follow strict RED → GREEN → REFACTOR per task:

**RED — Write failing test:**
3a. Launch test-engineer agent:
   ```
   You are the test-engineer agent for the RPI workflow.

   Read these files for context:
   - {folder}/{feature-slug}/plan/PLAN.md
   - {folder}/{feature-slug}/plan/eng.md

   Current task:
   **{task_id}** {task_description}
   Files: {files}
   Test: {test_spec from PLAN.md, if present}

   Write ONE failing test for this task.
   - Exercise real code through public interfaces
   - Clear, behavior-describing test name
   - Minimal assertions — one logical check
   - Follow project test conventions
   - Do NOT write implementation code
   ```

**VERIFY RED — Confirm correct failure:**
3b. Run the test:
   ```bash
   {test_runner} {test_file}
   ```
   - Test fails for expected reason → proceed
   - Test errors (syntax/import) → fix test, re-run
   - Test passes → behavior exists already, skip or ask user

**GREEN — Minimal implementation:**
3c. Launch plan-executor agent:
   ```
   You are implementing a single task using TDD.

   The following test is currently FAILING:
   {test_file}:{test_name}
   Failure: {failure_reason}

   Write the MINIMAL code to make this test pass.
   - Only touch files listed for this task
   - Do NOT add features beyond what the test requires
   - Match existing code style
   - If blocked, report the blocker — don't improvise
   ```

**VERIFY GREEN — Confirm pass:**
3d. Run the test again:
   ```bash
   {test_runner} {test_file}
   ```
   Run full suite to check regressions:
   ```bash
   {test_runner}
   ```
   - All pass → proceed to REFACTOR
   - Target fails → fix implementation (not the test), re-run
   - Other tests break → fix regressions first

**REFACTOR — Clean up:**
3e. Review implementation: remove duplication, improve names, extract helpers if 3+ uses.
   Re-run tests to confirm still green.

**Additional test cycles:**
3f. If the task has multiple test scenarios (from test spec or eng.md edge cases), repeat RED → GREEN → REFACTOR for each additional test before moving to next task.

#### If TDD is disabled (default):

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

#### After task completion (both modes):

4. Update IMPLEMENT.md:
   - Mark task as `[x]` with timestamp
   - Record files changed
   - Record any deviations
   - If TDD: record tests written and pass/fail status
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

## 12. Handle isolation cleanup

Read `isolation` from `.rpi.yaml`.

**If `isolation: none`** — do nothing.

**If `isolation: branch`:**
Ask the user:
```
Feature branch: feature/{feature-slug}
Want to merge into {main-branch} now? (yes/no)
```
If yes:
```bash
git checkout {main-branch}
git merge feature/{feature-slug}
```

**If `isolation: worktree`:**
Ask the user:
```
Worktree: .worktrees/{feature-slug}
Branch: feature/{feature-slug}
Want to merge into {main-branch} and remove the worktree? (yes/no)
```
If yes:
```bash
cd {project-root}
git checkout {main-branch}
git merge feature/{feature-slug}
git worktree remove .worktrees/{feature-slug}
```
If no:
```
Worktree preserved at .worktrees/{feature-slug}
To merge later:
  git checkout {main-branch} && git merge feature/{feature-slug}
To remove:
  git worktree remove .worktrees/{feature-slug}
```

</process>
