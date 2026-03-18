# Research: Auto-Research Loop

## Executive Summary
Verdict: **GO with concerns**
Complexity: L (Phase 1 only; full vision is XL, deferred to Phase 2+)
Risk: High
Recommendation: Build Phase 1 only -- gap detection in doc-synthesizer + opt-in `--auto` loop in research.md, no new orchestrator agent, no PoC infrastructure, no composite scoring.
Key finding: The loop mechanics are proven feasible (implement.md already uses the pattern), but the original scope is premature -- validate AI self-evaluation via gap detection before committing to full autonomy.

---

## Requirements Analysis

### Functional Requirements

18 functional requirements were extracted. After resolving unknowns and applying phasing, 12 are retained for Phase 1:

| ID | Requirement | Phase 1 | Phase 2 |
|----|-------------|---------|---------|
| R1 | Auto-research loop available via `--auto` flag | Yes (opt-in) | Flip to default |
| R2 | Without `--auto`, behavior is EXACTLY current single-pass | Yes | Yes |
| R4 | Goal system to evaluate research quality | Checklist-based only | Composite 4-metric |
| R6 | Iterations 2-N driven by gap analysis | Yes (doc-synthesizer) | Yes |
| R9 | Keep-best strategy -- only replace RESEARCH.md if strictly better | Yes | Yes |
| R10 | Git commit per iteration as safety net | Yes | Yes |
| R11 | Stagnation detection after 2 iterations without improvement | No | Yes |
| R13 | AskUserQuestion after each iteration with summary + options | Yes | Yes |
| R14 | PoCs in `{feature}/research/poc/` | No | Yes |
| R16 | RESEARCH.md extended with iteration metadata sections | Yes (only in auto mode) | Yes |
| R17 | Tier-aware iteration defaults | Yes | Yes |
| R18 | Max iterations configurable via `.rpi.yaml` and CLI flag | Yes | Yes |

### Non-Functional Requirements

- NR1: Cost-conscious -- iterations target gaps only, not full re-research.
- NR2: Git history preserves all iteration versions.
- NR3: No external services beyond Claude Code's built-in tools.

### Unknowns Resolved

11 unknowns were identified by the Requirement Parser. Resolutions for Phase 1:

| ID | Unknown | Resolution |
|----|---------|------------|
| U1 | How is composite score calculated? | Phase 1: skip composite scoring. Use checklist-based evaluation (count of gaps remaining vs gaps addressed). Phase 2 defines weighted metrics. |
| U2 | Where is max_iterations configured? | Both: `auto_research_max_iterations` in `.rpi.yaml` (default: 3), overridable by `--max-iterations N` CLI flag. |
| U3 | What does "pivot strategy" mean? | Deferred to Phase 2. Phase 1 supports "Continue" and "Stop" only. |
| U4 | How are user-defined criteria extracted? | doc-synthesizer extracts checklist items from REQUEST.md Constraints and Requirements sections. |
| U5 | How does "Change direction" user input work? | Deferred to Phase 2. |
| U6 | Who performs keep-best comparison? | doc-synthesizer. It already reads all outputs and produces the verdict. Natural extension. |
| U7 | Does orchestrator need model resolution? | No orchestrator agent. The command prompt (research.md) handles the loop and already has model resolution. |
| U8 | How do tiers interact with auto-research? | Tier-aware defaults: `--quick` = no auto (single pass), `--standard` = max 2 iterations, `--deep` = max 5 iterations. CLI flag overrides. |
| U9 | Does orchestrator create ad-hoc agent prompts? | No orchestrator. doc-synthesizer's gap analysis output tells research.md which agents to re-spawn and what to focus on. |
| U10 | What happens to --force flag in auto mode? | `--force` skips the "overwrite existing?" prompt as today. Orthogonal to `--auto`. |
| U11 | Should folder structure include research/poc/? | Deferred to Phase 2. |

### Implicit Requirements (Phase 1)

