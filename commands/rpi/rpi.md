---
name: rpi
description: Auto-progress a feature to its next phase. Detects current state and runs the appropriate step.
argument-hint: "<feature-name> [--skip=phase] [--from=phase] [--force]"
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

# /rpi — Auto-Flow

Detects the current phase of a feature and runs the next step automatically.

---

## Step 1: Load config and parse arguments

1. Read `.rpi.yaml` for config. Apply defaults if missing:
   - `folder`: `rpi/features`
2. Parse `$ARGUMENTS` to extract:
   - `{slug}` — the feature name (required)
   - `--skip=phase` — skip a specific phase and detect the next one
   - `--from=phase` — override detection, start from this phase
   - `--force` — pass through to the delegated command

If `{slug}` is not provided, ask with AskUserQuestion: "Which feature? Provide the slug (e.g. 'oauth', 'dark-mode')."

## Step 2: Validate feature exists

Check if `rpi/features/{slug}/` exists and contains `REQUEST.md`.

If the directory does not exist:
```
Feature '{slug}' not found. Run /rpi:new {slug} to start.
```
Stop.

If the directory exists but `REQUEST.md` is missing:
```
Feature '{slug}' has no REQUEST.md. This shouldn't happen. Run /rpi:new {slug} to recreate it.
```
Stop.

## Step 3: Detect current phase

Check which artifacts exist to determine the next phase:

1. Has `REQUEST.md`, no `research/RESEARCH.md` AND no `plan/PLAN.md` → next = **research**
2. Has `research/RESEARCH.md`, no `plan/PLAN.md` → next = **plan**
3. Has `plan/PLAN.md`, no `implement/IMPLEMENT.md` → next = **implement**
4. Has `implement/IMPLEMENT.md` but NOT all tasks checked (`- [x]`) → next = **implement** (with `--resume`)
5. Has `implement/IMPLEMENT.md` with all tasks complete, no "## Simplify" section in IMPLEMENT.md → next = **simplify**
6. Has simplify done, no "## Review Verdict" section in IMPLEMENT.md → next = **review**
7. Has "## Review Verdict" with PASS, no `docs/` output generated → next = **docs**
8. Everything done → feature is complete

### Detection details

For step 4: Read `implement/IMPLEMENT.md` and check if any `- [ ]` (unchecked tasks) remain. If all tasks are `- [x]`, the implementation is complete.

For step 5: Check if IMPLEMENT.md contains a `## Simplify` section. If not, simplify has not been run yet.

For step 6: Check if IMPLEMENT.md contains a `## Review Verdict` section. If not, review has not been run yet.

For step 7: Check if IMPLEMENT.md contains a `## Review Verdict` section with "PASS". Then check if docs have been generated (look for mention of docs completion in IMPLEMENT.md or a generated docs artifact).

## Step 4: Apply --skip flag

If `--skip=phase` was provided:
- If the detected next phase matches the skipped phase, advance to the phase after it using the same detection logic.
- Valid phase names: `research`, `plan`, `implement`, `simplify`, `review`, `docs`.
- If the skip target is invalid, inform the user and stop.

## Step 5: Apply --from flag

If `--from=phase` was provided:
- Override the detected phase. Set next = the specified phase.
- Valid phase names: `research`, `plan`, `implement`, `simplify`, `review`, `docs`.
- If the from target is invalid, inform the user and stop.
- This is useful for re-running a phase (e.g., after fixing issues).

## Step 6: Handle completion

If no next phase was detected (everything is done):
```
{slug} is complete! All phases done.

To archive: /rpi:archive {slug}
To re-run a phase: /rpi {slug} --from=phase
```
Stop.

## Step 7: Announce and delegate

Output what is about to happen:

```
{slug} -> next: {phase}
Starting {phase} phase...
```

Then delegate to the appropriate command:

1. Read `commands/rpi/{phase}.md`
2. Follow its process section exactly, passing through the `{slug}` and any relevant flags (like `--force`, `--resume`)

The auto-flow command does NOT duplicate phase logic. It detects the state, announces the next step, and then executes the full process defined in the corresponding command file.

### Phase-to-command mapping

| Phase      | Command file          | Key artifacts                    |
|------------|-----------------------|----------------------------------|
| REQUEST    | `commands/rpi/new.md` | `REQUEST.md`                     |
| RESEARCH   | `commands/rpi/research.md` | `research/RESEARCH.md`      |
| PLAN       | `commands/rpi/plan.md`     | `plan/PLAN.md`              |
| IMPLEMENT  | `commands/rpi/implement.md`| `implement/IMPLEMENT.md`    |
| simplify   | `commands/rpi/simplify.md` | Simplify section in IMPLEMENT.md |
| review     | `commands/rpi/review.md`   | Review Verdict in IMPLEMENT.md   |
| docs       | `commands/rpi/docs.md`     | Generated documentation          |
