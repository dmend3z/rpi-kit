# Implementation Plan: Agent Model Profiles

## Metadata
tasks: 18 | files: 15 | max_depth: 3
context_weight: 31.5
suggested_tier: 3
plan_hash: 63d4ebf312c321b1c60159cd9d251f58ae1ae5bcb534015e74b0ac4f8b633650

## Phase 1: Foundation (SKILL.md + Config Schema)

- [ ] **1.1** Add "Model Resolution Algorithm" section to `skills/rpi-workflow/SKILL.md`
  Effort: M | Deps: none
  Files: skills/rpi-workflow/SKILL.md
  Test: SKILL.md contains "Model Resolution Algorithm" section with resolution order (per-phase override > profile default > inherit parent), the profile lookup table (4 profiles x 4 phases), phase-to-command mapping table, validation rules, and status message format. Section is inserted between "Configuration (.rpi.yaml)" and "Feature Folder Structure".

- [ ] **1.2** Extend `.rpi.yaml` config schema in SKILL.md and add `/rpi:set-profile` to the skill description trigger list
  Effort: S | Deps: 1.1
  Files: skills/rpi-workflow/SKILL.md
  Test: The `.rpi.yaml` config block in SKILL.md includes `profile:` and `models:` keys with comments. The skill frontmatter `description` field includes `/rpi:set-profile` in the trigger command list. Budget profile has a documented quality warning.

## Phase 2: New Command + Test Registration

- [ ] **2.1** Create `/rpi:set-profile` command file
  Effort: M | Deps: 1.1
  Files: commands/rpi/set-profile.md
  Test: File exists at `commands/rpi/set-profile.md` with valid frontmatter (`name: rpi:set-profile`, `description`, `argument-hint: "[quality-first|balanced|speed-first|budget]"`, `allowed-tools: [Read, Write, AskUserQuestion]`). Contains 7 steps: load config, parse arguments, display current profile (table format with Phase/Model columns), ask to switch (AskUserQuestion with 6 options including "Keep current"), validate profile name (rejects invalid with valid options list), persist to `.rpi.yaml` (updates `profile:` line without modifying `models:` block), confirm with new effective mapping. Budget profile selection triggers documented quality warning.

- [ ] **2.2** Add `"set-profile"` to `EXPECTED_COMMANDS` in test file
  Effort: S | Deps: 2.1
  Files: test/commands.test.js
  Test: `npm test` passes. The `EXPECTED_COMMANDS` array contains 13 entries including `"set-profile"`. The "no orphan command files" test passes. The `set-profile.md` frontmatter validation test passes (has `name:`, `description:`, `allowed-tools:`).

## Phase 3: Command Modifications (Model Resolution)

All 7 commands follow the same 3-step modification pattern from eng.md Section 5: (a) extend Step 1 config loading to read `profile` and `models`, (b) insert new Step 1b for model resolution referencing SKILL.md, (c) add `model` param to every Agent tool invocation. `/rpi:research` is first as the validation case (most agents, most complex).

- [ ] **3.1** Add model resolution to `/rpi:research` (phase: `research`, 7 agent spawn sites)
  Effort: M | Deps: 1.1
  Files: commands/rpi/research.md
  Test: Step 1 reads `profile` and `models` from `.rpi.yaml`. New Step 1b resolves model for the `research` phase following the Model Resolution Algorithm in the rpi-workflow skill and outputs status message if resolved. Steps 4 and 5 include `model: "{resolved_model}"` in all Agent tool invocation instructions (requirement-parser, explore-codebase, product-manager, senior-engineer, cto-advisor, ux-designer, doc-synthesizer). If no profile or override, `model` param is omitted (inherit parent).

- [ ] **3.2** Add model resolution to `/rpi:plan` (phase: `plan`, 4 agent spawn sites)
  Effort: S | Deps: 1.1
  Files: commands/rpi/plan.md
  Test: Step 1 reads `profile` and `models`. New Step 1b resolves model for `plan` phase. Steps 4, 5, 6, 7 Agent tool invocations (senior-engineer x2, product-manager, ux-designer) include `model` param if resolved.

- [ ] **3.3** Add model resolution to `/rpi:implement` (phase: `implement`, plan-executor + test-engineer spawn sites)
  Effort: M | Deps: 1.1
  Files: commands/rpi/implement.md
  Test: Step 1 reads `profile` and `models`. New Step 1b resolves model for `implement` phase. Step 6a agent prompt template includes `model` param for plan-executor. TDD section includes `model` param for test-engineer and plan-executor Agent calls. Status message outputs once before task execution begins.

- [ ] **3.4** Add model resolution to `/rpi:test` (phase: `implement`, test-engineer + plan-executor spawn sites)
  Effort: S | Deps: 1.1
  Files: commands/rpi/test.md
  Test: Step 1 reads `profile` and `models`. New Step 1b resolves model for `implement` phase. Phase RED (test-engineer) and Phase GREEN (plan-executor) Agent tool calls include `model` param if resolved.

