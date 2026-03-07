---
name: rpi:simplify
description: Run code simplification on a feature's implementation. Checks for reuse opportunities, quality issues, and efficiency problems, then fixes them.
argument-hint: "<feature-slug>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
---

<objective>
Run 3 parallel code review sub-agents (reuse, quality, efficiency) on the implementation changes, aggregate findings, and fix issues directly.
</objective>

<process>

## 1. Load config and identify changes

Read `.rpi.yaml` for folder path.
Read `{folder}/{feature-slug}/implement/IMPLEMENT.md` to identify what was implemented.

Get the diff of all implementation changes:
```bash
git diff HEAD~{number_of_commits}
```

If no git history, use the files listed in IMPLEMENT.md tasks and read them directly.

## 2. Launch 3 parallel sub-agents

Use the Agent tool to launch all 3 concurrently in a single message.

### Agent 1: Reuse Checker

```
You are checking code for reuse opportunities.

Here is the diff of recent changes:
{diff}

For each change:
1. Search the codebase for existing utilities and helpers that could replace newly written code. Use Grep to find similar patterns — check utility directories, shared modules, and adjacent files.
2. Flag any new function that duplicates existing functionality. Cite the existing function.
3. Flag inline logic that could use an existing utility — hand-rolled string manipulation, manual path handling, custom type guards.

Output format:
## Reuse Findings
- {file}:{line} — {description} → Use existing `{function}` from `{path}`
```

### Agent 2: Quality Checker

```
You are checking code quality in recent changes.

Here is the diff of recent changes:
{diff}

Check for:
1. Redundant state — state that duplicates existing state, cached values that could be derived
2. Parameter sprawl — adding parameters instead of restructuring
3. Copy-paste with slight variation — near-duplicate blocks that should be unified
4. Leaky abstractions — exposing internals, breaking abstraction boundaries
5. Stringly-typed code — raw strings where constants or enums exist

Output format:
## Quality Findings
- {file}:{line} — {pattern}: {description}
```

### Agent 3: Efficiency Checker

```
You are checking code efficiency in recent changes.

Here is the diff of recent changes:
{diff}

Check for:
1. Unnecessary work — redundant computations, repeated reads, duplicate API calls, N+1 patterns
2. Missed concurrency — independent operations run sequentially
3. Hot-path bloat — blocking work on startup or per-request paths
4. Unnecessary existence checks — TOCTOU anti-pattern
5. Memory — unbounded structures, missing cleanup, listener leaks
6. Overly broad operations — reading entire files when portion needed

Output format:
## Efficiency Findings
- {file}:{line} — {pattern}: {description}
```

## 3. Aggregate and fix

After all 3 agents complete:

1. Collect all findings
2. Skip false positives — if a finding doesn't apply or isn't worth fixing, skip silently
3. Fix each valid issue directly using Edit tool
4. For each fix, note what was changed

## 4. Output summary

```
Simplify complete for {feature-slug}:
- Reuse: {N} findings, {M} fixed
- Quality: {N} findings, {M} fixed
- Efficiency: {N} findings, {M} fixed

{Or: "Code was already clean — no issues found."}
```

If called from /rpi:implement, return findings for recording in IMPLEMENT.md.

</process>
