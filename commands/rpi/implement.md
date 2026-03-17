---
name: rpi:implement
description: Execute the plan task by task with Forge. Sage assists with tests if TDD enabled.
argument-hint: "<feature-name> [--resume] [--force]"
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

# /rpi:implement — Implement Phase

Execute PLAN.md task by task. Forge implements each task with strict CONTEXT_READ discipline. If TDD is enabled, Sage writes failing tests before Forge implements.

---

## Step 1: Load config and validate

1. Read `.rpi.yaml` for config. Apply defaults if missing:
   - `folder`: `rpi/features`
   - `context_file`: `rpi/context.md`
   - `tdd`: `false`
   - `commit_style`: `conventional`
2. Parse `$ARGUMENTS` to extract `{slug}` and optional flags:
   - `--resume`: continue from last completed task (default behavior when IMPLEMENT.md exists)
   - `--force`: restart implementation from scratch even if IMPLEMENT.md exists
3. Validate `rpi/features/{slug}/plan/PLAN.md` exists. If not:
   ```
   PLAN.md not found for '{slug}'. Run /rpi:plan {slug} first.
   ```
   Stop.

## Step 2: Gather context

1. Read `rpi/features/{slug}/plan/PLAN.md` — store as `$PLAN`.
2. Read `rpi/features/{slug}/plan/eng.md` if it exists — store as `$ENG`.
3. Read `rpi/context.md` (project context) if it exists — store as `$CONTEXT`.
4. Parse `$PLAN` to extract the ordered task list. Each task should have:
   - `task_id`: task number/identifier
   - `description`: what to implement
   - `files`: target files to create or modify
   - `deps`: dependencies on other tasks (must be completed first)

## Step 3: Handle resume vs fresh start

### If IMPLEMENT.md exists and `--force` was NOT passed:

1. Read `rpi/features/{slug}/implement/IMPLEMENT.md`.
2. Parse completed tasks: lines matching `- [x]` are done, `- [ ]` are pending.
3. Find the next incomplete task — this is where execution resumes.
4. Inform the user:
   ```
   Resuming '{slug}' from task {next_task_id}. ({completed}/{total} tasks done)
   ```
5. Skip to Step 5 starting from the next incomplete task.

### If IMPLEMENT.md exists and `--force` was passed:

1. Ask the user: "IMPLEMENT.md already exists for '{slug}'. This will restart from scratch. Continue? (yes/no)"
2. If no: stop.
3. If yes: proceed to Step 4 (will overwrite).

### If IMPLEMENT.md does not exist:

Proceed to Step 4.

## Step 4: Initialize IMPLEMENT.md

1. Ensure directory exists: `rpi/features/{slug}/implement/`
2. Write `rpi/features/{slug}/implement/IMPLEMENT.md` with all tasks unchecked:

```markdown
# Implementation: {Feature Title}

Started: {YYYY-MM-DD}
Plan: rpi/features/{slug}/plan/PLAN.md

## Tasks

- [ ] Task {1}: {description}
- [ ] Task {2}: {description}
- ...

## Execution Log
```

## Step 5: Execute tasks in order

For each task in PLAN.md order, respecting dependency ordering (a task's deps must all be `[x]` before it runs):

### Step 5a: TDD — Sage writes tests (if `tdd: true` in config)

Launch Sage agent with this prompt:

```
You are Sage. Write failing tests for task {task_id} of feature: {slug}

## Task
{task description from PLAN.md}

## Target Files
{files listed for this task}

## Engineering Spec
{$ENG}

## Project Context
{$CONTEXT}

Your task:
1. Read existing test files and test patterns in the project
2. Write tests that verify the expected behavior for this task
3. Tests MUST fail right now (the implementation doesn't exist yet)
4. Cover: happy path, error path, at least one edge case
5. Run the tests and confirm they fail
6. Output: test file path, test code, and the failing test output
```

Wait for Sage to complete. Store the test output as `$SAGE_TESTS`. Verify the tests actually fail — if they pass, something is wrong (the behavior may already exist). Inform the user and ask how to proceed.

### Step 5b: Launch Forge to implement

Launch Forge agent with this prompt:

```
You are Forge. Implement task {task_id} for feature: {slug}

## Task
{task description from PLAN.md}

## Target Files
{files listed for this task}

## Dependencies Completed
{list of completed task IDs and their descriptions}

## Engineering Spec
{$ENG}

## Project Context
{$CONTEXT}

## Tests to Pass
{$SAGE_TESTS if TDD enabled, otherwise "No TDD tests — follow the plan."}

CRITICAL RULES:
1. CONTEXT_READ: You MUST read ALL target files before writing ANY code
2. Match existing patterns — naming, error handling, imports, style
3. Only touch files listed in the task unless absolutely necessary
4. If TDD: make the failing tests pass
5. Commit your changes with a conventional commit message
6. Report: DONE | BLOCKED | DEVIATED
```

### Step 5c: Parse Forge response

Forge will respond with one of three statuses:

#### DONE

1. Task completed successfully.
2. Extract the commit hash from Forge's commit.
3. If TDD enabled: verify tests now pass. If tests still fail, inform the user and ask how to proceed.
4. Update IMPLEMENT.md: change `- [ ] Task {id}` to `- [x] Task {id}` and append to Execution Log:
   ```
   ### Task {id}: {description}
   - Status: DONE
   - Commit: {hash}
   - Files: {list of files changed}
   ```
5. Continue to next task.

#### BLOCKED

1. Forge could not complete the task.
2. Update IMPLEMENT.md with blocker details:
   ```
   ### Task {id}: {description}
   - Status: BLOCKED
   - Reason: {blocker description from Forge}
   ```
3. Stop execution. Inform the user:
   ```
   Implementation blocked at task {id}: {description}

   Blocker: {reason}

   Options:
   - Fix the blocker and run: /rpi:implement {slug} --resume
   - Skip this task and continue: /rpi:implement {slug} (after manually marking task as skipped)
   - Re-plan: /rpi:plan {slug} --force
   ```
4. Do NOT continue to the next task.

#### DEVIATED

1. Forge deviated from the plan.
2. Check the deviation severity:
   - **cosmetic** (naming, formatting): log it, continue automatically.
   - **interface** (API changes, function signatures): warn the user, ask to accept or revert.
   - **scope** (extra features, different approach): stop execution, ask the user to accept or revert.
3. If accepted: update IMPLEMENT.md as DONE with deviation noted:
   ```
   ### Task {id}: {description}
   - Status: DONE (with deviation)
   - Commit: {hash}
   - Deviation: {severity} — {description}
   - Files: {list of files changed}
   ```
4. If reverted: Forge's changes are reverted (git revert), task stays unchecked. Inform the user and stop.

## Step 6: Completion summary

After all tasks are completed, output:

```
Implementation complete: {slug}

Tasks: {completed}/{total}
Commits:
- {hash1}: {task 1 description}
- {hash2}: {task 2 description}
- ...

{If any deviations: list them here}

Next: /rpi {slug}
Or explicitly: /rpi:simplify {slug}
```

Update IMPLEMENT.md with a final section:

```markdown
## Summary

- Total tasks: {N}
- Completed: {N}
- Blocked: {N}
- Deviations: {N} ({list severities})
- Completed: {YYYY-MM-DD}
```
