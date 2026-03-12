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

## 2. Resolve feature path and validate prerequisites

Parse `{feature-slug}` from arguments.

**Resolution order:**
1. Check if `{folder}/{feature-slug}/` exists → type = "feature", path = `{folder}/{feature-slug}`
2. If not, Glob `{folder}/*/changes/{feature-slug}/` → if found, type = "change", path = matched path, parent_path = parent directory
3. If multiple matches → AskUserQuestion listing all matches with full paths
4. If no match → error: `Feature not found: {feature-slug}. Run /rpi:new {feature-slug} first.`

If `type == "change"`:
- Set `parent_path` to the parent feature directory
- Read parent artifacts for agent context:
  - `{parent_path}/REQUEST.md`
  - `{parent_path}/research/RESEARCH.md` (if exists)
  - `{parent_path}/plan/PLAN.md` (if exists)
  - `{parent_path}/plan/eng.md` (if exists)

Read `{path}/plan/PLAN.md`. If missing:
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

Initialize session task counter: `tasks_this_session = 0`

### 6a. Agent prompt template (all tiers)

For each task, construct the agent prompt:

```
You are the plan-executor agent for the RPI workflow.

## Pre-Implementation (MANDATORY)
Before writing ANY code, read ALL target files and output:
CONTEXT_READ: [list of files examined]
EXISTING_PATTERNS: [key patterns observed -- naming, error handling, imports]

## Your Task
**{task_id}** {task_description}
Effort: {effort}
Files: {files}
Test: {test_spec from PLAN.md, if present}

## Technical Context
{contents of eng.md}

If `type == "change"`, add:

## Parent Feature Context
{contents of parent artifacts read in step 2}

This is a CHANGE to an existing feature. When implementing:
- Ensure compatibility with existing parent feature code
- Flag breaking changes as scope deviations
- Reference parent architecture decisions from eng.md

## Rules
- Only touch files listed for this task
- Match patterns from CONTEXT_READ -- do not invent new patterns
- If blocked, report the blocker -- don't improvise
- Classify any deviations: cosmetic | interface | scope

## Output Protocol
Write checkpoint to `{folder}/{feature-slug}/implement/checkpoints/{task_id}.md`:

## Status: {task_id}
status: done | blocked | deviated
files_read: ["files examined"]
files_changed: ["files modified"]
commit: {hash}
deviations: none | {severity}: {description}
duration: {seconds}s
context_read: ["files from CONTEXT_READ"]
patterns_followed: ["observed patterns"]

Return single line: `DONE: {task_id} | files: N | deviations: none`
```

#### If TDD is enabled (`tdd: true` in config):

Before launching plan-executor, run TDD cycle per task:

**RED — Write failing test:**
Launch test-engineer agent:
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

**VERIFY RED:** Run test → must fail for expected reason.
**GREEN:** Launch plan-executor with the prompt template above, adding: "The following test is FAILING: {test_file}:{test_name}. Write MINIMAL code to pass it."
**VERIFY GREEN:** Run test + full suite → all pass.
**REFACTOR:** Clean up, re-run tests.
**Additional cycles:** Repeat RED → GREEN → REFACTOR for each test scenario.

### Tier 1 execution (Inline — weight <= 8):

For each task in order (respecting dependencies):
1. Launch plan-executor agent (foreground) with the prompt template
2. Agent returns full result
3. Extract status line from result. Discard rest.
4. Increment `tasks_this_session`
5. If config `commit_style` is `conventional`: verify agent committed, or stage and commit
6. Proceed to next task

### Tier 2 execution (File-mediated — weight 9-18):

For each task in order (respecting dependencies):
1. Launch plan-executor agent (foreground) with the prompt template
2. Agent writes checkpoint file and returns 1-line status
3. Parse status line only. Do NOT read the full agent response for context.
4. Increment `tasks_this_session`
5. If config `commit_style` is `conventional`: verify agent committed
6. **Session warning check**: if `tasks_this_session >= max_tasks_per_session`:
   ```
   Session getting long ({tasks_this_session} tasks completed).
   Consider starting a new session for better accuracy:
   /rpi:implement {feature-slug} --resume
   ```
   Continue if user wants to proceed.
7. Proceed to next task

### Tier 3 execution (Wave-isolated — weight > 18):

1. Group tasks by phase from PLAN.md
2. Within each phase, identify dependency waves:
   - Wave 1: tasks with no deps (or deps already completed)
   - Wave 2: tasks depending only on wave 1
   - Wave 3: tasks depending on waves 1-2
3. For each wave:
   a. Launch ALL wave tasks as parallel foreground agents (one message, multiple Agent calls)
   b. Each agent uses the prompt template
   c. Wait for all agents in wave to complete
   d. For each completed agent, parse status line only
   e. Increment `tasks_this_session` by wave size
   f. **Deviation check** (see section 6b)
   g. **Rollback check** (see section 6c)
4. After each wave, **forced session checkpoint** (see section 6d)

