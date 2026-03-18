# eng.md -- Agent Model Profiles

## 1. Architecture Overview

### How Model Profiles Fit Into the Existing Flow

The current flow is:

```
User runs command (e.g., /rpi:research)
    |
Command Step 1: reads .rpi.yaml for config
    |
Command constructs Agent tool prompt
    |
Agent tool invoked (currently: no model param -> inherits parent model)
    |
Agent executes and returns result
```

The new flow adds model resolution between config load and Agent tool invocation:

```
User runs command (e.g., /rpi:research)
    |
Command Step 1: reads .rpi.yaml for config (now includes profile + models)
    |
NEW: Resolve model for this command's phase using the Model Resolution Algorithm
    |
NEW: Status message -- "Profile: {profile} | {phase} phase -> {model}"
    |
Command constructs Agent tool prompt
    |
Agent tool invoked WITH model: "{resolved_model}" param (or omitted if inherit)
    |
Agent executes and returns result
```

### Resolution Chain

```
per-phase override (.rpi.yaml models.{phase})
    | (if not set)
profile defaults (lookup table for active profile)
    | (if no profile set)
inherit parent model (omit model param entirely -- current behavior)
```

This algorithm is defined ONCE in `skills/rpi-workflow/SKILL.md` and referenced from each command. Commands do not inline the algorithm; they reference it by name ("resolve the model for the `{phase}` phase following the Model Resolution Algorithm in the rpi-workflow skill").

### Phase Mapping

Every agent-spawning command maps to exactly one of 4 phases:

| Phase | Commands |
|-------|----------|
| `research` | `/rpi:research` |
| `plan` | `/rpi:plan` |
| `implement` | `/rpi:implement`, `/rpi:test`, `/rpi:simplify` |
| `review` | `/rpi:review`, `/rpi:docs` |

Commands that do NOT use model profiles:
- `/rpi:init` -- no agent spawning
- `/rpi:new` -- no agent spawning
- `/rpi:status` -- no agent spawning
- `/rpi:add-todo` -- no agent spawning
- `/rpi:onboarding` -- spawns agents, but is NOT a workflow phase; always inherits parent model
- `/rpi:set-profile` (new) -- no agent spawning

---

## 2. Configuration Schema

### Additions to `.rpi.yaml`

Two new top-level keys: `profile` and `models`.

```yaml
# RPI Workflow Configuration
# Docs: https://github.com/mndz/rpi-kit

folder: docs/features
tier: deep
auto_simplify: true
commit_style: conventional
parallel_threshold: 8
skip_artifacts: []
review_after_implement: true
isolation: none
tdd: false
test_runner: auto
session_isolation: auto
max_tasks_per_session: 5

# Model Profiles (NEW)
profile: balanced             # quality-first | balanced | speed-first | budget
models:                       # Per-phase overrides (optional, takes precedence over profile)
  # research: opus
  # plan: opus
  # implement: sonnet
  # review: opus
```

Both keys are optional. If neither is present, behavior is identical to today (all agents inherit the parent model).

### Profile Lookup Table

| Profile | research | plan | implement | review |
|---------|----------|------|-----------|--------|
| `quality-first` | opus | opus | opus | opus |
| `balanced` | opus | opus | sonnet | opus |
| `speed-first` | sonnet | sonnet | sonnet | sonnet |
| `budget` | haiku | sonnet | haiku | sonnet |

This table is defined in `skills/rpi-workflow/SKILL.md` inside the new "Model Resolution Algorithm" section. It is the single source of truth. Commands and the `/rpi:set-profile` command reference it.

### Valid Model Names

`opus`, `sonnet`, `haiku` -- the three values accepted by the Claude Code Agent tool `model` parameter.

---

## 3. New Command: `/rpi:set-profile`

### File: `commands/rpi/set-profile.md`