- IR3: research.md `argument-hint` must include `--auto` and `--max-iterations`.
- IR4: doc-synthesizer must produce a "Gap Analysis" section when running in auto mode.
- IR7: Schema extensions must be additive -- `/rpi:plan` must not break on new RESEARCH.md sections.
- IR8: Checklist-based scoring must be deterministic enough for keep-best to work.
- IR9: "Stop" after iteration 1 must produce valid single-pass RESEARCH.md (no metadata sections if user stops immediately).

### Dependencies

- `commands/rpi/research.md` -- major modification
- `agents/doc-synthesizer.md` -- extend with gap analysis output
- `skills/rpi-workflow/SKILL.md` -- document auto-research config keys
- `skills/rpi-agents/SKILL.md` -- update doc-synthesizer responsibilities

## Product Scope

### User Value

The problem is real but the target audience is narrow today. Most RPIKit users run research interactively. The "set and forget overnight" use case assumes long sessions that are not yet common with the current user base. AI self-evaluation is unproven.

However, gap detection alone provides immediate diagnostic value even without the loop: users see what the research missed and can manually re-run `/rpi:research --force` to address specific gaps. This validates the core premise before investing in full automation.

### Effort Estimates

| Scope | Effort | Description |
|-------|--------|-------------|
| Phase 1 (recommended) | L (~1 week) | Loop mechanics in research.md, gap analysis in doc-synthesizer, `--auto` opt-in flag, tier-aware defaults, RESEARCH.md schema extension, git commit per iteration, skill doc updates |
| Phase 2 (deferred) | L (~1 week) | PoC infrastructure, composite 4-metric scoring, stagnation detection, "change direction" pivot, agent specialization per iteration |
| Full original scope | XL (2-3 weeks) | Everything above + new orchestrator agent + auto-by-default + web search directives |

### Acceptance Criteria (Phase 1)

- AC1: `/rpi:research feature --auto` runs up to N iterations, improving RESEARCH.md each time.
- AC2: Without `--auto`, output is identical to current single-pass behavior (no metadata sections, no loop).
- AC3: doc-synthesizer appends "Gap Analysis" section listing uncovered areas, missing evidence, and open questions.
- AC4: Keep-best: if iteration N's RESEARCH.md has more gaps than iteration N-1, keep N-1's version.
- AC5: Git commit after each iteration preserves full history.
- AC6: AskUserQuestion between iterations shows progress summary with "Continue" / "Stop" options.
- AC7: Tier-aware defaults: quick=no auto, standard=max 2, deep=max 5.
- AC8: `auto_research_max_iterations` configurable in `.rpi.yaml`.
- AC9: `--max-iterations N` CLI flag overrides config and tier defaults.

### Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| AI self-evaluation unreliable | HIGH | Checklist-based facts, not subjective scoring. Phase 1 validates before Phase 2. |
| Cost surprise (2-5x tokens) | HIGH | Opt-in only. Tier-aware defaults. Iterations target gaps, not full re-research. |
| Auto by default alienates users | HIGH | Resolved: opt-in via `--auto` flag. |
| Keep-best logic breaks silently | MEDIUM | Git commit safety net. Checklist count is verifiable. |
| Prompt complexity explosion | MEDIUM | No new agent. Extends existing files only. |
| Research command becomes hardest to maintain | LOW-MEDIUM | Loop adds ~30 lines of prompt logic to research.md. Manageable. |

## Codebase Context

### Current Research Pipeline

The research command (`commands/rpi/research.md`) follows a 7-step linear pipeline: load config, resolve model, resolve path, determine agents by tier, fan-out all agents in parallel, doc-synthesizer merges, write RESEARCH.md, present verdict.

There is no iteration, no scoring, no gap analysis, no PoC infrastructure, and no commit-between-iterations.

### Files That Need Modification (Phase 1)

