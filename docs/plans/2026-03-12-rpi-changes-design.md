# RPI Changes Feature — Design Document

**Date:** 2026-03-12
**Status:** Approved
**Author:** Daniel Mendes + Claude

## Overview

When `rpi:new` detects an existing feature, it offers to create a **change** — a sub-feature that lives inside the parent feature's directory with the same RPI architecture (research/, plan/, implement/). Changes inherit context from their parent feature, enabling iterative evolution of features without overwriting or creating disconnected duplicates.

## Decisions

| Decision | Choice |
|----------|--------|
| Directory structure | `{folder}/{feature}/changes/{change-slug}/` with full RPI subdirs |
| Parent context | All parent artifacts (REQUEST, RESEARCH, PLAN, eng.md) injected into agent prompts |
| UX trigger | Detect existing feature → ask: "Create change or overwrite?" |
| Interview style | Context-adapted questions reading parent artifacts |
| Slug referencing | Auto-detect: search features/ first, then */changes/ |
| Collision handling | Ask user when slug is ambiguous |
| REQUEST.md template | Change-specific template (Parent Feature, Affected Areas, Breaking Changes) |
| Path resolution | Centralized shared logic in all commands |
| Status display | Hierarchical with indentation |
| Scope | All commands at once |
| Nested changes | Not supported in v1 |

## Architecture

### Resolve Feature Path (Shared Logic)

All commands use this logic after loading config from `.rpi.yaml`:

```
1. Parse slug from $ARGUMENTS
2. Check {folder}/{slug}/ → if exists, type = "feature"
3. If not found, Glob {folder}/*/changes/{slug}/ → if found, type = "change"
4. If multiple matches in step 3 → AskUserQuestion with all options
5. If no match → error: "Feature not found: {slug}"

Returns:
  - feature_path: full path to the resolved feature/change directory
  - parent_path: path to parent feature (null if top-level feature)
  - feature_type: "feature" | "change"
```

This logic is inlined in each command's .md file (since commands are Markdown prompts, not executable code). The source of truth for the logic is this design doc.

### Directory Structure

```
docs/features/
├── agent-model-profiles/           ← parent feature
│   ├── REQUEST.md
│   ├── research/
│   │   └── RESEARCH.md
│   ├── plan/
│   │   ├── PLAN.md
│   │   └── eng.md
│   ├── implement/
│   └── changes/
│       └── add-custom-profiles/    ← change
│           ├── REQUEST.md          (change-specific template)
│           ├── research/
│           ├── plan/
│           └── implement/
```

## rpi:new Modifications

### Step 3: Check for existing feature (modified)

When `{folder}/{feature-slug}/` already exists:

1. Ask user with AskUserQuestion:
   - "Create a change for this feature" → go to step 3b
   - "Overwrite existing REQUEST.md" → continue to step 4 (current behavior)
   - "Pick a different name" → go back to step 2

### Step 3b: Set up change (new)

1. Ask: "What change do you want to make to {feature-slug}?"
2. Derive change-slug (kebab-case) from the answer
3. Check if `{folder}/{feature-slug}/changes/{change-slug}/` already exists
   - If yes, warn and ask to overwrite or pick different name
4. Read parent feature artifacts for context:
   - `{folder}/{feature-slug}/REQUEST.md`
   - `{folder}/{feature-slug}/research/RESEARCH.md` (if exists)
   - `{folder}/{feature-slug}/plan/PLAN.md` (if exists)
   - `{folder}/{feature-slug}/implement/IMPLEMENT.md` (if exists)
5. Store parent_summary for interview and template

### Step 4: Adaptive interview (change mode)

Context-aware questions based on parent artifacts:

**Core (always ask):**
- "What do you want to change in {feature-slug}?" (skip if answered in 3b)
- "Why is this change needed?"

**Adaptive follow-ups:**
- If parent has implemented files: "Which parts of the existing implementation are affected?"
- If parent has PLAN.md: "Does this change any architecture decisions from the original plan?"
- If change sounds breaking: "Will this break any existing behavior?"
- Always offer: "Any constraints or references?"

Max 2 question batches for changes (lighter than new features).

### Step 6: Generate REQUEST.md (change mode)

Create directory structure:
```bash
mkdir -p {folder}/{feature-slug}/changes/{change-slug}/research
mkdir -p {folder}/{feature-slug}/changes/{change-slug}/plan
mkdir -p {folder}/{feature-slug}/changes/{change-slug}/implement
```

Write `{folder}/{feature-slug}/changes/{change-slug}/REQUEST.md`:

```markdown
# {Change Title}

## Parent Feature
[{Parent Feature Title}]({relative-path-to-parent-REQUEST.md})
{1-2 sentence summary of parent feature}

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
{S|M|L|XL} — {brief justification}
```

### Step 7: Next step (change mode)

```
Change created: {folder}/{feature-slug}/changes/{change-slug}/REQUEST.md
Parent: {folder}/{feature-slug}/

Next: /rpi:research {change-slug}
```

## Downstream Command Modifications

### research, plan, implement, review, simplify

Each command adds after config loading:

```
## Resolve Feature Path

Use shared resolve logic (see Architecture section).

If feature_type == "change":
  - Read parent artifacts as additional context:
    - {parent_path}/REQUEST.md
    - {parent_path}/research/RESEARCH.md (if exists)
    - {parent_path}/plan/PLAN.md (if exists)
    - {parent_path}/plan/eng.md (if exists)
  - Include in all agent prompts:
    ## Parent Feature Context
    {parent artifacts content}

    This is a CHANGE to an existing feature. Focus on:
    - What's different from the parent implementation
    - Compatibility with existing code
    - Breaking changes to watch for
```

### status (hierarchical display)

```
Features:
  agent-model-profiles  [implemented]
    └─ add-custom-profiles  [research: GO]
    └─ fix-fallback-logic   [new]
  auth-middleware        [planning]
```

For each feature in `{folder}/`:
1. Show feature name + status
2. Check `{folder}/{feature}/changes/` for subdirectories
3. For each change, show indented with `└─` prefix and its own status

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Change slug collides with a top-level feature | Ask user which one they mean |
| Multiple changes with same slug across different features | List all options with full path |
| Parent has no artifacts beyond REQUEST.md | OK — agents receive only parent REQUEST.md |
| Nested changes (change of a change) | Not supported v1 — error: "Nested changes not supported" |
| User runs `/rpi:new {change-slug}` without knowing it's a change | Auto-detect doesn't find it → treats as new feature (normal behavior) |
| Deleting a feature that has changes | Warn: "This feature has N changes that will also be affected" |

## User Concerns Addressed

1. **Auto-detect complexity**: Mitigated by simple 2-step resolution (check top-level, then glob changes/). Performance is fine since Glob is fast and the number of features is typically small (< 50).

2. **Acoplamento with existing commands**: Mitigated by centralized resolve logic. Each command adds ~15 lines of identical logic. The parent context injection is a simple "if change, read and prepend" pattern.

## Scope

All commands modified in v1:
- `rpi:new` — change creation flow
- `rpi:research` — resolve path + parent context
- `rpi:plan` — resolve path + parent context
- `rpi:implement` — resolve path + parent context
- `rpi:review` — resolve path + parent context
- `rpi:simplify` — resolve path + parent context
- `rpi:status` — hierarchical display
