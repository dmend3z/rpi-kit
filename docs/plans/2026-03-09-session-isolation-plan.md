# Session Isolation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add adaptive session isolation to the RPI workflow so the orchestrator never accumulates enough context to hallucinate.

**Architecture:** All changes are to markdown command/agent/skill files — no runtime code. The orchestrator (Claude Code) reads these files as instructions. Session isolation is implemented by changing the instructions the orchestrator follows: when to launch agents, what context to give them, when to checkpoint, and when to stop.

**Tech Stack:** Markdown (command definitions, agent specs, skill docs), YAML (config schema)

---

## Task 1: Add session_isolation config to /rpi:init

**Files:**
- Modify: `commands/rpi/init.md:36-42` (Batch 3 questions)
- Modify: `commands/rpi/init.md:47-60` (YAML template)

**Step 1: Add session isolation question to Batch 3**

In `commands/rpi/init.md`, add a new question to Batch 3 (after the isolation question):

```markdown
**Batch 3:**
- "Task count threshold for parallel execution?" — Options: 8 (Recommended), 5, 12, always sequential
- "How do you want to isolate features?" — Options: `none` (Recommended — work on current branch), `branch` (create a git branch per feature), `worktree` (create a git worktree + branch in `.worktrees/`)
- "Session isolation to prevent context drift?" — Options: `auto` (Recommended — adapts to feature complexity), `aggressive` (always checkpoint, maximum isolation), `off` (no session boundaries)
```

**Step 2: Add new fields to YAML template**

In the `.rpi.yaml` template section, add after `test_runner`:

```yaml
session_isolation: {auto|aggressive|off}
max_tasks_per_session: 5      # tasks before session warning (Tier 2) or forced checkpoint (Tier 3)
```

**Step 3: Verify the full YAML template looks correct**

Read the file and confirm both new fields are present and the comments are clear.

**Step 4: Commit**

```bash
git add commands/rpi/init.md
git commit -m "feat(init): add session_isolation and max_tasks_per_session config options"
```

---

## Task 2: Add Metadata section to /rpi:plan

**Files:**
- Modify: `commands/rpi/plan.md:122-152` (section 7 — PLAN.md generation)
- Modify: `commands/rpi/plan.md:155-173` (sections 8 and 9 — write artifacts and present summary)

**Step 1: Add metadata computation instructions after PLAN.md generation**

In `commands/rpi/plan.md`, after section 7 (Generate PLAN.md) and before section 8 (Write all artifacts), insert a new section:

```markdown
## 7b. Compute plan metadata

After PLAN.md is generated, compute session isolation metrics:

1. Count total tasks in PLAN.md
2. Count unique files across all task `Files:` fields
3. Calculate max dependency depth:
   - For each task, follow its `Deps:` chain to find the longest path
   - Depth = longest chain length (task with no deps = depth 0)
4. Compute context weight:
   ```
   context_weight = task_count + (total_files * 0.5) + (max_depth * 2)
   ```
5. Determine suggested tier:
   - context_weight <= 8: tier 1
   - context_weight 9-18: tier 2
   - context_weight > 18: tier 3
6. Compute plan hash:
   - Collect all files listed in task `Files:` fields
   - For files that exist: read content, sort by path, concatenate
   - For files to be created: skip (they don't exist yet)
   - Hash the concatenated content with sha256
   ```bash
   cat {sorted existing files} | shasum -a 256 | cut -d' ' -f1
   ```

Append to the top of PLAN.md (after the title, before Phase 1):

```markdown
## Metadata
tasks: {count} | files: {count} | max_depth: {depth}
context_weight: {weight}
suggested_tier: {1|2|3}
plan_hash: {sha256_hash}
```
```

**Step 2: Update the PLAN.md task format in section 7 to include explicit guidance about the metadata**

In the senior-engineer agent prompt within section 7, add to the Rules:

```markdown
- After generating all tasks, count total tasks, unique files, and max dependency depth
- These metrics will be used for session isolation tier detection
```

**Step 3: Update section 9 (Present plan summary) to include tier info**

Update the output template:

```markdown
Plan created for {feature-slug}:
- PLAN.md: {N} tasks across {M} phases
- eng.md: Technical specification
{- pm.md: Product requirements (if generated)}
{- ux.md: UX design (if generated)}

Session isolation: Tier {1|2|3} (context weight: {weight})
{If tier 1: "Small feature — single session recommended"}
{If tier 2: "Medium feature — session warning after {max_tasks_per_session} tasks"}
{If tier 3: "Large feature — session checkpoints will be enforced"}

Next: /rpi:implement {feature-slug}
```

**Step 4: Read the modified file and verify all sections flow correctly**

Confirm sections 7, 7b, 8, 9 are coherent and the metadata computation is unambiguous.

**Step 5: Commit**

```bash
git add commands/rpi/plan.md
git commit -m "feat(plan): compute context_weight, suggested_tier, plan_hash metadata for session isolation"
```

---

## Task 3: Update plan-executor agent with CONTEXT_READ and checkpoint protocol

**Files:**
- Modify: `agents/plan-executor.md` (full rewrite of execution_flow and report sections)

**Step 1: Add CONTEXT_READ to the execution flow**

Replace section `### 1. Read context` with:

```markdown
### 1. Pre-Implementation Context Read (MANDATORY)
- Read ALL target files listed in the task's `Files:` field
- Read eng.md for technical approach
- Output before ANY code changes:
  ```
  CONTEXT_READ: [list of files examined]
  EXISTING_PATTERNS: [key patterns observed -- naming, error handling, imports]
  ```
- Match these patterns in your implementation — do not invent new patterns
```

**Step 2: Add deviation taxonomy to rules**

Add to the `<rules>` section:

```markdown
8. Classify deviations by severity:
   - `cosmetic`: naming, formatting changes (auto-accepted, log only)
   - `interface`: changed function signatures, added/removed parameters (flags downstream tasks)
   - `scope`: did more or less than specified (blocks execution, requires human decision)
9. Write a per-task checkpoint file after completion (see Output Protocol)
```

**Step 3: Replace the Report section with checkpoint output protocol**

Replace the existing `### 5. Report` section:

```markdown
### 5. Write checkpoint and report

Write checkpoint file to `{folder}/{feature-slug}/implement/checkpoints/{task_id}.md`:

```markdown
## Status: {task_id}
status: done | blocked | deviated
files_read: ["list of files read in pre-implementation"]
files_changed: ["list of files created or modified"]
commit: {commit_hash}
deviations: none | {severity}: {description}
duration: {estimated_seconds}s
context_read: ["files from CONTEXT_READ step"]
patterns_followed: ["patterns from EXISTING_PATTERNS step"]
```

Return to orchestrator (single line only):
```
DONE: {task_id} | files: {N} changed | deviations: none
```

Or if blocked:
```
BLOCKED: {task_id} | reason: {short description}
```
```

**Step 4: Read the full file to verify coherence**

Confirm the execution flow is: context read -> verify deps -> implement -> verify -> checkpoint + report.

**Step 5: Commit**

```bash
git add agents/plan-executor.md
git commit -m "feat(plan-executor): add CONTEXT_READ enforcement, deviation taxonomy, checkpoint protocol"
```

---

## Task 4: Update /rpi:implement — tier detection and checkpoint directory setup

This is the largest change. Split into Tasks 4-8 to keep each focused.

**Files:**
- Modify: `commands/rpi/implement.md:20-31` (section 1 — config parsing)
- Modify: `commands/rpi/implement.md:33-52` (sections 2-3 — validation and resume)

**Step 1: Add --from-task flag to argument parsing**

In section 1, update the argument list:

```markdown
Parse `$ARGUMENTS`:
- First argument: `{feature-slug}` (required)
- `--sequential`: force single agent mode
- `--parallel`: force parallel wave mode
- `--skip-simplify`: skip the simplify step (overrides config)
- `--skip-review`: skip the review step (overrides config)
- `--resume`: resume from last completed task in existing IMPLEMENT.md
- `--from-task {id}`: resume from a specific task ID (used with --resume)
```

**Step 2: Add tier detection after prerequisite validation**

Insert new section after section 2 (Validate prerequisites):

```markdown
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
```

**Step 3: Add checkpoint directory creation**

In section 4 (Initialize IMPLEMENT.md), add directory creation:

```markdown
## 4. Initialize implementation directory

If starting fresh:
```bash
mkdir -p {folder}/{feature-slug}/implement/checkpoints
mkdir -p {folder}/{feature-slug}/implement/sessions
```

Create `{folder}/{feature-slug}/implement/IMPLEMENT.md`:
{existing template unchanged}
```