| File | Change | Scope |
|------|--------|-------|
| `commands/rpi/research.md` | Add `--auto`, `--max-iterations`, iteration loop wrapping steps 4-7, git commit per iteration, AskUserQuestion between iterations | Heavy |
| `agents/doc-synthesizer.md` | Add gap analysis output section, checklist evaluation | Moderate |
| `skills/rpi-workflow/SKILL.md` | Document auto-research config keys, update Phase 2 description | Light |
| `skills/rpi-agents/SKILL.md` | Update doc-synthesizer responsibility description | Light |

No new files are created in Phase 1.

### Existing Patterns to Reuse

- **Iterative execution with checkpoints**: `implement.md` already has session checkpoints, resume logic, deviation handling. The loop pattern is proven in the codebase.
- **AskUserQuestion for user intervention**: used across all 13 commands consistently.
- **Git commit per unit of work**: `implement.md` commits per task. Research iterations follow the same pattern.
- **Verdict aggregation**: doc-synthesizer already uses BLOCK/CONCERN/GO logic.
- **Config key pattern**: `.rpi.yaml` supports flat + nested keys. Adding `auto_research_max_iterations` follows established convention.

### Impact Analysis

- `/rpi:plan` reads RESEARCH.md and parses by section heading. New metadata sections are additive. **Low risk.**
- `/rpi:status` could optionally show iteration count. **Enhancement, not blocking.**
- `/rpi:implement` has no direct dependency on research metadata. **No impact.**
- doc-synthesizer runs once per iteration in auto mode, once total in single-pass. No architectural change needed.
- Absence of `--auto` produces EXACTLY current output with EXACTLY current behavior. **Zero regression risk.**

## Technical Analysis

### Architecture Decision: No New Orchestrator Agent

This was the most significant disagreement across agents. Three agents (Requirement Parser, Codebase Explorer, UX Designer) assumed a new `research-orchestrator` agent file. The Senior Engineer argued against it.

**Decision: Extend doc-synthesizer. Do not create research-orchestrator.**

Rationale:
1. The command prompt (`research.md`) already IS the orchestrator -- it decides which agents to spawn, in what order, with what prompts. Adding a separate orchestrator agent creates an "agent-spawning-agent" pattern that does not exist anywhere in the codebase.
2. A research-orchestrator would need Agent, Read, Write, Bash tools -- the same tool set as a command, not an agent. This blurs the command/agent boundary.
3. doc-synthesizer already reads all agent outputs and produces the verdict. Adding gap analysis is a natural extension of its existing responsibility.
4. Eliminating the new agent removes: 1 new file, EXPECTED_AGENTS test update, AGENTS.md update, rpi-agents SKILL.md agent table update. This is the single change that reduces complexity from XL to L.

The loop works as follows:
1. research.md runs agents in parallel (existing step 4)
2. research.md runs doc-synthesizer (existing step 5), which now also outputs a gap analysis section
3. research.md reads gap analysis, decides whether to loop
4. If looping: re-spawn only the agents relevant to identified gaps, with focused prompts
5. doc-synthesizer runs again with new + previous outputs, performs keep-best comparison

### Default Behavior Decision: Opt-In via --auto

The REQUEST.md specified auto-research as the default, with `--no-auto` to preserve current behavior. Three agents disagreed.

**Decision: Opt-in via `--auto` flag. Tier-aware max iterations apply when `--auto` is used.**

Rationale: With a small user base and zero validation data on AI self-evaluation quality, defaulting to auto risks alienating existing users with unexpected cost increases and behavioral changes. Making it opt-in lets early adopters validate the feature. If Phase 1 proves reliable, Phase 2 can flip the default.

### Scoring Decision: Checklist-Based, Not Composite 4-Metric

**Decision: Checklist-based scoring for Phase 1. Composite scoring deferred to Phase 2.**

Rationale: AI self-scoring on subjective dimensions (confidence, coverage) is unreliable. Checklist-based evaluation counts verifiable facts: Did the research cite specific files? Did it identify dependencies? Did it propose alternatives for NO-GO? Did it address all constraints from REQUEST.md? This is deterministic enough for keep-best comparison.

