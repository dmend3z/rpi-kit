---
name: rpi:fix
description: Quick bugfix — Luna interviews, Mestre plans (max 3 tasks), Forge implements. One command.
argument-hint: "<bug-slug> [--resume] [--force]"
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

# /rpi:fix — Quick Bugfix

Runs Luna → Mestre → Forge in one step for bugfixes. Creates compact artifacts with max 3 tasks. Each task generates a commit.

---

## Step 1: Load config and parse arguments

1. Read `.rpi.yaml` for config. Apply defaults if missing:
   - `folder`: `rpi/features`
   - `context_file`: `rpi/context.md`
   - `commit_style`: `conventional`
2. Parse `$ARGUMENTS` to extract:
   - `{slug}` — the bug name (required)
   - `--resume`: continue from last completed task if IMPLEMENT.md exists
   - `--force`: restart from scratch (overwrites existing artifacts)
3. If `{slug}` is not provided, ask with AskUserQuestion: "What's the bug? Give it a short slug (e.g. 'login-crash', 'missing-validation')."
4. Convert slug to kebab-case (lowercase, spaces/underscores become hyphens, strip special chars).

## Step 2: Check for existing feature

Check if `{folder}/{slug}/` already exists.

If it exists and `--force` was NOT passed:
- Check if `implement/IMPLEMENT.md` exists:
  - If yes and `--resume` was passed (or default): skip to Step 6 (resume implementation).
  - If yes and `--force` was NOT passed: ask the user: "Feature '{slug}' already exists. Resume implementation (--resume) or start over (--force)?"
- If no IMPLEMENT.md: ask the user: "Feature '{slug}' already exists but implementation hasn't started. Overwrite? (yes/no)"

If it exists and `--force` was passed: proceed (will overwrite).

## Step 3: Create directory structure

```bash
mkdir -p {folder}/{slug}/plan
mkdir -p {folder}/{slug}/implement
```

No `research/` directory. No `delta/` directories.

## Step 4: Luna — Bugfix Interview

Adopt Luna's persona. This is a bugfix interview — fast and focused.

### If slug is descriptive (e.g. `login-crash`, `null-pointer-auth`):

Ask one question with AskUserQuestion:
> "Descreve o bug: o que acontece, o que deveria acontecer, e onde se manifesta (ficheiro, endpoint, componente — se souberes)."

### If slug is vague (e.g. `fix1`, `bug`):

Ask two questions with AskUserQuestion:
> 1. "Qual é o bug?"
> 2. "Onde se manifesta? (ficheiro, endpoint, componente — se souberes)"

### Generate REQUEST.md

Write `{folder}/{slug}/REQUEST.md`:

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

Output:
```
REQUEST.md created: {folder}/{slug}/REQUEST.md
Starting plan phase...
```

## Step 5: Mestre — Compact Plan

Launch Mestre agent with this prompt:

```
You are Mestre. Generate a compact bugfix plan for: {slug}

## Bug Report (REQUEST.md)
{content of REQUEST.md}

## Project Context
{content of context.md if it exists, otherwise "No project context file found."}

## Instructions
1. Read the files mentioned in the Location section of the bug report
2. Analyze the probable root cause
3. Generate a PLAN.md with maximum 3 tasks
4. Each task must list exact files to change and dependencies
5. Be surgical — only fix the bug, no refactoring, no improvements

IMPORTANT: If you determine this bug needs more than 3 tasks, output ONLY:
"ESCALATE: This bug is too complex for /rpi:fix. Use /rpi:new {slug} for the full pipeline."
Do NOT generate a plan in this case.

Output using this format:

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

After generating the plan, append your activity to {folder}/{slug}/ACTIVITY.md:

### {current_date} — Mestre (Fix — Compact Plan)
- **Action:** Compact bugfix plan for {slug}
- **Tasks:** {count}
- **Quality:** {your quality gate result}
```

### Handle Mestre's response

If Mestre outputs `ESCALATE:`:
```
This bug needs more than 3 tasks — too complex for /rpi:fix.

Use the full pipeline: /rpi:new {slug}
```
Stop.

If Mestre outputs a valid plan:
1. Write `{folder}/{slug}/plan/PLAN.md` with Mestre's output.
2. Output:
   ```
   PLAN.md created: {folder}/{slug}/plan/PLAN.md ({N} tasks)
   Starting implementation...
   ```

## Step 6: Forge — Implementation

For each task in PLAN.md order, respecting dependency ordering:

### Step 6a: Initialize IMPLEMENT.md (if not resuming)

Write `{folder}/{slug}/implement/IMPLEMENT.md`:

```markdown
# Implementation: Fix {slug}

Started: {YYYY-MM-DD}
Plan: {folder}/{slug}/plan/PLAN.md

## Tasks

- [ ] Task {1}: {description}
- [ ] Task {2}: {description}
- ...

## Execution Log
```

### Step 6b: Handle resume

If resuming (IMPLEMENT.md exists):
1. Read IMPLEMENT.md, find next unchecked task `- [ ]`.
2. Output: `Resuming '{slug}' from task {next_task_id}. ({completed}/{total} tasks done)`

### Step 6c: Execute each task

Launch Forge agent for each task:

```
You are Forge. Implement task {task_id} for bugfix: {slug}

## Task
{task description from PLAN.md}

## Target Files
{files listed for this task}

## Dependencies Completed
{list of completed task IDs and their descriptions}

## Bug Report
{content of REQUEST.md}

## Project Context
{content of context.md if it exists}

CRITICAL RULES:
1. CONTEXT_READ: You MUST read ALL target files before writing ANY code
2. Match existing patterns — naming, error handling, imports, style
3. Only touch files listed in the task unless absolutely necessary
4. Commit your changes with a conventional commit message
5. Report: DONE | BLOCKED | DEVIATED

After completing the task, append your activity to {folder}/{slug}/ACTIVITY.md:

### {current_date} — Forge (Fix — Task {task_id})
- **Action:** Implemented task {task_id} for {slug}
- **Files changed:** {list}
- **Status:** {DONE|BLOCKED|DEVIATED}
- **Quality:** {your quality gate result}
```

### Step 6d: Parse Forge response

**DONE:**
1. Update IMPLEMENT.md: `- [ ] Task {id}` → `- [x] Task {id}`
2. Append to Execution Log:
   ```
   ### Task {id}: {description}
   - Status: DONE
   - Commit: {hash}
   - Files: {list of files changed}
   ```
3. Continue to next task.

**BLOCKED:**
1. Update IMPLEMENT.md with blocker.
2. Output:
   ```
   Fix blocked at task {id}: {description}

   Blocker: {reason}

   Options:
   - Fix the blocker and run: /rpi:fix {slug} --resume
   - Use the full pipeline: /rpi:new {slug}
   ```
3. Stop.

**DEVIATED:**
1. Cosmetic: log it, continue automatically.
2. Interface/scope: warn the user, ask to accept or revert.
3. If accepted: update IMPLEMENT.md as DONE with deviation noted.
4. If reverted: git revert, task stays unchecked. Stop.

## Step 7: Completion summary

After all tasks completed, output:

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

Update IMPLEMENT.md with a final section:

```markdown
## Summary

- Total tasks: {N}
- Completed: {N}
- Blocked: {N}
- Deviations: {N}
- Completed: {YYYY-MM-DD}
```