```markdown
---
name: rpi:set-profile
description: Switch the active model profile. Controls which AI model runs each workflow phase (research, plan, implement, review).
argument-hint: "[quality-first|balanced|speed-first|budget]"
allowed-tools:
  - Read
  - Write
  - AskUserQuestion
---

<objective>
Display the current model profile and phase-model mapping, or switch to a new profile. Persists the selection in `.rpi.yaml`.
</objective>

<process>

## 1. Load current config

Read `.rpi.yaml` from the project root. If it doesn't exist:
No RPI config found. Run /rpi:init first.

Extract `profile` and `models` keys (both may be absent).

## 2. Parse arguments

Parse `$ARGUMENTS`:
- If empty: display current profile (step 3), then ask if user wants to switch (step 4)
- If argument provided: validate and switch to that profile (step 5)

## 3. Display current profile

Resolve the effective model for each phase using the Model Resolution Algorithm defined in the rpi-workflow skill.

Output:
Current profile: {profile_name or "none (inheriting parent model)"}

Phase mappings:
  research:   {resolved_model or "inherit"}
  plan:       {resolved_model or "inherit"}
  implement:  {resolved_model or "inherit"}
  review:     {resolved_model or "inherit"}

{If any per-phase overrides exist in models: block:}
Per-phase overrides active: {list overridden phases}
(Overrides take precedence over the profile. Edit .rpi.yaml to change.)

## 4. Ask to switch (only if no argument)

Use AskUserQuestion:
"Switch to a different profile?"

Options:
- `quality-first` -- opus for all phases (maximum quality)
- `balanced` -- opus for research/plan/review, sonnet for implement (recommended)
- `speed-first` -- sonnet for all phases (fastest)
- `budget` -- haiku for research/implement, sonnet for plan/review (cheapest)
- "Keep current" -- no change

If "Keep current", output "No changes made." and stop.

## 5. Validate profile name

Check that the provided profile name is one of: `quality-first`, `balanced`, `speed-first`, `budget`.

If invalid:
Invalid profile: "{input}"

Valid profiles:
  quality-first  -- opus for all phases
  balanced       -- opus for research/plan/review, sonnet for implement
  speed-first    -- sonnet for all phases
  budget         -- haiku for research/implement, sonnet for plan/review

Stop. Do not modify config.

## 6. Persist to .rpi.yaml

Read the current `.rpi.yaml` content. Update the `profile` key:
- If `profile:` line exists: replace the value
- If `profile:` line does not exist: add it after the last existing config key, before any comments at the end

Do NOT modify the `models:` block. Per-phase overrides are preserved as-is.

Write the updated `.rpi.yaml`.

## 7. Confirm

Display the new effective mapping:
Profile switched to: {profile_name}

Phase mappings:
  research:   {model}
  plan:       {model}
  implement:  {model}
  review:     {model}

{If models: overrides exist:}
Note: Per-phase overrides in .rpi.yaml take precedence over the profile.
Overridden phases: {list}

Tip: Edit .rpi.yaml to customize individual phases.

</process>
```

---

## 4. Model Resolution Algorithm

This is the exact text to add to `skills/rpi-workflow/SKILL.md`, inserted as a new section between the existing "Configuration (.rpi.yaml)" section and the "Feature Folder Structure" section.

```markdown
## Model Resolution Algorithm

When a command spawns an agent, it resolves which model to use for the Agent tool's `model` parameter. The algorithm is:

### Resolution Order

1. **Per-phase override**: If `.rpi.yaml` has a `models.{phase}` value, use it.
2. **Profile default**: If `.rpi.yaml` has a `profile` value, look up the model for this phase in the profile table below.
3. **Inherit parent**: If neither is set, omit the `model` parameter entirely. The agent inherits the parent session's model (current default behavior).

### Profile Lookup Table

| Profile | research | plan | implement | review |
|---------|----------|------|-----------|--------|
| `quality-first` | opus | opus | opus | opus |
| `balanced` | opus | opus | sonnet | opus |
| `speed-first` | sonnet | sonnet | sonnet | sonnet |
| `budget` | haiku | sonnet | haiku | sonnet |

Note: The budget profile uses haiku for research and implement phases.
Research quality may degrade with haiku -- research agents require structured
analysis with citations and evidence. Recommended for small or simple features only.

### Phase-to-Command Mapping

| Phase | Commands |
|-------|----------|
| `research` | `/rpi:research` |
| `plan` | `/rpi:plan` |
| `implement` | `/rpi:implement`, `/rpi:test`, `/rpi:simplify` |
| `review` | `/rpi:review`, `/rpi:docs` |

Commands without a phase (`/rpi:init`, `/rpi:new`, `/rpi:status`, `/rpi:add-todo`, `/rpi:onboarding`, `/rpi:set-profile`) do not use model resolution. `/rpi:onboarding` spawns agents but always inherits the parent model -- it is not a workflow phase.

### Validation

Valid model names: `opus`, `sonnet`, `haiku`.

If a `models.{phase}` value or a `profile` value in `.rpi.yaml` is invalid:
- Log a warning: `Warning: Invalid model "{value}" for {phase} phase. Falling back to parent model.`
- Omit the `model` parameter (inherit parent model).
- Do NOT stop execution.

If `profile` is set to an unrecognized name:
- Log a warning: `Warning: Unknown profile "{value}". Valid profiles: quality-first, balanced, speed-first, budget. Falling back to parent model.`
- Treat all phases as "inherit parent".

### Status Messages

When a model is resolved (not inherited), the command outputs once before spawning agents:
```
Profile: {profile} | {phase} phase -> {model}
```

When inheriting the parent model (no profile, no override), output nothing extra -- this preserves current behavior silently.
```

