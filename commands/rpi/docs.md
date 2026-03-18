---
name: rpi:docs
description: Quill generates and updates documentation based on the implementation.
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

# /rpi:docs — Docs Phase

Quill reads all feature artifacts and generates documentation: README updates, changelog entries, API docs, and inline comments where non-obvious.

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

## Step 2: Validate review verdict

1. Look for a review verdict in `rpi/features/{slug}/implement/IMPLEMENT.md`.
2. The verdict appears in a `## Review` section as `PASS` or `PASS with concerns`.
3. If verdict is `FAIL`:
   ```
   Review verdict is FAIL for '{slug}'.
   Fix the issues identified in IMPLEMENT.md and re-run: /rpi:review {slug}
   ```
   Stop.
4. If no review verdict is found:
   ```
   No review verdict found for '{slug}'. Run /rpi:review {slug} first.
   ```
   Stop.

## Step 3: Gather context

1. Read `rpi/features/{slug}/REQUEST.md` — store as `$REQUEST`.
2. Read `rpi/features/{slug}/plan/PLAN.md` — store as `$PLAN`.
3. Read `rpi/features/{slug}/implement/IMPLEMENT.md` — store as `$IMPLEMENT`.
4. Read `rpi/context.md` (project context) if it exists — store as `$CONTEXT`.
5. Scan `rpi/features/{slug}/delta/` for all files in ADDED/, MODIFIED/, and REMOVED/ — store as `$DELTA_CONTENTS`.
6. Read `README.md` from the project root if it exists — store as `$CURRENT_README`.
7. Read `CHANGELOG.md` from the project root if it exists — store as `$CURRENT_CHANGELOG`.

## Step 4: Launch Quill

Launch Quill agent with this prompt:

```
You are Quill. Generate and update documentation for feature: {slug}

## Request
{$REQUEST}

## Plan
{$PLAN}

## Implementation
{$IMPLEMENT}

## Delta Specs
{$DELTA_CONTENTS}

## Project Context
{$CONTEXT}

## Current README
{$CURRENT_README or "No README.md found."}

## Current CHANGELOG
{$CURRENT_CHANGELOG or "No CHANGELOG.md found."}

Your task:
1. Update README.md with new feature documentation (if the feature adds user-facing behavior or public API)
   - Add a section or update an existing section — don't rewrite the entire README
   - Include usage examples with concrete values
   - If the feature is internal/refactoring only, skip README updates
2. Write a changelog entry in conventional format
   - Use the appropriate category: Added, Changed, Fixed, Removed
   - Reference the feature slug
   - If CHANGELOG.md exists, prepend the new entry under the correct version
   - If CHANGELOG.md doesn't exist, create it with a header and the first entry
3. Add API docs for new public interfaces
   - Document exported functions, classes, or endpoints introduced by this feature
   - Include parameter types, return types, and one usage example per interface
   - Write docs where the project convention places them (JSDoc, docstrings, doc comments, or separate files)
4. Add inline comments only where the code is non-obvious
   - Explain WHY, not WHAT
   - Focus on: non-obvious business rules, workarounds, performance tradeoffs, external API quirks
   - Do NOT add comments that restate the code

Rules:
- Keep docs DRY — don't repeat what the code already says
- Match existing documentation style and tone
- Use concrete examples, not abstract descriptions
- If the code says WHAT, the docs should say WHY

After documentation updates, append your activity to rpi/features/{slug}/ACTIVITY.md:

### {current_date} — Quill (Docs)
- **Action:** Documentation updates for {slug}
- **Key decisions:** {for each <decision> tag you emitted: "summary (rationale)", separated by semicolons. If none: "No decisions in this phase."}
- **Files updated:** {list}
- **Changelog entry:** {yes|no}
- **Quality:** {your quality gate result}
```

Store the output as `$QUILL_OUTPUT`.

## Step 5: Commit documentation changes

1. Stage all documentation files changed by Quill:
   ```bash
   git add -A
   ```
2. Commit with a conventional message:
   ```bash
   git commit -m "docs({slug}): update documentation for {slug}"
   ```

## Step 6: Consolidate decisions to DECISIONS.md

1. Read `rpi/features/{slug}/ACTIVITY.md`.
2. Extract all `<decision>` tags from entries belonging to the Docs phase (Quill entries from this run).
3. If no decisions found, skip this step.
4. Read `rpi/features/{slug}/DECISIONS.md` if it exists (to get the last decision number for sequential numbering).
5. Append a new section to `rpi/features/{slug}/DECISIONS.md`:

```markdown
## Docs Phase
_Generated: {current_date}_

| # | Type | Decision | Alternatives | Rationale | Impact |
|---|------|----------|-------------|-----------|--------|
| {N} | {type} | {summary} | {alternatives} | {rationale} | {impact} |
```

6. Number decisions sequentially, continuing from the last number in DECISIONS.md.

## Step 7: Output summary

```
Documentation complete: {slug}

{$QUILL_OUTPUT summary — list of files updated and what changed}

Next: /rpi:archive {slug}
```
