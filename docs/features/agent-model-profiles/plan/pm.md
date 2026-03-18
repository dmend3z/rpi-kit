# Agent Model Profiles -- Product Requirements

## 1. User Value

RPI spawns agents across 7 commands (~22 Agent tool invocations). Today, every agent inherits the parent session's model. A user running opus for high-quality research also runs opus for mechanical implementation tasks -- paying more where sonnet would suffice.

**Quantified improvement:**
- The `balanced` profile runs opus for research (6+ agents) + plan (3 agents) + review (1+ agents), but drops to sonnet for implement (plan-executor, test-engineer, 3 simplify sub-agents). That is roughly 40-50% of all agent invocations shifted from opus to sonnet.
- The `speed-first` profile runs sonnet everywhere -- useful for experienced users who want fast iteration on well-understood features.
- The `budget` profile uses haiku where quality tolerance is higher (implement) and sonnet for thinking-heavy phases (plan, review). Ships with documented quality-degradation warning for haiku on research.

**Backward compatibility:** No profile configured = identical to current behavior (inherit parent model). Zero risk to existing users.

---

## 2. Scope Definition

| Item | Effort | Files |
|------|--------|-------|
| Config schema extension (`.rpi.yaml` + SKILL.md) | S | `skills/rpi-workflow/SKILL.md`, `commands/rpi/init.md` |
| Profile lookup table (4 profiles in SKILL.md) | S | `skills/rpi-workflow/SKILL.md` |
| New command: `/rpi:set-profile` | M | `commands/rpi/set-profile.md` (new) |
| Model resolution in `/rpi:research` | M | `commands/rpi/research.md` |
| Model resolution in `/rpi:plan` | S | `commands/rpi/plan.md` |
| Model resolution in `/rpi:implement` | M | `commands/rpi/implement.md` |
| Model resolution in `/rpi:test` | S | `commands/rpi/test.md` |
| Model resolution in `/rpi:simplify` | S | `commands/rpi/simplify.md` |
| Model resolution in `/rpi:review` | S | `commands/rpi/review.md` |
| Model resolution in `/rpi:docs` | S | `commands/rpi/docs.md` |
| `/rpi:init` integration (new interview batch) | S | `commands/rpi/init.md` |
| `/rpi:status` profile display | S | `commands/rpi/status.md` |
| Tests | S | `test/commands.test.js` |
| Docs (README, CHANGELOG) | S | `README.md`, `CHANGELOG.md` |

**Total estimated effort: L (3-5 days)**

---

## 3. Out of Scope

- **Provider extensibility** -- Only Claude models (opus, sonnet, haiku). No OpenAI or custom providers.
- **Custom profile definitions** -- Users cannot define named profiles beyond the 4 pre-defined ones. Per-phase overrides cover custom use cases.
- **Agent-level model overrides** -- Model is set per phase, not per individual agent. All agents within a phase use the same model.
- **Automatic profile recommendation** -- No logic to suggest a profile based on feature complexity.
- **Cost tracking or reporting** -- No token counting or cost estimation.
- **Model fallback chains** -- No "try opus, fall back to sonnet" chains. Warn and inherit parent.
- **Onboarding profile application** -- `/rpi:onboarding` does not use profiles.
- **Runtime model switching** -- No mid-command model changes. Profile is read at command start.

---

## 4. User Stories

### Story 1: Profile Selection

As a developer, I want to select a pre-defined model profile so that I can optimize cost/quality tradeoffs without manually configuring each phase.

- **AC1:** Given the user runs `/rpi:set-profile balanced`, when the command completes, then `.rpi.yaml` contains `profile: balanced` and the command outputs the profile name with the full phase-to-model mapping.
- **AC2:** Given `profile: balanced` is configured, when the user runs `/rpi:research feature-x`, then all research agents are spawned with `model: "opus"`.
- **AC3:** Given `profile: balanced` is configured, when the user runs `/rpi:implement feature-x`, then the plan-executor agent is spawned with `model: "sonnet"`.
- **AC4:** Given the user runs `/rpi:set-profile invalid-name`, then an error is displayed listing the 4 valid profile names and `.rpi.yaml` is NOT modified.
- **AC5:** Given `.rpi.yaml` exists with no `profile` key and no `models` block, when any command runs, then agent spawning behaves identically to current behavior (no `model` param passed).

### Story 2: Per-Phase Model Overrides

As a power user, I want to override specific phase models in `.rpi.yaml` so that I can fine-tune beyond the pre-defined profiles.

