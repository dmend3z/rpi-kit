---
name: rpi:new
description: Start a new feature with an adaptive interview. Generates a structured REQUEST.md in the feature folder.
argument-hint: "[feature-name]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - AskUserQuestion
---

<objective>
Interview the user about a new feature and generate a structured REQUEST.md in `{folder}/{feature-slug}/`.
</objective>

<process>

## 1. Load config

Read `.rpi.yaml` from the project root. If it doesn't exist, use defaults:
- folder: `rpi`
- tier: `standard`

## 2. Determine feature slug

If `$ARGUMENTS` contains a feature name, convert to kebab-case slug.
If no argument, ask: "What feature do you want to build?" and derive the slug from the answer.

## 3. Check for existing feature

Check if `{folder}/{feature-slug}/` already exists.

If it does NOT exist, continue to step 4 (new feature interview).

If it DOES exist, ask the user with AskUserQuestion:

"Feature '{feature-slug}' already exists ({folder}/{feature-slug}/). What do you want to do?"

Options:
- "Create a change for this feature" — go to step 3b
- "Overwrite existing REQUEST.md" — continue to step 4 (current behavior)
- "Pick a different name" — go back to step 2

## 3b. Set up change

Ask: "What change do you want to make to {feature-slug}?" and derive change-slug (kebab-case) from the answer.

Check if `{folder}/{feature-slug}/changes/{change-slug}/` already exists. If yes, warn and ask to overwrite or pick a different name.

Read parent feature context for the interview:
- `{folder}/{feature-slug}/REQUEST.md`
- `{folder}/{feature-slug}/research/RESEARCH.md` (if exists)
- `{folder}/{feature-slug}/plan/PLAN.md` (if exists)
- `{folder}/{feature-slug}/implement/IMPLEMENT.md` (if exists)

Store the parent artifacts content as `parent_context` for use in steps 4 and 6.

Set `is_change = true` and `parent_slug = {feature-slug}`.

## 4. Adaptive interview

Start with core questions, then ask follow-ups based on answers.

**Core (always ask):**
- "What feature do you want to build?" (skip if already answered from slug)
- "What problem does this solve? Who benefits?"

**Adaptive follow-ups (based on answers):**
- If feature involves UI: "Any specific UX requirements or references?"
- If feature involves data: "What data models or schemas are affected?"
- If feature sounds complex: "What's the rough complexity you expect? (S/M/L/XL)"
- If mentions external services: "Any API constraints or rate limits to consider?"
- Always offer: "Any other constraints, references, or inspiration? (links, screenshots, examples)"

Use AskUserQuestion for structured questions. Keep it conversational — 2-3 questions per batch, max 3 batches. Stop when you have enough to write a clear REQUEST.md.

### Change mode interview (if `is_change == true`)

Replace the core questions with context-aware ones:

**Core (always ask):**
- "What do you want to change in {parent_slug}?" (skip if already answered in step 3b)
- "Why is this change needed?"

**Adaptive follow-ups (based on parent artifacts):**
- If parent has IMPLEMENT.md: "Which parts of the existing implementation are affected?"
- If parent has PLAN.md with architecture decisions: "Does this change any architecture decisions from the original plan?"
- If change sounds like it could break things: "Will this break any existing behavior?"
- Always offer: "Any constraints or references?"

Use AskUserQuestion. Keep it lighter than new features — max 2 batches.

## 5. Set up isolation

Read `isolation` from `.rpi.yaml` (default: `none`).

**If `isolation: none`** — do nothing, continue on current branch.

**If `isolation: branch`:**
```bash
git checkout -b feature/{feature-slug}
```

**If `isolation: worktree`:**
1. Verify `.worktrees/` is in `.gitignore`:
   ```bash
   git check-ignore -q .worktrees 2>/dev/null
   ```
   If NOT ignored, add `.worktrees/` to `.gitignore` and commit:
   ```bash
   echo ".worktrees/" >> .gitignore
   git add .gitignore && git commit -m "chore: add .worktrees/ to .gitignore"
   ```
2. Create the worktree:
   ```bash
   git worktree add .worktrees/{feature-slug} -b feature/{feature-slug}
   ```
3. Run project setup in the worktree (auto-detect from project files: `npm install`, `pip install`, etc.)
4. Inform the user:
   ```
   Worktree created at .worktrees/{feature-slug}
   Branch: feature/{feature-slug}

   To work in the worktree, open a new terminal:
     cd .worktrees/{feature-slug}
   ```

## 6. Generate REQUEST.md

Create the feature folder and write REQUEST.md.

**If `isolation: worktree`**, the feature folder is created inside the worktree:
```bash
cd .worktrees/{feature-slug}
mkdir -p {folder}/{feature-slug}/research
mkdir -p {folder}/{feature-slug}/plan
mkdir -p {folder}/{feature-slug}/implement
```

**Otherwise:**
```bash
mkdir -p {folder}/{feature-slug}/research
mkdir -p {folder}/{feature-slug}/plan
mkdir -p {folder}/{feature-slug}/implement
```

Write `{folder}/{feature-slug}/REQUEST.md` with this structure:

```markdown
# {Feature Title}

## Summary
{1-3 sentence description of the feature}

## Problem
{What problem does this solve? Who is affected?}

## Target Users
{Who will use this feature?}

## Constraints
- {Technical constraints}
- {Business constraints}
- {Dependencies}

## References
- {Links, screenshots, examples, inspiration}

## Complexity Estimate
{S | M | L | XL} — {brief justification}
```

### Change mode directory creation (if `is_change == true`)

Skip isolation setup (changes use the parent feature's branch/worktree context).

Create the change directory structure:
```bash
mkdir -p {folder}/{parent_slug}/changes/{change-slug}/research
mkdir -p {folder}/{parent_slug}/changes/{change-slug}/plan
mkdir -p {folder}/{parent_slug}/changes/{change-slug}/implement
```

Write `{folder}/{parent_slug}/changes/{change-slug}/REQUEST.md` with this structure:

```markdown
# {Change Title}

## Parent Feature
[{Parent Feature Title}]({relative-path-to-parent-REQUEST.md})
{1-2 sentence summary of parent feature from parent_context}

## Summary of Change
{What changes in the existing feature}

## Motivation
{Why this change is needed}

## Affected Areas
- {Components/files of parent feature that are affected}

## Breaking Changes
- {List or "None"}

## Constraints
- {Technical/business constraints}

## Complexity Estimate
{S | M | L | XL} — {brief justification}
```

## 7. Next step

Output:
```
Feature created: {folder}/{feature-slug}/REQUEST.md

Next: /rpi:research {feature-slug}
Options:
  --quick     Feasibility check only (fast)
  --standard  Scope + technical approach (default)
  --deep      Full analysis with strategic review
```

### Change mode output (if `is_change == true`)

Output:
```
Change created: {folder}/{parent_slug}/changes/{change-slug}/REQUEST.md
Parent: {folder}/{parent_slug}/

Next: /rpi:research {change-slug}
```

</process>
