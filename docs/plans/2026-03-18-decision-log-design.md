# Decision Log — Automatic Decision Tracking in RPI Workflow

**Date:** 2026-03-18
**Status:** Approved
**Approach:** Decision Tags in agents (Approach A)

## Problem

Decisions in the RPI workflow are scattered across multiple artifacts (INTERVIEW.md, RESEARCH.md, eng.md, pm.md, ACTIVITY.md). ACTIVITY.md is action-oriented ("Atlas analyzed N files") rather than decision-oriented ("Chose approach X over Y because Z"). There's no single place to answer "why was this feature built this way?"

## Solution Overview

1. **Decision Tags** — Each agent emits `<decision>` tags inline when making choices with rationale
2. **ACTIVITY.md enrichment** — "Key decisions" field populated from `<decision>` tags
3. **DECISIONS.md** — Consolidated decision log per feature, updated incrementally after each phase
4. **`/rpi:status` integration** — "Key Decisions" section showing last 5 decisions with counts

## Decision Tag Format

Agents emit `<decision>` tags inline in their output:

```
<decision>
type: {approach|scope|architecture|verdict|deviation|tradeoff|pattern}
summary: {one line — what was decided}
alternatives: {what was rejected, or "none"}
rationale: {why this choice}
impact: {HIGH|MEDIUM|LOW}
</decision>
```

### Type definitions

| Type | When to use |
|------|-------------|
| `approach` | Choosing a technical approach or library |
| `scope` | Including/excluding functionality |
| `architecture` | Structural design choices |
| `verdict` | GO/NO-GO, PASS/FAIL decisions |
| `deviation` | Accepting or rejecting implementation deviations |
| `tradeoff` | Explicit trade-off analysis |
| `pattern` | Choosing to follow or break an existing pattern |

### Impact levels

- **HIGH** — Changes project direction (verdicts, major architecture choices)
- **MEDIUM** — Shapes implementation (scope cuts, pattern choices)
- **LOW** — Minor preference (naming, minor implementation detail)

### Guidelines for agents

- Emit a tag for every choice where alternatives were considered or where the "why" matters
- Don't tag obvious/mechanical actions (reading a file, running a command)
- Multiple tags per output are fine — one per distinct decision

## Agent Changes

All 13 agents receive a `<decision_logging>` section in their system prompt, placed between `<output_format>` and `<quality_gate>`:

```markdown
<decision_logging>
When you make a choice with rationale — choosing one approach over others, scoping
in/out, accepting/rejecting, or recommending with trade-offs — emit a <decision> tag
inline in your output:

<decision>
type: {approach|scope|architecture|verdict|deviation|tradeoff|pattern}
summary: {one line — what was decided}
alternatives: {what was rejected, or "none" if no alternatives considered}
rationale: {why this choice}
impact: {HIGH|MEDIUM|LOW}
</decision>

Guidelines:
- Emit a tag for every choice where you considered alternatives or where the "why" matters
- Don't tag obvious/mechanical actions (reading a file, running a command)
- HIGH = changes project direction; MEDIUM = shapes implementation; LOW = minor preference
- Multiple tags per output are fine — one per distinct decision
</decision_logging>
```

The instruction is generic (identical for all agents). Each agent naturally adapts based on their role and the types of decisions they make.

### Expected decision types by agent

| Agent | Primary decision types |
|-------|----------------------|
| Atlas | `pattern`, `architecture` |
| Scout | `approach`, `tradeoff` |
| Nexus | `verdict`, `tradeoff`, `scope` |
| Mestre | `architecture`, `approach` |
| Clara | `scope`, `tradeoff` |
| Pixel | `approach`, `pattern` |
| Forge | `deviation`, `approach` |
| Sage | `approach`, `pattern` |
| Hawk | `tradeoff`, `pattern` |
| Shield | `tradeoff`, `pattern` |
| Razor | `approach`, `pattern` |
| Quill | `scope` |
| Luna | `scope`, `approach` |

## ACTIVITY.md Changes

The existing "Key decisions" field in ACTIVITY.md entries becomes populated from `<decision>` tags:

```markdown
### 2026-03-18 — Atlas (Research)
- **Action:** Codebase analysis for {slug}
- **Scope:** {files analyzed}
- **Key decisions:** Follow repository pattern (8/10 modules use it, over service layer); Flag migration risk as HIGH
- **Quality:** PASS (5/5 criteria met)
```

## DECISIONS.md Format

Located at `rpi/features/{slug}/DECISIONS.md`, updated incrementally after each phase.

```markdown
# Decision Log — {feature slug}

## Research Phase
_Generated: 2026-03-18_

| # | Type | Decision | Alternatives | Rationale | Impact |
|---|------|----------|-------------|-----------|--------|
| 1 | pattern | Follow repository pattern | Service layer, direct DB | 8/10 data modules use repos | MEDIUM |
| 2 | verdict | GO with concerns | NO-GO considered | Patterns compatible, migration unresolved | HIGH |

## Plan Phase
_Generated: 2026-03-18_

| # | Type | Decision | Alternatives | Rationale | Impact |
|---|------|----------|-------------|-----------|--------|
| 3 | scope | Bulk import out-of-scope | Basic CSV import | +3 tasks, +2 days, not MVP | MEDIUM |
| 4 | architecture | Event-driven via EventEmitter | Polling, WebSocket | Matches notifications module pattern | HIGH |
```

Decisions are numbered sequentially across all phases for easy cross-referencing ("see decision #4").

## Consolidation Mechanism

At the end of each phase, the **last agent** in that phase's pipeline extracts all `<decision>` tags from the phase's ACTIVITY.md entries and appends a new section to DECISIONS.md:

| Phase | Consolidating agent |
|-------|-------------------|
| Research | Nexus (synthesis step) |
| Plan | Nexus (adversarial review step) |
| Implement | Forge (last task) |
| Review | Nexus (synthesis step) |
| Simplify | Razor |
| Docs | Quill |

The consolidation step is added to each phase command as a final step.

## `/rpi:status` Integration

Add a "Key Decisions" section to the status output:

```markdown
### Key Decisions (last 5)
| # | Phase | Decision | Impact |
|---|-------|----------|--------|
| 7 | Plan | Event-driven updates via EventEmitter | HIGH |
| 6 | Plan | Bulk import out-of-scope | MEDIUM |
| 5 | Plan | Use Zod for validation | LOW |
| 4 | Research | GO with concerns | HIGH |
| 3 | Research | Follow repository pattern | MEDIUM |

Total: 7 decisions (2 HIGH, 3 MEDIUM, 2 LOW)
Full log: rpi/features/{slug}/DECISIONS.md
```

## Files to Modify

1. **13 agent files** (`agents/*.md`) — Add `<decision_logging>` section
2. **6 phase commands** (`commands/rpi/{research,plan,implement,review,simplify,docs}.md`) — Add consolidation step + enrich ACTIVITY.md template
3. **1 status command** (`commands/rpi/status.md`) — Add "Key Decisions" section

## What This Does NOT Change

- Quality gate format (unchanged)
- ACTIVITY.md structure (enriched, not restructured)
- Agent output format (tags are inline additions)
- Workflow order or phases
