# Quality Gates + Observability — Design Document

**Date:** 2026-03-18
**Status:** Approved
**Author:** Daniel Mendes + Claude

## Problem

Two core frustrations with RPIKit:

1. **Inconsistent results** — Agent output quality varies unpredictably. Sometimes excellent, sometimes generic or shallow. No way to diagnose why.
2. **Lack of visibility** — No record of what agents did, no session context on return, no quality signals to guide re-runs.

These are linked: without observability, you can't identify what's inconsistent, and without quality gates, observability just shows you problems you can't fix.

## Solution

Two complementary systems, implemented together:

### A. Quality Gates

Each agent gets a `## Quality Gate` section in its prompt with minimum quality criteria. Before delivering output, the agent self-validates against these criteria and reports a score.

**Scoring:**
- **PASS** — All criteria met. Output delivered as-is.
- **WEAK** — Most criteria met, but gaps exist. Output delivered with warning.
- **FAIL** — Critical criteria not met. Agent retries once before delivering with FAIL warning.

**Quality criteria per agent:**

| Agent | Phase | Criteria |
|-------|-------|----------|
| Luna | Request | Asked ≥3 clarifying questions; captured acceptance criteria; REQUEST.md has all sections |
| Atlas | Research | Analyzed ≥5 relevant files; identified patterns (not just listed files); found project conventions |
| Scout | Research | Found ≥2 external sources; compared alternatives; recommendations are project-specific |
| Nexus | Synthesis | Covers all agent outputs; contradictions addressed; clear recommendation present |
| Mestre | Plan | Every task has acceptance criteria; no task estimated >30 min; edge cases considered |
| Clara | Plan | Cut ≥1 nice-to-have; scope is minimal viable |
| Pixel | Plan | UX impact considered; user flow documented; accessibility noted |
| Forge | Implement | Code follows project conventions; tests pass; commits are atomic |
| Hawk | Review | Found ≥1 real issue (not cosmetic); findings reference specific lines |
| Shield | Review | Checked OWASP top 5 relevant items; findings are specific (not generic) |
| Sage | Review | Verified edge cases; test coverage adequate for changes |
| Razor | Simplify | Measured improvement (lines removed, complexity reduced); no behavior change |
| Quill | Docs | Documentation accurate vs code; explains WHY not WHAT |

### B. Observability — Activity Log

Each agent appends an entry to `ACTIVITY.md` in the feature directory after completing its work.

**Log format:**

```markdown
## Activity Log

### YYYY-MM-DD HH:MM — AgentName (Phase)
- **Action:** What the agent did
- **Scope:** Files/areas analyzed or modified
- **Key decisions:** Why certain choices were made
- **Quality:** PASS|WEAK|FAIL (N/N criteria met)
- **Duration:** Approximate time
```

**Writer:** Each agent, via prompt instructions to append to `{feature_dir}/ACTIVITY.md`.

**Readers:**
- `/rpi:status` — reads all feature ACTIVITY.md files for summary view
- Nexus — reads ACTIVITY.md when synthesizing or when resuming interrupted work
- Developer — manual inspection

### C. Enhanced `/rpi:status`

Three new output blocks added to `/rpi:status`:

**1. Session resume context** — Per active feature: current phase, last activity, next suggested step, quality scores per completed phase.

**2. Quality alerts** — Features with WEAK or FAIL scores, with actionable suggestions (e.g., "Re-run /rpi:research" or "Add more context to REQUEST.md").

**3. Recent activity summary** — Last 7 days of activity across all features, with quality overview.

## Files Changed

| File | Change |
|------|--------|
| `agents/*.md` (13 files) | Add `## Quality Gate` section with criteria + ACTIVITY.md logging instructions |
| `commands/rpi/status.md` | Read ACTIVITY.md from active features; display resume, alerts, history |
| `commands/rpi/research.md` | Instruct Atlas/Scout to log to ACTIVITY.md |
| `commands/rpi/plan.md` | Instruct Mestre/Clara/Nexus to log to ACTIVITY.md |
| `commands/rpi/implement.md` | Instruct Forge to log per-task progress to ACTIVITY.md |
| `commands/rpi/review.md` | Instruct Hawk/Shield/Sage to log to ACTIVITY.md |
| `commands/rpi/simplify.md` | Instruct Razor to log simplification metrics |
| `commands/rpi/docs.md` | Instruct Quill to log documentation actions |

**New files:** None. All changes in existing files.

## Test Impact

- Add assertion: every `agents/*.md` file contains `## Quality Gate` section
- Optional: validate ACTIVITY.md format in integration tests

## Rollout Strategy

1. **Phase 1:** Quality gates in all 13 agent prompts
2. **Phase 2:** ACTIVITY.md logging instructions in agents + commands
3. **Phase 3:** Enhanced `/rpi:status` that reads the logs

Each phase is independently useful — quality gates improve output even without logging; logging is useful even before status is enhanced.

## Non-Goals

- No UI dashboard (terminal output is sufficient)
- No token usage tracking (out of scope)
- No historical analytics across projects (per-project only)
- No automated quality threshold configuration (hardcoded criteria first, configurable later if needed)