- **AC1:** Given `profile: balanced` and `models: { implement: opus }`, when `/rpi:implement` runs, then plan-executor spawns with `model: "opus"` (override wins over profile's `sonnet`).
- **AC2:** Given no `profile` key but `models: { research: haiku }`, when `/rpi:research` runs, then research agents spawn with `model: "haiku"` and all other phases inherit parent.
- **AC3:** Given `models: { plan: invalid-model }`, when `/rpi:plan` runs, then a warning is displayed and agents spawn without a `model` param (inherit parent).

### Story 3: Model Visibility and Status Messages

As a user, I want to see which model is being used so that I have transparency into my profile configuration.

- **AC1:** Given a profile is active, when a command runs, then a status line is shown: `Profile: {profile} | {phase} phase -> {model}`.
- **AC2:** Given the user runs `/rpi:set-profile` with no arguments, then the current profile, resolved model for each phase, and any active overrides are displayed.
- **AC3:** Given the user runs `/rpi:status`, then the output includes `Active profile: {name}`.

### Story 4: Init Integration

As a new user, I want to be asked about model profiles during initialization.

- **AC1:** Given the user runs `/rpi:init`, when the interview reaches batch 5, then the user is asked about profile selection with options: balanced (Recommended), quality-first, speed-first, budget, none.
- **AC2:** Given the user selects `balanced`, then `.rpi.yaml` is written with `profile: balanced`.
- **AC3:** Given the user selects `none`, then `.rpi.yaml` is written WITHOUT a `profile` key.

### Story 5: Backward Compatibility

As an existing user, I want my workflow to work exactly as before if I don't configure a profile.

- **AC1:** Given a `.rpi.yaml` from a previous version (no `profile` or `models` keys), when any command runs, then no `model` param is passed to Agent tool invocations.
- **AC2:** Given a `.rpi.yaml` with unknown keys, when commands run, then unknown keys are ignored without error.

### Story 6: Phase Mapping Correctness

As a developer, I want each command's agents to use the correct phase mapping.

- **AC1:** Given `profile: balanced`, when `/rpi:test` runs, then agents spawn with `model: "sonnet"` (implement phase).
- **AC2:** Given `profile: balanced`, when `/rpi:simplify` runs, then agents spawn with `model: "sonnet"` (implement phase).
- **AC3:** Given `profile: balanced`, when `/rpi:docs` runs, then agents spawn with `model: "opus"` (review phase).
- **AC4:** Given any profile, when `/rpi:onboarding` runs, then no `model` param is passed (no phase mapping).

---

## 5. Edge Cases and Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Invalid profile name in `/rpi:set-profile xyz` | Error with valid options. Config unchanged. |
| Invalid model name in `models: { research: gpt-4 }` | Warning at command start. Agent spawned without `model` param. |
| Both `profile` and full `models` block (all 4 overridden) | All overrides win. Profile effectively ignored but stored. |
| Partial `models` block (only `research` specified) | Research uses override. Other phases use profile defaults or inherit. |
| Empty `.rpi.yaml` (file exists, zero keys) | All defaults. No profile. Identical to v1.2.1. |
| `.rpi.yaml` does not exist | Commands have existing missing-config handling. Profile returns "inherit parent". |
| `profile: budget` + deep research | Research runs with haiku. Documented quality risk. No special handling. |
| Typo in models key (`models: { reserch: opus }`) | Silently ignored. Not a valid phase name. |
| `/rpi:implement` calls simplify and review internally | Sub-commands resolve their own phase models independently. |
| Mid-command `.rpi.yaml` edit | No effect. Config read once at command start. |
| `/rpi:set-profile` when `.rpi.yaml` doesn't exist | Error: "Run /rpi:init first." |

---

## 6. Success Metrics

| Metric | Target |
|--------|--------|
| Backward compatibility | Zero behavioral change for users without profile config |
| Profile coverage | All 7 agent-spawning commands respect profile config |
| Validation completeness | All invalid inputs produce actionable error messages |
| Config persistence | `/rpi:set-profile` correctly reads and writes `.rpi.yaml` |
| Override precedence | `models.{phase}` always wins over `profile` defaults |
| Documentation accuracy | SKILL.md, README, CHANGELOG reflect the feature |

---

## 7. Risk Register

| Risk | Level | Detail | Mitigation |
|------|-------|--------|------------|
| Agent tool `model` param instability | HIGH | Zero existing usage. Param not versioned. | Validate with spike. Keep model strings in SKILL.md (single update point). Fully reversible. |
| Budget profile quality degradation | MEDIUM | Haiku for research risks shallow findings that cascade. | Ship with explicit warning in docs. User accepted risk. |
| Wide regression surface | MEDIUM | ~22 agent spawn sites across 7 commands. | Define resolution once in SKILL.md. Review all commands for consistency. |
| Maintenance burden | MEDIUM | Every new command needs resolution. Every new model needs list update. | Document checklist in SKILL.md. Keep valid list in one place. |
| Config complexity increase | LOW | `.rpi.yaml` grows from 12 to 14+ keys. | Both new keys are optional. Single init question for new users. |
| Phase mapping confusion | LOW | Users may not know test maps to implement phase. | `/rpi:set-profile` displays full mapping. Documented in SKILL.md. |

---

## 8. Phase-to-Command-to-Model Reference

| Phase | Commands | Profile: quality-first | Profile: balanced | Profile: speed-first | Profile: budget |
|-------|----------|----------------------|-------------------|---------------------|-----------------|
| research | `/rpi:research` | opus | opus | sonnet | haiku |
| plan | `/rpi:plan` | opus | opus | sonnet | sonnet |
| implement | `/rpi:implement`, `/rpi:test`, `/rpi:simplify` | opus | sonnet | sonnet | haiku |
| review | `/rpi:review`, `/rpi:docs` | opus | opus | sonnet | sonnet |
| (none) | `/rpi:onboarding` | inherit | inherit | inherit | inherit |
