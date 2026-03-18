# Research: Agent Model Profiles

## Executive Summary

| Field | Value |
|-------|-------|
| **Verdict** | **GO with concerns** |
| **Complexity** | **L** (full scope) / **M** (recommended reduced scope) |
| **Risk** | **MEDIUM** — wide surface area (7 commands, ~20 agent spawn sites), phase-mapping ambiguity, zero existing `model` param usage to validate against |
| **Core Value** | Real and clear — opus for thinking (research/plan/review), sonnet for doing (implement) maps directly to how RPI phases are designed |
| **Key Concern** | Full scope (4 profiles + `/rpi:set-profile` + provider extensibility) is over-engineered for current project stage (v1.2.1, 0 user requests). Recommend reduced scope. |

---

## Requirements Analysis

**Source: Requirement Parser**

### Functional Requirements — Verdict: GO

12 testable functional requirements extracted (R1-R12):

| ID | Requirement | Testable |
|----|-------------|----------|
| R1 | Four pre-defined profiles with specific phase-model mappings | Yes |
| R2 | `.rpi.yaml` supports `profile` (string) + `models` (object with 4 phase keys) | Yes |
| R3 | Per-phase overrides take precedence over active profile | Yes |
| R4 | `/rpi:set-profile` command exists with valid frontmatter | Yes |
| R5 | Display current profile + per-phase mapping when invoked | Yes |
| R6 | Validate profile name against pre-defined list | Yes |
| R7 | Persist selected profile to `.rpi.yaml` | Yes |
| R8 | All 8 agent-spawning commands pass resolved model to Agent tool | Yes |
| R9 | Status messages show which model per agent spawn | Yes |
| R10 | Validate model names against `[opus, sonnet, haiku]` | Yes |
| R11 | Graceful fallback on invalid model (warn + use default) | Yes |
| R12 | No profile configured = inherit parent model (backward compatible) | Yes |

### Non-Functional Requirements — Verdict: GO

- **NR1:** Backward compatibility — no profile = identical to current behavior
- **NR2:** Extensibility — model names validated against a list (not hardcoded inline)
- **NR3:** Single source of truth — all config in `.rpi.yaml`
- **NR4:** New command auto-discovered by plugin system

### Ambiguities & Gaps — Verdict: CONCERN

8 unknowns identified that need resolution before implementation:

| ID | Unknown | Assumed Resolution |
|----|---------|-------------------|
| U1 | Default fallback model when invalid config | Inherit parent (omit `model` param) |
| U2 | `simplify` phase mapping | `implement` phase |
| U3 | `onboarding` phase mapping | No profile applied (not a workflow phase) |
| U4 | `docs` phase mapping | `review` phase |
| U5 | `test` phase mapping | `implement` phase |
| U6 | Should `/rpi:set-profile` support per-phase flags? | No — profile switching only |
| U7 | Should `/rpi:init` include profile selection? | Yes, new batch question |
| U8 | Default for new projects | No profile (backward compatible) |

### Implicit Requirements (7 found)

- IR1: Update `EXPECTED_COMMANDS` in `test/commands.test.js`
- IR2: Update `rpi-workflow` SKILL.md config docs
- IR3: Review `rpi-agents` SKILL.md phase mapping
- IR4: 8 command files need coordinated model resolution
- IR5: Centralized resolution pattern needed (define once in SKILL.md, reference from commands)
- IR6: Frontmatter test for new command
- IR7: CHANGELOG and README updates

---

## Product Analysis

**Source: Product Manager**

### User Value — Verdict: CONCERN

The pain point is real: RPI spawns agents across 7 commands, and all inherit the parent model. Users running opus for research quality also run opus for implementation — paying more where sonnet would suffice.

**However:**
- Cost savings are speculative (no data on token distribution across phases)
- The "budget" profile (haiku for research) risks low-quality outputs that cascade through the pipeline — RPI agents have strict quality requirements (cite evidence, structured verdicts)
- Target audience is power users — unclear adoption size

### Scope Assessment — Verdict: CONCERN

The proposed scope is borderline L/XL:
- 1 new file, 15-17 modified files
- Model resolution logic replicated in 8 markdown command files (no shared functions possible)
- 4 ambiguities need resolution before implementation

### Acceptance Criteria (defined by PM)

**Story 1: Profile selection**
- AC1: `/rpi:set-profile balanced` → `.rpi.yaml` has `profile: balanced`
- AC2: `/rpi:research` with balanced → research agents spawn with `model: "opus"`
- AC3: `/rpi:implement` with balanced → plan-executor spawns with `model: "sonnet"`
- AC4: Invalid profile name → error listing valid profiles, config unchanged
- AC5: No profile configured → identical to current behavior

**Story 2: Per-phase overrides**
- AC1: `profile: balanced` + `models.implement: opus` → implement uses opus (override wins)
- AC2: `models.research: haiku` with no profile → research uses haiku
- AC3: `models.plan: invalid-model` → warning + fallback to parent model