---

## 5. Command Modifications

For each of the 7 agent-spawning commands, the modification follows the same pattern:

1. In **Step 1** ("Load config and parse arguments"), add: "Also read `profile` and `models` from `.rpi.yaml`."
2. Add a **new step** (inserted as Step 1b) titled "Resolve model": "Resolve the model for the `{phase}` phase following the Model Resolution Algorithm in the rpi-workflow skill. If a model is resolved, output the status message before agent spawns."
3. In **every Agent tool invocation**, add: "If a model was resolved, include `model: "{resolved_model}"` in the Agent tool call."

### 5.1. `/rpi:research` -- Phase: `research`

**File**: `commands/rpi/research.md`

**Step 1**: After "Read `.rpi.yaml` for folder path and default tier", add: "Also read `profile` and `models` keys."

**New Step 1b**: "Resolve the model for the `research` phase following the Model Resolution Algorithm in the rpi-workflow skill. Store as `{resolved_model}`. If resolved, output status message."

**Step 4** ("Launch research agents in parallel"): All Agent tool invocations get `model: "{resolved_model}"` if resolved.

**Step 5** ("Synthesize into RESEARCH.md"): doc-synthesizer Agent call also gets the `model` param.

**Agent invocations affected**: up to 7 (requirement-parser, explore-codebase, product-manager, senior-engineer, cto-advisor, ux-designer, doc-synthesizer).

### 5.2. `/rpi:plan` -- Phase: `plan`

**File**: `commands/rpi/plan.md`

**Step 1**: Add `profile` and `models` reading.

**New Step 1b**: Resolve model for `plan` phase.

**Steps 4, 5, 6, 7**: All Agent tool invocations get `model` param.

**Agent invocations affected**: up to 4 (senior-engineer x2, product-manager, ux-designer).

### 5.3. `/rpi:implement` -- Phase: `implement`

**File**: `commands/rpi/implement.md`

**Step 1**: Add `profile` and `models` reading.

**New Step 1b**: Resolve model for `implement` phase.

**Step 6a** (agent prompt template): plan-executor Agent call gets `model` param.

**TDD section**: test-engineer and plan-executor Agent calls get `model` param.

**Agent invocations affected**: plan-executor (per task), test-engineer (per task if TDD enabled).

### 5.4. `/rpi:test` -- Phase: `implement`

**File**: `commands/rpi/test.md`

**Step 1**: Add `profile` and `models` reading.

**New Step 1b**: Resolve model for `implement` phase.

**Phase RED**: test-engineer Agent call gets `model` param.

**Phase GREEN**: plan-executor Agent call gets `model` param.

**Agent invocations affected**: test-engineer + plan-executor per task.

### 5.5. `/rpi:simplify` -- Phase: `implement`

**File**: `commands/rpi/simplify.md`

**Step 1**: Add `profile` and `models` reading.

**New Step 1b**: Resolve model for `implement` phase.

**Step 2**: All 3 sub-agent Agent calls get `model` param.

**Agent invocations affected**: 3 (reuse-checker, quality-checker, efficiency-checker).

### 5.6. `/rpi:review` -- Phase: `review`

**File**: `commands/rpi/review.md`

**Step 1**: Add `profile` and `models` reading.

**New Step 1b**: Resolve model for `review` phase.

**Step 3**: code-reviewer Agent call gets `model` param.

**Agent invocations affected**: 1 (code-reviewer).

### 5.7. `/rpi:docs` -- Phase: `review`

**File**: `commands/rpi/docs.md`

**Step 1**: Add `profile` and `models` reading.

**New Step 1b**: Resolve model for `review` phase.

**Step 5**: All 3 Agent calls get `model` param.

**Agent invocations affected**: up to 3 (inline-docs, api-docs, readme-changelog).

---

## 6. Agent Spawn Inventory

