---
name: rpi:plan
description: Generate adaptive plan artifacts from research. Creates PLAN.md with task checklist, eng.md, and optionally pm.md and ux.md.
argument-hint: "<feature-slug> [--force] [--skip-pm] [--skip-ux]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Agent
  - AskUserQuestion
---

<objective>
Generate implementation plan artifacts from the research output. Adapts which artifacts to create based on feature type.
</objective>

<process>

## 1. Load config and parse arguments

Read `.rpi.yaml` for configuration.
Parse `$ARGUMENTS`:
- First argument: `{feature-slug}` (required)
- `--force`: proceed even if research verdict was NO-GO
- `--skip-pm`: don't generate pm.md
- `--skip-ux`: don't generate ux.md

## 2. Validate prerequisites

Read `{folder}/{feature-slug}/research/RESEARCH.md`. If missing:
```
Research not found. Run /rpi:research {feature-slug} first.
```

Check the verdict in RESEARCH.md. If NO-GO and no `--force` flag:
```
Research verdict is NO-GO. Review alternatives in RESEARCH.md.
To proceed anyway: /rpi:plan {feature-slug} --force
```

If plan artifacts already exist, ask: "Plan already exists. Overwrite?"

## 3. Detect feature type and confirm artifacts

Analyze RESEARCH.md to detect feature type:
- Has UI components, user flows, or frontend files → suggest pm.md + ux.md
- Backend only, API, or infrastructure → suggest skipping ux.md
- Simple utility or refactor → suggest skipping pm.md + ux.md

Present detection to user with AskUserQuestion:
"Based on the research, this looks like a {type} feature. I'll generate:"
- Options showing which artifacts will be created
- Let user confirm or adjust

Apply any `--skip-pm` or `--skip-ux` flags as overrides.

## 4. Generate eng.md (always)

Launch senior-engineer agent:
```
You are planning the technical implementation for a feature.

Read these files:
- {folder}/{feature-slug}/REQUEST.md
- {folder}/{feature-slug}/research/RESEARCH.md

Produce eng.md — a technical specification covering:
1. Architecture overview (how it fits into existing codebase)
2. Dependencies (new packages, existing modules to extend)
3. Data models (schema changes, new types)
4. API design (endpoints, contracts, error handling)
5. File structure (new files to create, existing files to modify)
6. Testing strategy (what to test, how)

Be concrete. Cite existing codebase files and patterns from the research.
Follow senior-engineer rules from RPI agent guidelines.
```

## 5. Generate pm.md (if not skipped)

Launch product-manager agent:
```
You are creating product requirements for a feature.

Read these files:
- {folder}/{feature-slug}/REQUEST.md
- {folder}/{feature-slug}/research/RESEARCH.md

Produce pm.md — product requirements covering:
1. User stories with acceptance criteria
2. Scope definition with effort estimates (S/M/L/XL per item)
3. Out of scope (what this feature does NOT do)
4. Success metrics (how to measure if the feature works)
5. Edge cases and error scenarios

Follow product-manager rules from RPI agent guidelines.
```

## 6. Generate ux.md (if not skipped)

Launch ux-designer agent:
```
You are designing the user experience for a feature.

Read these files:
- {folder}/{feature-slug}/REQUEST.md
- {folder}/{feature-slug}/research/RESEARCH.md

Produce ux.md — UX design covering:
1. User journey (step-by-step flow from entry to completion)
2. Interaction patterns (what the user sees and does at each step)
3. Edge cases (errors, empty states, loading, permissions)
4. Existing components to reuse (cite from codebase research)
5. Accessibility considerations

Follow ux-designer rules from RPI agent guidelines.
```

## 7. Generate PLAN.md

After all agents complete (eng.md is required, pm.md and ux.md may be parallel), launch senior-engineer agent again to create the task breakdown:

```
You are creating an implementation plan from the technical spec.

Read these files:
- {folder}/{feature-slug}/REQUEST.md
- {folder}/{feature-slug}/research/RESEARCH.md
- {folder}/{feature-slug}/plan/eng.md
- {folder}/{feature-slug}/plan/pm.md (if exists)
- {folder}/{feature-slug}/plan/ux.md (if exists)

Produce PLAN.md — an ordered task checklist organized by phases.

Format for each task:
- [ ] **{phase}.{task}** {Task description}
  Effort: S | M | L | XL | Deps: {task IDs or "none"}
  Files: {files to create or modify}
  Test: {what to test — behavior assertion in plain language}

Group tasks into logical phases (e.g., Phase 1: Data Layer, Phase 2: Business Logic, Phase 3: UI, Phase 4: Integration).

Rules:
- Every task should be completable in one focused session
- L or XL tasks should be broken into smaller subtasks
- Dependencies must be explicit — no circular deps
- Files listed must be specific paths, not directories
- Every task must have a Test field describing what behavior to verify
- Test descriptions should be assertions, not vague: "returns 404 for missing user" not "test error handling"
```

## 8. Write all artifacts

Write all generated files to `{folder}/{feature-slug}/plan/`:
- `PLAN.md` (always)
- `eng.md` (always)
- `pm.md` (if generated)
- `ux.md` (if generated)

## 9. Present plan summary

Output:
```
Plan created for {feature-slug}:
- PLAN.md: {N} tasks across {M} phases
- eng.md: Technical specification
{- pm.md: Product requirements (if generated)}
{- ux.md: UX design (if generated)}

Next: /rpi:implement {feature-slug}
```

</process>