**Story 3: Model visibility**
- AC1: Status message per agent spawn: `Spawning {agent-name} (model: {resolved-model})`
- AC2: `/rpi:set-profile` with no args → shows current profile + mapping
- AC3: `/rpi:status` → shows active profile

### Product Risks

| Risk | Level | Detail |
|------|-------|--------|
| Platform dependency | HIGH | Agent tool `model` param has zero existing usage in codebase — must validate before implementation |
| Maintenance burden | MEDIUM | 8 files with replicated resolution logic |
| Quality degradation | MEDIUM | Budget/haiku profile may produce low-quality research |
| Scope creep | LOW-MED | Provider extensibility adds complexity for zero current users |
| Adoption | LOW | Non-breaking, opt-in |

### PM Scope Reduction Recommendation (MVP)

1. Ship 2 profiles (balanced, speed-first), not 4
2. Drop `/rpi:set-profile` command — users edit `.rpi.yaml` directly
3. Drop provider extensibility
4. Drop per-agent status messages
5. Reduces from **L to M**

---

## Codebase Analysis

**Source: Codebase Explorer**

### Agent Architecture — Verdict: GO

- 12 agent files in `agents/*.md` — YAML frontmatter with `name`, `description`, `tools`, `color`
- **No `model` field** exists in any agent definition
- Agents spawned exclusively via Agent tool from command files
- ~20 total Agent invocations across 8 commands

### Command Structure — Verdict: GO

- All 12 commands follow identical pattern: frontmatter → objective → process → numbered steps
- Step 1 is always "Load config and parse arguments" (reads `.rpi.yaml`)
- Model injection point: add `model` param to Agent tool invocation instructions

### Phase-to-Command Mapping

| Phase | Commands | Agent Count |
|-------|----------|-------------|
| research | `/rpi:research` | 6+ agents + doc-synthesizer |
| plan | `/rpi:plan` | 3 agents (senior-engineer, product-manager, ux-designer) |
| implement | `/rpi:implement`, `/rpi:test`, `/rpi:simplify` | plan-executor, test-engineer, 3 simplify sub-agents |
| review | `/rpi:review`, `/rpi:docs` | code-reviewer, 3 doc agents |
| (no phase) | `/rpi:onboarding` | 3 scanner agents — inherits parent model |

### Configuration System — Verdict: GO

Current `.rpi.yaml` has 7-12 keys. Proposed `profile` + `models` additions fit cleanly. Schema documented in 3 places: `init.md`, `SKILL.md`, `README.md`.

### Impact Analysis — Verdict: CONCERN

| Category | Count |
|----------|-------|
| New files | 1 (`commands/rpi/set-profile.md`) |
| Modified files | 15-17 |
| Agent spawn sites to update | ~20 across 7 commands |
| Config fields added | 5 (`profile` + 4 phase keys) |

**Core concern:** Model resolution logic must be described in natural language in 8 separate markdown command files. No shared function possible. Mitigation: define pattern once in SKILL.md, reference from each command.

---

## Technical Analysis

**Source: Senior Engineer**

### Architecture — Verdict: GO

Data flow:
```
.rpi.yaml (profile + models overrides)
    ↓
Command reads config (Step 1)
    ↓
Resolve: overrides > profile defaults > inherit parent
    ↓
Agent tool call with model: "{resolved_model}"
    ↓
Status message: "Using model: {model} for {phase} phase"
```

Profile lookup table:

| Profile | research | plan | implement | review |
|---------|----------|------|-----------|--------|
| quality-first | opus | opus | opus | opus |
| balanced | opus | opus | sonnet | opus |
| speed-first | sonnet | sonnet | sonnet | sonnet |
| budget | haiku | sonnet | haiku | sonnet |

### Implementation Strategy — Verdict: GO

4 work streams:
1. **Config schema extension** — SKILL.md, init.md, .rpi.yaml
2. **New command** — `commands/rpi/set-profile.md`
3. **Model propagation** — 7 command files (research, plan, implement, test, simplify, review, docs)
4. **Docs & tests** — SKILL.md, README, CHANGELOG, test/commands.test.js

### Key Technical Decisions

| Decision | Chosen | Rejected | Rationale |
|----------|--------|----------|-----------|
| Config location | Extend `.rpi.yaml` | Separate file | Single source of truth |
| Profile storage | Flat phase-to-model map | Inheritance chains | Explicit and readable |
| simplify phase | `implement` | Own phase | 4-phase model matches user mental model |
| docs phase | `review` | Own phase | Semantically post-implementation |
| onboarding phase | No profile | `research` | Not a workflow phase |
| Resolution centralization | SKILL.md reference | Utility agent | No runtime code; extra agent call = latency cost |
| Provider extensibility | Defer (YAGNI) | Build now | Only 1 provider, 3 model strings |

### Technical Risks — Verdict: GO