### Max Iterations Decision: Tier-Aware Defaults

| Tier | Default Max Iterations | Rationale |
|------|----------------------|-----------|
| `--quick` | 0 (no auto, even with `--auto`) | Quick is for fast feasibility checks |
| `--standard` | 2 | Enough for one gap-fill pass |
| `--deep` | 5 | Deep analysis benefits most from iteration |

`--max-iterations N` overrides these defaults regardless of tier.

### Implementation Approach (Critical Path)

1. **Extend doc-synthesizer.md** -- Add gap analysis output section: list of uncovered areas, missing evidence, open questions, checklist score.
2. **Extend research.md** -- Add `--auto` and `--max-iterations` flag parsing. Wrap steps 4-7 in a conditional loop. After step 5, read gap analysis. If gaps remain and iterations < max: construct focused prompts for relevant agents, re-run steps 4-5.
3. **Add inter-iteration UX** -- AskUserQuestion between iterations with progress summary card.
4. **Add git commit per iteration** -- After each RESEARCH.md write.
5. **Add keep-best logic** -- Compare gap count between iterations. If new iteration has more unresolved gaps, revert to previous via git.
6. **Update RESEARCH.md schema** -- Add optional "Research Metadata" and "Iteration Log" sections (present only when `--auto` was used).
7. **Update skill docs and config** -- Document `auto_research_max_iterations` config key and new flags.

### Technical Decisions Summary

| Decision | Chosen | Alternative | Why |
|----------|--------|-------------|-----|
| Loop controller | Command prompt (research.md) | New orchestrator agent | Command IS the orchestrator; avoids novel pattern |
| Gap analysis | Extend doc-synthesizer | New agent | Already reads all outputs; natural extension |
| Scoring | Checklist-based (countable facts) | Composite 4-metric | AI self-scoring is unreliable; validate simple first |
| Max iterations | 3 default, tier-aware | 5 flat | Context window pressure at iteration 4-5 |
| Default behavior | Opt-in (`--auto`) | Auto by default | Protects existing users; validates before defaulting |
| New agent file | No | Yes (research-orchestrator) | Reduces scope, avoids test churn, no novel patterns |

### Edge Cases and Failure Modes

- **Context window exhaustion at iteration 4-5**: Spawn only 1-2 targeted agents per iteration after the first full pass.
- **Agent failure mid-iteration**: Keep-best prevents regression. Git commit provides rollback.
- **Scoring gaming**: Checklist items are tied to verifiable facts, not subjective ratings.
- **Infinite loop**: Hard cap via max_iterations. Tier-aware defaults keep it conservative.
- **"Stop" after iteration 1**: Must produce valid single-pass RESEARCH.md with no auto-mode metadata sections.

## Strategic Assessment

### Timing Concern

The CTO Advisor raised a valid timing concern: B1 (critical npm `files` field bug) is unresolved, agent-model-profiles just landed and needs stabilization, and the core workflow has not been validated at scale.

**Resolution**: The phased approach addresses this directly. Phase 1 is scoped to L complexity, extends existing files only, creates no new agents, and is gated behind an opt-in flag. The gap detection capability in doc-synthesizer (the true core value) is an S/M change on its own.

**Prerequisite**: B1 should be fixed before this ships.

### CTO's Staged Alternative

The CTO recommended shipping gap detection alone first, then the loop in a later release.

**Resolution**: Ship both gap detection and the loop as Phase 1, but gate the loop behind `--auto`. This means:
- Without `--auto`: doc-synthesizer's gap analysis appears in RESEARCH.md as a new "Gaps and Open Questions" section. Users see what was missed. They can manually re-run.
- With `--auto`: the loop runs automatically. Additional value at marginal implementation cost since the loop logic reuses existing patterns.

### Reversibility