**Step 4: Update resume logic for checkpoint files**

In section 3 (Handle resume), update to read checkpoint files:

```markdown
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
```

**Step 5: Read the modified sections and verify flow**

Confirm sections 1, 2, 2b, 3, 4 are coherent.

**Step 6: Commit**

```bash
git add commands/rpi/implement.md
git commit -m "feat(implement): add tier detection, drift check, checkpoint dirs, resume from checkpoints"
```

---

## Task 5: Update /rpi:implement — agent prompt template per tier

**Files:**
- Modify: `commands/rpi/implement.md:89-189` (section 6 — execute tasks)

**Step 1: Replace the single agent prompt with tier-aware prompts**

Replace the existing section 6 agent prompts with:

```markdown
## 6. Execute tasks

Initialize session task counter: `tasks_this_session = 0`

### Agent prompt template (all tiers)

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

### Tier 1 execution (Inline):

For each task in order (respecting dependencies):
1. Launch plan-executor agent (foreground) with the prompt template
2. Agent returns full result
3. Extract status line from result. Discard rest.
4. Increment `tasks_this_session`
5. If config `commit_style` is `conventional`: verify agent committed, or stage and commit
6. Proceed to next task

### Tier 2 execution (File-mediated):

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

### Tier 3 execution (Wave-isolated):

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
```

**Step 2: Read the modified section and verify all three tier paths are clear**

**Step 3: Commit**

```bash
git add commands/rpi/implement.md
git commit -m "feat(implement): add tier-aware agent execution with context-minimized prompts"
```

---

## Task 6: Update /rpi:implement — deviation handling and rollback

**Files:**
- Modify: `commands/rpi/implement.md` (insert new sections 6b, 6c after section 6)

**Step 1: Add deviation handling section**

Insert after the tier execution logic:

```markdown
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
```

**Step 2: Add rollback protocol section**

Insert after deviation handling:

```markdown
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
```

**Step 3: Read and verify the new sections integrate with the existing flow**

**Step 4: Commit**

```bash
git add commands/rpi/implement.md
git commit -m "feat(implement): add deviation taxonomy handling and dependency-aware rollback protocol"
```

---

## Task 7: Update /rpi:implement — session checkpoints and aggregation

**Files:**
- Modify: `commands/rpi/implement.md` (insert section 6d, update sections 7-10)

**Step 1: Add session checkpoint section**

Insert after rollback:

```markdown
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
```

**Step 2: Update section 7 (Phase checkpoint) to read from checkpoint files**

Replace the existing section 7:

```markdown
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
```

**Step 3: Update section 10 (Finalize IMPLEMENT.md) to aggregate from checkpoints**

Update to:

```markdown
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
```

**Step 4: Read and verify sections 6d, 7, 10 are coherent with the rest**

**Step 5: Commit**

```bash
git add commands/rpi/implement.md
git commit -m "feat(implement): add session checkpoints, checkpoint aggregation, session records"
```

---

## Task 8: Update /rpi:implement — phase boundary suggestions for L/XL features

**Files:**
- Modify: `commands/rpi/implement.md` (update section 11 — present result)

**Step 1: Add phase boundary awareness to research and plan phases**

At the END of the implement command (after section 11), add:

```markdown
## 11b. Cross-phase session boundary (Tier 3 only)

If tier == 3, after presenting the final result, add:

```
This was a large feature (Tier 3). For future features of this complexity,
consider running each RPI phase in a separate session:
1. Session 1: /rpi:new + /rpi:research
2. Session 2: /rpi:plan
3. Session 3+: /rpi:implement --resume (one session per wave)
```
```

**Step 2: Verify the addition doesn't conflict with isolation cleanup in section 12**

**Step 3: Commit**

```bash
git add commands/rpi/implement.md
git commit -m "feat(implement): add cross-phase session boundary suggestion for Tier 3 features"
```

---

## Task 9: Update /rpi:status to read checkpoint files

**Files:**
- Modify: `commands/rpi/status.md:40-60` (section 4 — gather details)

**Step 1: Update the "If implementing" detail gathering**

Replace the implementing section:

```markdown
**If implementing:**
- Check for checkpoint files in `{folder}/{slug}/implement/checkpoints/`
- If checkpoints exist:
  - Read each checkpoint file, parse status and task_id
  - Count done / blocked / deviated / rolled_back
  - Identify current task (first unchecked in PLAN.md order that has no checkpoint)
  - Read latest session file in `sessions/` for session count and tier
- If no checkpoints (old-style):
  - Fall back to reading IMPLEMENT.md for `[x]` vs `[ ]` counts
- Check for review verdict in IMPLEMENT.md
```

**Step 2: Update the display card format in section 5**

Add tier and session info:

```markdown
## {feature-slug}
Phase: implement ({done}/{total} tasks)
Verdict: {GO|GO with concerns|NO-GO}
Complexity: {S|M|L|XL}
Tier: {1|2|3} (context weight: {weight})
Sessions: {count}
Current: Task {id} -- {name}
{Blocked: Task {id} -- {reason} (if any blocked)}
{Review: PASS|FAIL (if reviewed)}
```

**Step 3: Verify the status output is backward-compatible with features that don't have checkpoints**

**Step 4: Commit**

```bash
git add commands/rpi/status.md
git commit -m "feat(status): read checkpoint files for richer status with tier and session info"
```

---

## Task 10: Update rpi-workflow skill documentation

**Files:**
- Modify: `skills/rpi-workflow/SKILL.md:109-147` (Cross-Session Continuity and Configuration sections)

**Step 1: Add Session Isolation section**

After the Configuration section, add:

```markdown
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
```

**Step 2: Update the Configuration section to include new fields**

Add to the `.rpi.yaml` example:

```yaml
session_isolation: auto        # auto | aggressive | off
max_tasks_per_session: 5       # tasks before warning/checkpoint
```

**Step 3: Update the Feature Folder Structure**

Update the tree to show the new directories:

```
{folder}/{feature-slug}/
    REQUEST.md
    research/
        RESEARCH.md
    plan/
        PLAN.md
        pm.md          (adaptive)
        ux.md          (adaptive)
        eng.md
    implement/
        IMPLEMENT.md
        checkpoints/    (per-task status files)
        sessions/       (session boundary records)
```

**Step 4: Read and verify the skill doc is coherent end-to-end**

**Step 5: Commit**

```bash
git add skills/rpi-workflow/SKILL.md
git commit -m "docs(workflow): document session isolation tiers, agent communication, deviation handling"
```

---

## Task 11: Update AGENTS.md with checkpoint protocol

**Files:**
- Modify: `AGENTS.md:76-84` (Plan Executor section)

**Step 1: Update the Plan Executor rules**

Add rules 6-9 to the Plan Executor section:

```markdown
6. Before writing code, read ALL target files and output CONTEXT_READ and EXISTING_PATTERNS
7. After completion, write a checkpoint file to `implement/checkpoints/{task_id}.md` with structured status
8. Return a single status line to the orchestrator — do not return verbose output
9. Classify deviations as cosmetic (auto-accept), interface (flag downstream), or scope (block for human)
```

**Step 2: Verify consistency with agents/plan-executor.md**

Read both files and confirm rules match.

**Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs(agents): add checkpoint protocol and deviation taxonomy to plan-executor rules"
```

---

## Summary

| Task | File(s) | What |
|---|---|---|
| 1 | commands/rpi/init.md | Add config fields |
| 2 | commands/rpi/plan.md | Compute metadata + plan_hash |
| 3 | agents/plan-executor.md | CONTEXT_READ + checkpoint protocol |
| 4 | commands/rpi/implement.md | Tier detection + drift check + resume |
| 5 | commands/rpi/implement.md | Tier-aware agent prompts |
| 6 | commands/rpi/implement.md | Deviation handling + rollback |
| 7 | commands/rpi/implement.md | Session checkpoints + aggregation |
| 8 | commands/rpi/implement.md | Cross-phase boundary suggestion |
| 9 | commands/rpi/status.md | Read checkpoint files |
| 10 | skills/rpi-workflow/SKILL.md | Document session isolation |
| 11 | AGENTS.md | Update plan-executor rules |

**Dependency chain:** Task 1 (config) -> Task 2 (metadata) -> Task 3 (agent) -> Tasks 4-8 (implement, sequential) -> Task 9 (status) -> Tasks 10-11 (docs, parallel)
