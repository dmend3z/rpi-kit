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

Read `.rpi.yaml` for configuration. Also read `profile` and `models` keys.
Parse `$ARGUMENTS`:
- First argument: `{feature-slug}` (required)
- `--force`: proceed even if research verdict was NO-GO
- `--skip-pm`: don't generate pm.md
- `--skip-ux`: don't generate ux.md

## 1b. Resolve model

Resolve the model for the `plan` phase following the Model Resolution Algorithm in the rpi-workflow skill. Store as `{resolved_model}`. If a model is resolved, output the status message before agent spawns.

## 2. Resolve feature path and validate prerequisites

Parse `{feature-slug}` from arguments.

**Resolution order:**
1. Check if `{folder}/{feature-slug}/` exists → type = "feature", path = `{folder}/{feature-slug}`
2. If not, Glob `{folder}/*/changes/{feature-slug}/` → if found, type = "change", path = matched path, parent_path = parent directory
3. If multiple matches → AskUserQuestion listing all matches with full paths
4. If no match → error: `Feature not found: {feature-slug}. Run /rpi:new {feature-slug} first.`

If `type == "change"`:
- Set `parent_path` to the parent feature directory
- Read parent artifacts for agent context:
  - `{parent_path}/REQUEST.md`
  - `{parent_path}/research/RESEARCH.md` (if exists)
  - `{parent_path}/plan/PLAN.md` (if exists)
  - `{parent_path}/plan/eng.md` (if exists)

Read `{path}/research/RESEARCH.md`. If missing:
```
Research not found. Run /rpi:research {feature-slug} first.
```

Check verdict. If NO-GO and no `--force`:
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

## 3b. Interview user for alignment

Read all research artifacts:
- `{folder}/{feature-slug}/REQUEST.md`
- `{folder}/{feature-slug}/research/RESEARCH.md`

Based on the content, interview the user using AskUserQuestion to clarify anything that could affect the plan. Ask about **all relevant dimensions** — not just one:

- **Technical implementation**: preferred patterns, constraints, performance requirements, existing code to build on
- **UI & UX** (if applicable): expected flows, interaction patterns, states (loading, empty, error), design preferences
- **Concerns**: risks identified in research, areas of uncertainty, things the user is worried about
- **Tradeoffs**: decisions surfaced in research that have multiple valid approaches — present options and ask for preference
- **Scope boundaries**: what explicitly should NOT be in this plan, MVP vs. future

Rules:
- Ask focused, specific questions based on what you read — not generic ones
- Reference concrete findings from the research (e.g., "Research found two patterns for X: {A} and {B}. Which do you prefer?")
- If the research surfaced CONCERN or BLOCK verdicts, ask about those specifically
- Group related questions together — don't ask one at a time unless a follow-up depends on a previous answer
- Document the user's answers — they will be passed as additional context to the agents in subsequent steps

After the interview, create a brief alignment summary that will be included in agent prompts:
```
## User Alignment Notes
{Summary of key decisions, preferences, and constraints from the interview}
```

## 4. Generate eng.md (always)

Launch senior-engineer agent. If a model was resolved in Step 1b, include `model: "{resolved_model}"` in the Agent tool call.
```
You are planning the technical implementation for a feature.

Read these files:
- {folder}/{feature-slug}/REQUEST.md
- {folder}/{feature-slug}/research/RESEARCH.md

User Alignment Notes (from interview):
{alignment_summary}

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

If `type == "change"`, append to the agent prompt:

```
## Parent Feature Context
{contents of parent artifacts read in step 2}

This is a CHANGE to an existing feature. Focus on:
- What's different from the parent implementation
- Compatibility with existing code
- Breaking changes to watch for
```

> **Note:** Also append this same parent context block to the pm.md (step 5), ux.md (step 6), and PLAN.md (step 7) agent prompts when `type == "change"`.

## 5. Generate pm.md (if not skipped)

Launch product-manager agent. If a model was resolved, include `model: "{resolved_model}"` in the Agent tool call.
```
You are creating product requirements for a feature.

Read these files:
- {folder}/{feature-slug}/REQUEST.md
- {folder}/{feature-slug}/research/RESEARCH.md

User Alignment Notes (from interview):
{alignment_summary}

Produce pm.md — product requirements covering:
1. User stories with acceptance criteria
2. Scope definition with effort estimates (S/M/L/XL per item)
3. Out of scope (what this feature does NOT do)
4. Success metrics (how to measure if the feature works)
5. Edge cases and error scenarios

Follow product-manager rules from RPI agent guidelines.
```

## 6. Generate ux.md (if not skipped)

Launch ux-designer agent. If a model was resolved, include `model: "{resolved_model}"` in the Agent tool call.
```
You are designing the user experience for a feature.

Read these files:
- {folder}/{feature-slug}/REQUEST.md
- {folder}/{feature-slug}/research/RESEARCH.md

User Alignment Notes (from interview):
{alignment_summary}

Produce ux.md — UX design covering:
1. User journey (step-by-step flow from entry to completion)
2. Interaction patterns (what the user sees and does at each step)
3. Edge cases (errors, empty states, loading, permissions)
4. Existing components to reuse (cite from codebase research)
5. Accessibility considerations

Follow ux-designer rules from RPI agent guidelines.
```

## 7. Generate PLAN.md

After all agents complete (eng.md is required, pm.md and ux.md may be parallel), launch senior-engineer agent again to create the task breakdown. If a model was resolved, include `model: "{resolved_model}"` in the Agent tool call.

```
You are creating an implementation plan from the technical spec.

Read these files:
- {folder}/{feature-slug}/REQUEST.md
- {folder}/{feature-slug}/research/RESEARCH.md
- {folder}/{feature-slug}/plan/eng.md
- {folder}/{feature-slug}/plan/pm.md (if exists)
- {folder}/{feature-slug}/plan/ux.md (if exists)

User Alignment Notes (from interview):
{alignment_summary}

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
- After generating all tasks, count total tasks, unique files, and max dependency depth
- These metrics will be used for session isolation tier detection
```

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

Session isolation: Tier {1|2|3} (context weight: {weight})
{If tier 1: "Small feature — single session recommended"}
{If tier 2: "Medium feature — session warning after {max_tasks_per_session} tasks"}
{If tier 3: "Large feature — session checkpoints will be enforced"}

Next: /rpi:implement {feature-slug}
```

</process>