High. Phase 1 changes are:
- A flag (`--auto`) that is off by default
- An additional output section in doc-synthesizer (gap analysis) -- informational even without the loop
- Loop logic in research.md gated behind the flag
- One new config key in `.rpi.yaml`

Removing the feature = remove the flag and the loop. Gap analysis in doc-synthesizer is valuable regardless.

## UX Analysis

### Inter-Iteration Summary Card

Recommended format for AskUserQuestion between iterations:

```
--- Research Iteration 2/3 ---
Progress: 75% (was 50%)

Improved:
  + Identified 3 viable auth libraries with benchmarks
  + Confirmed JWT refresh pattern compatibility

Remaining gaps:
  - Rate limiting strategy untested
  - No data on concurrent session handling

Options:
  1. Continue (focus: rate limiting, concurrency)
  2. Stop and deliver current research
```

Phase 1 omits "Change direction" (option 3). Deferred to Phase 2.

### Tier-Aware Defaults

| Tier | Default Max Iterations | Rationale |
|------|----------------------|-----------|
| `--quick` | 0 (no auto) | Quick is for fast feasibility checks |
| `--standard` | 2 | One gap-fill pass covers the common case |
| `--deep` | 5 | Deep analysis benefits most from iteration |

### Default Behavior

Auto-research is opt-in via `--auto` flag. Resolves the disagreement between REQUEST.md (auto by default), PM (opt-in), CTO (premature), and UX (tier-aware). Opt-in protects existing users, tier-aware defaults apply when opted in, path to default is clear once validated.

## Concerns

### Concern 1: AI Self-Evaluation Reliability
**Severity**: HIGH
The entire auto-research loop depends on the AI accurately identifying its own blind spots. If gap detection produces false negatives or false positives, iterations are wasted or misleading.
**Mitigation**: Phase 1 uses checklist-based evaluation tied to verifiable facts from REQUEST.md. Phase 1 serves as validation -- if gap detection proves unreliable, Phase 2 is not built.

### Concern 2: Cost Surprise
**Severity**: HIGH
Each iteration spawns multiple agents. 3 iterations of deep research = up to 18 agent calls + 3 doc-synthesizer calls = 21 total (vs 7 for single-pass).
**Mitigation**: Opt-in only. Tier-aware defaults cap iterations. Iterations 2+ spawn only targeted agents (1-2 per gap). Progress summary lets users stop early.

### Concern 3: Prompt Complexity in research.md
**Severity**: MEDIUM
research.md is already one of the more complex commands. Adding loop logic increases maintainer cognitive load.
**Mitigation**: Loop is a thin wrapper (~30 lines) around existing steps 4-7. No new agent. implement.md precedent shows far more complex iteration logic works.

### Concern 4: B1 Critical Bug Still Open
**Severity**: MEDIUM
The npm `files` field bug means the package is broken. Shipping new features on a broken package is counterproductive.
**Mitigation**: Fix B1 before shipping this feature.

## Contradictions Resolved

| Conflict | Agents | Resolution |
|----------|--------|------------|
| New orchestrator agent vs extend doc-synthesizer | Req Parser/Explorer/UX vs Senior Engineer | **Extend doc-synthesizer.** No new agent. Reduces XL to L. |
| Auto by default vs opt-in vs tier-aware | REQUEST.md vs PM/CTO vs UX | **Opt-in via `--auto` with tier-aware max iterations.** |
| XL complexity vs L complexity | 5 agents say XL vs Senior Engineer says L | **L for Phase 1** (no new agent, extends existing files). |
| Build now vs defer | REQUEST.md vs CTO | **Build Phase 1 now** (L scope, opt-in). Defer Phase 2. |
| 5 max iterations vs 3 | REQUEST.md vs Senior Engineer | **Tier-aware: quick=0, standard=2, deep=5, default=3.** |
| Composite scoring vs checklist facts | REQUEST.md vs Senior Engineer | **Checklist-based for Phase 1.** Validate before adding complexity. |
