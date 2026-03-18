---
name: rpi:simplify
description: Razor analyzes the implementation for reuse, quality, and efficiency improvements.
argument-hint: "<feature-name>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
---

# /rpi:simplify — Simplify Phase

Razor analyzes the full implementation diff across 3 dimensions — reuse, quality, and efficiency — and applies improvements directly. Tests must pass before and after.

---

## Step 1: Load config and validate

1. Read `.rpi.yaml` for config. Apply defaults if missing:
   - `folder`: `rpi/features`
   - `context_file`: `rpi/context.md`
   - `commit_style`: `conventional`
2. Parse `$ARGUMENTS` to extract `{slug}`.
3. Validate `rpi/features/{slug}/implement/IMPLEMENT.md` exists. If not:
   ```
   IMPLEMENT.md not found for '{slug}'. Run /rpi:implement {slug} first.
   ```
   Stop.
4. Read `rpi/features/{slug}/implement/IMPLEMENT.md`. Verify all tasks are marked `[x]` (done). If any task is `[ ]` (pending) or `BLOCKED`:
   ```
   Implementation is not complete for '{slug}'. {N} tasks remaining.
   Complete all tasks before simplifying: /rpi:implement {slug}
   ```
   Stop.

## Step 2: Get implementation diff

1. Read `rpi/features/{slug}/implement/IMPLEMENT.md` — extract all commit hashes from the Execution Log.
2. Use git to get the combined diff of all implementation commits:
   ```bash
   git diff {first_commit}^..{last_commit}
   ```
3. Store the diff as `$IMPL_DIFF`.
4. Collect the list of all files changed — store as `$CHANGED_FILES`.

## Step 3: Gather context

1. Read `rpi/features/{slug}/plan/eng.md` if it exists — store as `$ENG`.
2. Read `rpi/context.md` (project context) if it exists — store as `$CONTEXT`.

## Step 4: Run tests (baseline)

1. Run the project's test suite to establish baseline:
   ```bash
   npm test    # or whatever the project uses
   ```
2. If tests fail before simplification:
   ```
   Tests are already failing before simplification. Fix failing tests first.
   ```
   Stop.
3. Store the test output as `$BASELINE_TESTS`.

## Step 5: Launch Razor with 3 parallel sub-checks

Launch Razor agent with this prompt:

```
You are Razor. Simplify the implementation for feature: {slug}

## Implementation Diff
{$IMPL_DIFF}

## Changed Files
{$CHANGED_FILES}

## Engineering Spec
{$ENG}

## Project Context
{$CONTEXT}

Your task — analyze the implementation across 3 dimensions IN PARALLEL:

### 1. Reuse
- Scan for duplicated code within the changed files
- Scan for duplication against existing codebase utilities
- Identify extraction opportunities (shared functions, constants, types)
- Check for reimplemented functionality that already exists in the project

### 2. Quality
- Naming: unclear variable/function names, inconsistent conventions
- Complexity: functions doing too much, deep nesting, long parameter lists
- Code smells: magic numbers, dead code, commented-out code, unnecessary abstractions
- Consistency: does the new code match the patterns in context.md?

### 3. Efficiency
- Algorithm choices: O(n^2) where O(n) is possible, unnecessary iterations
- Database/API queries: N+1 problems, missing batching, redundant calls
- Imports: unused imports, heavy imports where lighter alternatives exist
- Memory: unnecessary copies, large objects held in scope too long

RULES:
1. Read ALL changed files before making any modifications
2. Apply fixes directly to the code — do not just list suggestions
3. Each fix must preserve existing behavior (no functional changes)
4. Match the project's existing style and patterns
5. Do NOT over-abstract — only extract if there are 3+ duplications
6. After all fixes, list what you changed and why

Output format:
## Changes Applied
- {file}: {what changed} — {why}

## Metrics
- Reuse: {N} fixes
- Quality: {N} fixes
- Efficiency: {N} fixes
- Lines removed: {N}
- Lines added: {N}

After simplification, append your activity to rpi/features/{slug}/ACTIVITY.md:

### {current_date} — Razor (Simplify)
- **Action:** Simplified implementation for {slug}
- **Reuse fixes:** {count}
- **Quality fixes:** {count}
- **Efficiency fixes:** {count}
- **Lines removed:** {count}
- **Quality:** {your quality gate result}
```

Store Razor's output as `$RAZOR_OUTPUT`.

## Step 6: Run tests (verification)

1. Run the project's test suite again:
   ```bash
   npm test
   ```
2. If tests fail after Razor's changes:
   - Show the failing tests to the user.
   - Revert Razor's changes: `git checkout -- .`
   - Inform the user:
     ```
     Razor's changes broke {N} tests. Changes have been reverted.
     Review the failures and re-run: /rpi:simplify {slug}
     ```
   - Stop.
3. If all tests pass: continue.

## Step 7: Commit simplification changes

1. Stage all modified files:
   ```bash
   git add {list of files Razor modified}
   ```
2. Commit with a descriptive message following `commit_style` from config:
   ```bash
   git commit -m "refactor({slug}): simplify implementation — Razor"
   ```
3. Store the commit hash as `$SIMPLIFY_COMMIT`.

## Step 8: Update IMPLEMENT.md

Append a simplification results section to `rpi/features/{slug}/implement/IMPLEMENT.md`:

```markdown
## Simplify

Agent: Razor
Date: {YYYY-MM-DD}
Commit: {$SIMPLIFY_COMMIT}

### Changes
{list of changes from $RAZOR_OUTPUT}

### Metrics
- Reuse fixes: {N}
- Quality fixes: {N}
- Efficiency fixes: {N}
- Net lines: {+/-N}
```

## Step 9: Output summary

```
Simplify complete: {slug}

Razor applied {total} fixes:
  - Reuse: {N}
  - Quality: {N}
  - Efficiency: {N}

Tests: all passing
Commit: {$SIMPLIFY_COMMIT}

Next: /rpi {slug}
Or explicitly: /rpi:review {slug}
```