- Model param is prompt-instructed, not code-enforced — low risk, existing patterns work reliably
- 7 command files is repetitive but not complex — mitigate with SKILL.md reference pattern
- Backward compatibility is safe by design (undefined = inherit parent)

Estimated Complexity: **M** (repetitive, not complex)

---

## Strategic Analysis

**Source: CTO Advisor**

### Strategic Alignment — Verdict: CONCERN

- RPIKit's mission is workflow rigor (Research → Plan → Implement). Model profiles add **cost optimization**, not workflow improvement.
- Project at v1.2.1 — early growth stage. Session isolation plan exists but is not yet shipped.
- Feature appears to be competitive parity (`/gsd:set-profile` referenced) rather than user-demand driven.
- No GitHub issues or user requests cited.

### Risk Assessment — Verdict: CONCERN

| Risk | Level | Detail |
|------|-------|--------|
| Agent tool `model` param instability | HIGH | Not versioned, model naming could change |
| Wide regression surface | MEDIUM | 20 agent spawn sites across 7 commands |
| Phase-model mapping mismatch | MEDIUM | 4 phases ≠ 7 agent-spawning commands |
| Config complexity increase | LOW-MED | 42% increase (10→15 fields) |
| Provider extensibility | LOW-MED | Premature abstraction |

### Maintenance Burden

- Every new Agent spawn site needs model resolution replication
- Every new Claude model name needs validation list update
- Profile definitions need maintenance as model capabilities change

### Reversibility: HIGH

All markdown changes, zero runtime code. `git revert` + delete 1 file. Users with configured profiles would see fields ignored (not error). No data loss.

---

## Contradictions Resolved

| Conflict | Resolution |
|----------|------------|
| **Complexity:** Requirement parser/explorer say L. Senior engineer says M. PM says L/XL. | **L for full scope, M for reduced scope.** Senior engineer's M rating reflects the repetitive (not complex) nature; PM's L/XL reflects the wide surface area. Both are correct for their scope. |
| **docs phase:** Requirement parser assumed `implement`. Senior engineer says `review`. | **Review.** Docs generation is semantically post-implementation, aligns with review-tier quality needs. |
| **onboarding phase:** Requirement parser says `research`. Senior engineer says no profile. | **No profile.** Onboarding is codebase analysis, not feature research. Applying a profile model is semantically wrong. |
| **Should this be built as proposed?** Engineers say GO. PM and CTO say CONCERN. | **GO with reduced scope.** Core value is validated. Full scope includes premature features (provider extensibility, 4 profiles including risky budget, dedicated command). |
| **Provider extensibility:** | **Cut from v1.** All 5 agents agree this is YAGNI. |
| **Budget profile safety:** PM flags haiku-for-research as quality risk. | **Include with warning, or defer to v2.** Research agents have strict quality requirements that haiku may not meet. |

---

## Alternatives

### Alternative 1: Single model field (S complexity)
Add one `model` field to `.rpi.yaml`. All agents use the same model. Users who want per-phase control edit config between phases.
- **Pro:** 1 config field, 0 new commands, ships in a day
- **Con:** No per-phase granularity without manual editing

### Alternative 2: Phase-level overrides only (M complexity) — RECOMMENDED
Add `models:` block to `.rpi.yaml` with 4 phase keys. No profiles, no `/rpi:set-profile`, no provider extensibility. Each command resolves `models.{phase}` from config, defaults to parent model.
- **Pro:** 80% of value with 30% of scope. No new command, no profile maintenance.
- **Con:** Users must know model names; no preset guidance.

### Alternative 3: Full scope as proposed (L complexity)
4 profiles + custom overrides + `/rpi:set-profile` + validation + status messages + docs.
- **Pro:** Complete, polished UX with guided profile selection
- **Con:** Over-engineered for v1.2.x stage, 15-17 files modified, maintenance burden

### Alternative 4: Defer until session isolation ships (timing)
Session isolation modifies 5 of the same files. Building both concurrently creates merge conflicts.
- **Pro:** No conflict risk, focused delivery
- **Con:** Delays the feature

---

## Recommendation

**Build Alternative 2 first (M), then layer profiles on top in a follow-up (S→M increment).**

### Phase 1 (M complexity — this feature)
- Add `models:` block to `.rpi.yaml` schema (4 phase keys)
- Add model resolution to 7 agent-spawning commands
- Add profile selection to `/rpi:init` interview
- Update SKILL.md, tests, docs
- No new command, no pre-defined profiles, no provider extensibility

### Phase 2 (S complexity — follow-up feature)
- Add pre-defined profiles (start with `balanced` and `speed-first`)
- Add `/rpi:set-profile` command
- Add status messages per agent spawn
- Consider `budget` profile only after validating haiku quality on research agents

This approach:
1. Ships the core value faster (per-phase model control)
2. Avoids premature abstractions (profiles, provider extensibility)
3. Validates the Agent tool `model` parameter works before building on top of it
4. Reduces merge conflict risk with session isolation work