| Command | Step | Agent Name | Named Agent File | Phase |
|---------|------|-----------|-----------------|-------|
| `/rpi:research` | 4 | requirement-parser | `agents/requirement-parser.md` | research |
| `/rpi:research` | 4 | explore-codebase | `agents/explore-codebase.md` | research |
| `/rpi:research` | 4 | product-manager | `agents/product-manager.md` | research |
| `/rpi:research` | 4 | senior-engineer | `agents/senior-engineer.md` | research |
| `/rpi:research` | 4 | cto-advisor | `agents/cto-advisor.md` | research |
| `/rpi:research` | 4 | ux-designer | `agents/ux-designer.md` | research |
| `/rpi:research` | 5 | doc-synthesizer | `agents/doc-synthesizer.md` | research |
| `/rpi:plan` | 4 | senior-engineer | `agents/senior-engineer.md` | plan |
| `/rpi:plan` | 5 | product-manager | `agents/product-manager.md` | plan |
| `/rpi:plan` | 6 | ux-designer | `agents/ux-designer.md` | plan |
| `/rpi:plan` | 7 | senior-engineer | `agents/senior-engineer.md` | plan |
| `/rpi:implement` | 6a | plan-executor | `agents/plan-executor.md` | implement |
| `/rpi:implement` | 6a TDD | test-engineer | `agents/test-engineer.md` | implement |
| `/rpi:test` | 4 RED | test-engineer | `agents/test-engineer.md` | implement |
| `/rpi:test` | 4 GREEN | plan-executor | `agents/plan-executor.md` | implement |
| `/rpi:simplify` | 2 | reuse-checker | (inline sub-agent) | implement |
| `/rpi:simplify` | 2 | quality-checker | (inline sub-agent) | implement |
| `/rpi:simplify` | 2 | efficiency-checker | (inline sub-agent) | implement |
| `/rpi:review` | 3 | code-reviewer | `agents/code-reviewer.md` | review |
| `/rpi:docs` | 5 | inline-docs-agent | (inline sub-agent) | review |
| `/rpi:docs` | 5 | api-docs-agent | (inline sub-agent) | review |
| `/rpi:docs` | 5 | readme-changelog-agent | (inline sub-agent) | review |

**Total**: 22 agent spawn sites across 7 commands. Some are conditional (ux-designer only for deep tier, TDD agents only if enabled, api-docs only if endpoints exist).

---

## 7. Status Messages

### Format

When a model is explicitly resolved (not inherited), command outputs once before spawning agents:

```
Profile: {profile} | {phase} phase -> {model}
```

With override:

```
Profile: {profile} | {phase} phase -> {model} (override)
```

### When to show

- Show: when `profile` or `models.{phase}` is set and a concrete model is resolved.
- Do NOT show: when no profile and no override is set (inherit parent).

---

## 8. Validation

### Model Name Validation

Valid values: `opus`, `sonnet`, `haiku`.

**Point 1: `/rpi:set-profile` command** (Step 5)
- Validates profile name against the 4 valid profiles.
- Rejects invalid names with error listing valid options.
- Does NOT write to config on invalid input.

