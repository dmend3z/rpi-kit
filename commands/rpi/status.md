---
name: rpi:status
description: Show all features, their current phase, and progress.
argument-hint: "[feature-name]"
allowed-tools:
  - Read
  - Glob
  - Bash
---

# /rpi:status — Feature Status Dashboard

Show all active features with their current phase, verdict, and progress. Optionally show detailed view for a specific feature.

---

## Step 1: Load config

Read `.rpi.yaml` for config. Apply defaults if missing:
- `folder`: `rpi/features`

Parse `$ARGUMENTS` to extract optional `{slug}` for detailed view.

## Step 2: Find all features

Glob `{folder}/*/REQUEST.md` to find all active features.

If no features found:
```
No features found. Run /rpi:new to start.
```
Stop.

## Step 3: Detect phase for each feature

For each feature directory found, determine the current phase by checking which artifacts exist:

1. Has `REQUEST.md`, no `research/RESEARCH.md` → phase = **request** (next: research)
2. Has `research/RESEARCH.md`, no `plan/PLAN.md` → phase = **research** (next: plan)
3. Has `plan/PLAN.md`, no `implement/IMPLEMENT.md` → phase = **plan** (next: implement)
4. Has `implement/IMPLEMENT.md` with unchecked tasks (`- [ ]`) → phase = **implement** (in progress)
5. Has `implement/IMPLEMENT.md` with all tasks checked, no "## Simplify" section → phase = **implement** (next: simplify)
6. Has "## Simplify" section, no "## Review Verdict" section → phase = **simplify** (next: review)
7. Has "## Review Verdict" with PASS → phase = **review** (next: docs)
8. Everything done → phase = **complete**

## Step 4: Gather metadata per feature

For each feature:

### Verdict
- Read `research/RESEARCH.md` if it exists. Look for `## Verdict` section. Extract: GO | GO with concerns | NO-GO.
- If no RESEARCH.md: verdict = "pending"

### Complexity
- Read `REQUEST.md`. Look for `## Complexity Estimate` section. Extract: S | M | L | XL.
- If not found: complexity = "unknown"

### Task progress (if plan/implement exists)
- Read `plan/PLAN.md` if it exists. Count total tasks (lines matching `- [ ]` or `- [x]` pattern).
- Read `implement/IMPLEMENT.md` if it exists. Count completed tasks (`- [x]`) vs total.
- Express as: `{completed}/{total} tasks`

## Step 5: Display status

### If no specific feature requested (overview mode)

Output a status card per feature, sorted by phase (most advanced first):

```
# RPI Status

## {feature-slug}
Phase: {phase} {task_progress if applicable}
Verdict: {verdict}
Complexity: {complexity}

## {feature-slug-2}
Phase: {phase}
Verdict: {verdict}
Complexity: {complexity}

---
{total_count} feature(s) active
```

Phase display format:
- `request` → "request (awaiting research)"
- `research` → "research (awaiting plan)"
- `plan` → "plan (awaiting implement)"
- `implement` → "implement ({completed}/{total} tasks)"
- `simplify` → "simplify (awaiting review)"
- `review` → "review (awaiting docs)"
- `complete` → "complete"

### If specific feature requested (detailed mode)

If `{slug}` was provided in arguments, show detailed view for that feature:

```
# RPI Status: {slug}

Phase: {phase} {task_progress}
Verdict: {verdict}
Complexity: {complexity}

## Artifacts
- REQUEST.md: {exists/missing}
- research/RESEARCH.md: {exists/missing}
- plan/PLAN.md: {exists/missing}
- plan/eng.md: {exists/missing}
- plan/pm.md: {exists/missing}
- plan/ux.md: {exists/missing}
- implement/IMPLEMENT.md: {exists/missing}
- delta/: {count of files in ADDED + MODIFIED + REMOVED}

## Tasks
{If PLAN.md exists, list all tasks with their status: [x] or [ ]}

## Review
{If Review Verdict exists in IMPLEMENT.md, show verdict and finding counts}

## Next
{Suggest the next command to run, e.g. "/rpi {slug}" or "/rpi:archive {slug}" if complete}
```

If the requested feature does not exist:
```
Feature '{slug}' not found. Available features:
- {list of existing feature slugs}
```