## 6b. Handle deviations

After each task (all tiers) or after each wave (Tier 3):

1. Parse the status line for deviations
2. If `deviations: none` — continue
3. If deviation reported, read the checkpoint file to get severity:
   - `cosmetic`: log in IMPLEMENT.md, continue automatically
   - `interface`:
     a. Read PLAN.md to find tasks that depend on the current task
     b. Check if any dependent task's `Files:` field overlaps with the deviated files
     c. If overlap: pause execution, ask user:
        ```
        Task {task_id} changed an interface ({description}).
        Downstream tasks that may be affected: {list}
        Options:
        - Continue (downstream agents will read the actual code)
        - Pause and review the change
        - Revert task {task_id} and re-plan
        ```
     d. If no overlap: log, continue
   - `scope`:
     a. Pause execution immediately
     b. Read full checkpoint file for details
     c. Ask user:
        ```
        Task {task_id} deviated in scope: {description}
        Options:
        - Accept the deviation and continue
        - Revert task {task_id}: git revert {commit_hash}
        - Stop implementation for manual review
        ```

## 6c. Rollback protocol (Tier 3 parallel waves only)

If any task in a wave reports `status: blocked`:

1. Identify the blocked task and its reason
2. Read PLAN.md dependency graph
3. Find completed tasks in the SAME wave that depend on the blocked task:
   ```
   invalidated = [t for t in wave_completed if blocked_task_id in t.deps]
   ```
4. For each invalidated task:
   a. Read its checkpoint file to get commit hash
   b. Run: `git revert {commit_hash} --no-commit`
   c. Update checkpoint file: `status: rolled_back`
5. If any reverts were staged:
   ```bash
   git commit -m "revert: rollback tasks {list} due to {blocked_task_id} failure"
   ```
6. Inform user:
   ```
   Task {blocked_task_id} blocked: {reason}
   Rolled back dependent tasks: {list}
   Kept independent tasks: {list}

   Fix the blocker and resume:
   /rpi:implement {feature-slug} --resume --from-task {blocked_task_id}
   ```
7. Stop execution (do not proceed to next wave)

## 6d. Session checkpoint

Triggered by:
- Tier 2: user agrees to take a break after session warning
- Tier 3: after every wave completes

### Checkpoint process:

1. **Aggregate IMPLEMENT.md** from checkpoint files:
   - Read all files in `{folder}/{feature-slug}/implement/checkpoints/`
   - Sort by task ID
   - Build IMPLEMENT.md with all task statuses, files changed, deviations
   - Preserve existing sections (Simplify Findings, Review) if present

2. **Write session record** to `{folder}/{feature-slug}/implement/sessions/session-{N}.md`:
   ```markdown
   # Session {N}
   Started: {timestamp}
   Ended: {timestamp}
   Tier: {tier}
   Tasks completed: {list of task IDs completed this session}
   Total progress: {completed}/{total}
   Next task: {next_task_id}
   Deviations: {summary or "none"}
   ```

3. **Print resume command**:
   ```
   Session checkpoint saved.
   Completed: {completed}/{total} tasks
   To continue in a new session:
   /rpi:implement {feature-slug} --resume
   ```

4. **For Tier 3: stop execution**. The user must start a new session.
   For Tier 2: continue if user wants to, or stop.

## 7. Phase checkpoint

After all tasks in a PLAN.md phase complete:

1. Read checkpoint files for all tasks in the phase
2. Count completed vs blocked vs deviated
3. Output:
   ```
   Phase {N}: {Phase Name}
   Tasks: {completed}/{total}
   Commits: {list from checkpoint files}
   Deviations: {count by severity}
   ```
4. If any tasks blocked, ask user how to proceed before next phase

## 8. Run simplify (unless --skip-simplify)

If `auto_simplify` is true in config (and no `--skip-simplify`):

Run the simplify process as defined in `/rpi:simplify {feature-slug}`.
Record findings in IMPLEMENT.md under "## Simplify Findings".

## 9. Run review (unless --skip-review)

If `review_after_implement` is true in config (and no `--skip-review`):

Run the review process as defined in `/rpi:review {feature-slug}`.
Record verdict in IMPLEMENT.md under "## Review".

## 10. Finalize IMPLEMENT.md

Rebuild IMPLEMENT.md from all checkpoint files:
1. Read all files in `checkpoints/`
2. Build task list with statuses, commits, deviations
3. Append summary:

```markdown
## Summary

Completed: {timestamp}
Total tasks: {N}
Sessions: {count from sessions/ directory}
Commits: {list with hashes from checkpoints}
Deviations: {count by severity}

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

## 11b. Cross-phase session boundary (Tier 3 only)

If tier == 3, after presenting the final result, add:

```
This was a large feature (Tier 3). For future features of this complexity,
consider running each RPI phase in a separate session:
1. Session 1: /rpi:new + /rpi:research
2. Session 2: /rpi:plan
3. Session 3+: /rpi:implement --resume (one session per wave)
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
