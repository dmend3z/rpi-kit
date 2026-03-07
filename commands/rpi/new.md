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

Check if `{folder}/{feature-slug}/` already exists. If yes, warn the user and ask if they want to continue (overwrite REQUEST.md) or pick a different name.

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

## 5. Generate REQUEST.md

Create the feature folder and write REQUEST.md:

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

## 6. Next step

Output:
```
Feature created: {folder}/{feature-slug}/REQUEST.md

Next: /rpi:research {feature-slug}
Options:
  --quick     Feasibility check only (fast)
  --standard  Scope + technical approach (default)
  --deep      Full analysis with strategic review
```

</process>