- [ ] **3.5** Add model resolution to `/rpi:simplify` (phase: `implement`, 3 sub-agent spawn sites)
  Effort: S | Deps: 1.1
  Files: commands/rpi/simplify.md
  Test: Step 1 reads `profile` and `models`. New Step 1b resolves model for `implement` phase. Step 2 Agent tool invocations for all 3 sub-agents (reuse-checker, quality-checker, efficiency-checker) include `model` param if resolved.

- [ ] **3.6** Add model resolution to `/rpi:review` (phase: `review`, 1 agent spawn site)
  Effort: S | Deps: 1.1
  Files: commands/rpi/review.md
  Test: Step 1 reads `profile` and `models`. New Step 1b resolves model for `review` phase. Step 3 code-reviewer Agent call includes `model` param if resolved.

- [ ] **3.7** Add model resolution to `/rpi:docs` (phase: `review`, 3 agent spawn sites)
  Effort: S | Deps: 1.1
  Files: commands/rpi/docs.md
  Test: Step 1 reads `profile` and `models`. New Step 1b resolves model for `review` phase. Step 5 Agent calls (inline-docs, api-docs, readme-changelog) include `model` param if resolved.

## Phase 4: Integration (Init + Status)

- [ ] **4.1** Add Batch 5 (Model Profiles) to `/rpi:init` interview
  Effort: M | Deps: 1.2
  Files: commands/rpi/init.md
  Test: Step 2 includes a new Batch 5 after Batch 4 (TDD) with AskUserQuestion: "Which model profile do you want for agent execution?" with 5 options (balanced Recommended, quality-first, speed-first, budget with quality warning, none). Step 3 `.rpi.yaml` template includes `profile:` key (or omits if "none"). Step 5 confirmation includes `Profile:` line. Reconfiguration path shows current profile.

- [ ] **4.2** Add active profile line to `/rpi:status` output
  Effort: S | Deps: 1.2
  Files: commands/rpi/status.md
  Test: Step 1 reads `profile` and `models` from `.rpi.yaml`. Output includes `Profile:` line in compact format (e.g., `Profile: balanced (research: opus, plan: opus, implement: sonnet, review: opus)`). With overrides, asterisks mark overridden phases. No profile shows `Profile: none (inheriting parent model)`.

## Phase 5: Documentation

- [ ] **5.1** Add `/rpi:set-profile` to Commands table and add Model Profiles section to README
  Effort: S | Deps: 2.1, 4.1
  Files: README.md
  Test: Commands table includes a row for `/rpi:set-profile` with description. A "Model Profiles" section documents the 4 profiles with phase-model table, configuration via `/rpi:set-profile` or `.rpi.yaml`, and per-phase override syntax.

- [ ] **5.2** Add changelog entry for Agent Model Profiles
  Effort: S | Deps: 5.1
  Files: CHANGELOG.md
  Test: An `[Unreleased]` section exists with entries under "Added" listing: model profiles (4 profiles), `/rpi:set-profile` command, per-phase model overrides, profile selection in `/rpi:init`, active profile in `/rpi:status`. Under "Changed": 7 commands now pass resolved model to Agent tool.

---

## Dependency Graph

```
Phase 1 (Foundation):
  1.1 ────────────────────────┐
  1.2 (deps: 1.1) ───────────┤
                              │
Phase 2 (New Command):        │
  2.1 (deps: 1.1) ◄──────────┤
  2.2 (deps: 2.1)            │
                              │
Phase 3 (Commands):           │
  3.1 (deps: 1.1) ◄──────────┤
  3.2 (deps: 1.1) ◄──────────┤
  3.3 (deps: 1.1) ◄──────────┤
  3.4 (deps: 1.1) ◄──────────┤
  3.5 (deps: 1.1) ◄──────────┤
  3.6 (deps: 1.1) ◄──────────┤
  3.7 (deps: 1.1) ◄──────────┘

Phase 4 (Integration):
  4.1 (deps: 1.2)
  4.2 (deps: 1.2)

Phase 5 (Documentation):
  5.1 (deps: 2.1, 4.1)
  5.2 (deps: 5.1)
```

## Execution Notes

- Phase 3 tasks (3.1-3.7) are all independent and can be parallelized. `/rpi:research` (3.1) is listed first as validation pattern.
- After completing 3.1, remaining Phase 3 tasks are mechanical repetition of the same 3-step pattern.
- Task 1.1 is the critical path. Getting the Model Resolution Algorithm right in SKILL.md determines downstream quality.
- Phases 2 and 3 can run in parallel after 1.1 completes.
- Phase 4 requires 1.2 (not just 1.1) because init and status reference the config schema.

## Breaking Changes

**None.** Fully additive and backward compatible. No profile configured = identical to current behavior.