**Point 2: Model Resolution Algorithm** (each command's Step 1b)
- If `models.{phase}` has an invalid value: warn and fall back to profile default or parent.
- If `profile` has an unrecognized value: warn and treat all phases as "inherit parent".
- Execution continues. Never block a workflow because of a config typo.

### No Validation of `models` Block Keys

If a user writes `models.thinking: opus`, the key is silently ignored. No error, no warning.

---

## 9. Init Integration

### File: `commands/rpi/init.md`

Add a new **Batch 5 (Model Profiles)** after the existing Batch 4 (TDD):

```
**Batch 5 (Model Profiles):**
- "Which model profile do you want for agent execution?" -- Options:
  - `balanced` (Recommended -- opus for research/plan/review, sonnet for implement)
  - `quality-first` (opus everywhere)
  - `speed-first` (sonnet everywhere)
  - `budget` (haiku + sonnet mix, may reduce research quality)
  - "No profile" (default -- all agents inherit parent model)
```

If the user selects a profile, add the `profile:` key to the generated `.rpi.yaml`. If "No profile", omit the key entirely.

---

## 10. `/rpi:status` Integration

### File: `commands/rpi/status.md`

Add `profile` and `models` reading to Step 1. Add one line to the output header:

```
Active profile: {profile_name or "none"}
```

---

## 11. Testing Strategy

### File: `test/commands.test.js`

**Update `EXPECTED_COMMANDS` array**: Add `"set-profile"`. New array will have 13 entries.

This automatically validates:
- `set-profile.md` exists
- `set-profile.md` has valid frontmatter
- No orphan command files

### Manual Verification Checklist

1. `/rpi:set-profile` with no args -- shows current profile
2. `/rpi:set-profile balanced` -- updates `.rpi.yaml`
3. `/rpi:set-profile invalid-name` -- rejects with valid options
4. `/rpi:research` with `profile: balanced` -- agents spawn with `model: opus`
5. `/rpi:implement` with `profile: balanced` -- plan-executor spawns with `model: sonnet`
6. Remove `profile` and `models` -- behaves identically to pre-feature
7. Set `models.research: haiku` with `profile: balanced` -- override wins
8. Set `models.plan: invalid-model` -- warns and falls back

---

## 12. File Inventory

### New Files

| File | Description |
|------|-------------|
| `commands/rpi/set-profile.md` | New `/rpi:set-profile` command |

### Modified Files

| File | What Changes |
|------|-------------|
| `skills/rpi-workflow/SKILL.md` | Add "Model Resolution Algorithm" section; add `profile` and `models` to config block; add `/rpi:set-profile` to skill description trigger list |
| `commands/rpi/init.md` | Add Batch 5 (Model Profiles) interview question; update `.rpi.yaml` template |
| `commands/rpi/research.md` | Add model resolution to Step 1; add `model` param to Steps 4, 5 |
| `commands/rpi/plan.md` | Add model resolution to Step 1; add `model` param to Steps 4, 5, 6, 7 |
| `commands/rpi/implement.md` | Add model resolution to Step 1; add `model` param to Step 6a + TDD agents |
| `commands/rpi/test.md` | Add model resolution to Step 1; add `model` param to RED + GREEN agents |
| `commands/rpi/simplify.md` | Add model resolution to Step 1; add `model` param to 3 sub-agents |
| `commands/rpi/review.md` | Add model resolution to Step 1; add `model` param to code-reviewer |
| `commands/rpi/docs.md` | Add model resolution to Step 1; add `model` param to 3 doc agents |
| `commands/rpi/status.md` | Add active profile line to output |
| `test/commands.test.js` | Add `"set-profile"` to `EXPECTED_COMMANDS` |
| `CHANGELOG.md` | Add entry under `[Unreleased]` |
| `README.md` | Add `/rpi:set-profile` to Commands table; add Model Profiles section |

### Files NOT Modified

| File | Why Not |
|------|---------|
| `agents/*.md` (all 12) | Model is a command-level concern. Agents receive `model` from the Agent tool call. |
| `commands/rpi/onboarding.md` | Not a workflow phase. Always inherits parent model. |
| `commands/rpi/new.md` | No agent spawning. |
| `commands/rpi/add-todo.md` | No agent spawning. |
| `skills/rpi-agents/SKILL.md` | Model resolution documented in `rpi-workflow`, not `rpi-agents`. |

---

## 13. Technical Decisions

| Decision | Chosen | Rejected | Why |
|----------|--------|----------|-----|
| Resolution algorithm location | `rpi-workflow/SKILL.md` | Inline in each command | 7 commands would duplicate logic. SKILL.md is single source of truth. |
| Phase count | 4 phases | 7 phases (one per command) | 4 phases match user mental model. |
| `simplify` mapping | `implement` | `review` | Simplify is sub-step of implementation. |
| `docs` mapping | `review` | `implement` | Docs generation is post-implementation quality work. |
| `onboarding` mapping | No profile | `research` | Not a feature workflow phase. |
| Per-phase override UX | Manual `.rpi.yaml` edit | CLI flags | Power-user feature. YAML editing is simple. |
| Budget profile | Ship with warning | Defer to v2 | User-accepted risk. |
| Provider extensibility | Not included | Build now | YAGNI -- only 3 model strings. |
| Validation strictness | Warn and fall back | Error and halt | Don't block workflows for typos. |
| Status messages | Only when resolved | Always show | Avoid noise for users without profiles. |

---

## 14. Breaking Changes

**None.** This feature is fully additive and backward compatible.

---

## 15. Implementation Order

1. `skills/rpi-workflow/SKILL.md` -- Add resolution algorithm + config schema
2. `commands/rpi/set-profile.md` -- Create new command
3. `test/commands.test.js` -- Add to EXPECTED_COMMANDS
4. `commands/rpi/research.md` -- First command modification
5. `commands/rpi/plan.md` -- Second command modification
6. `commands/rpi/implement.md` -- Largest command
7. `commands/rpi/test.md` -- Same pattern
8. `commands/rpi/simplify.md` -- Same pattern
9. `commands/rpi/review.md` -- Same pattern
10. `commands/rpi/docs.md` -- Same pattern
11. `commands/rpi/init.md` -- Add Batch 5
12. `commands/rpi/status.md` -- Add profile line
13. `README.md` -- Documentation
14. `CHANGELOG.md` -- Release notes

**Estimated Complexity: L** -- Many files (14 modified + 1 new) but repetitive pattern.
