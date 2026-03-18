# Design: /rpi:evolve — Product Evolution Command

## Summary

New standalone utility command that analyzes an entire project from 5 perspectives (technical health, test coverage, code quality, ecosystem, product gaps) using 5 existing agents in parallel, then synthesizes findings into a prioritized evolution report with actionable opportunities.

## Architecture

```
/rpi:evolve [--quick]
    |
Step 1: Load config (.rpi.yaml) + read rpi/context.md
    |
Step 2: Launch 5 analysis agents in parallel
    |    ├── Atlas: codebase health (debt, deps, patterns, architecture)
    |    ├── Sage:  test coverage (gaps, quality, missing types)
    |    ├── Hawk:  code quality (anti-patterns, risks, smells)
    |    ├── Scout: ecosystem (outdated deps, security, trends)
    |    └── Clara: product gaps (features, UX friction, incomplete flows)
    |
Step 3: Nexus synthesizes all findings → structured report
    |
Step 4: Generate opportunities list (potential /rpi:new candidates)
    |
Step 5: Write report + opportunities + show terminal summary
```

No new agents. Reuses Atlas, Sage, Hawk, Scout, Clara, Nexus with evolution-specific prompts.

`--quick` flag: Runs only Atlas + Nexus for a fast technical health check.

## Positioning

- Standalone utility command (like /rpi:docs-gen, /rpi:init)
- Does NOT participate in the 7-phase pipeline
- Operates at **product scope** (not feature scope)
- Ad-hoc usage — run when you need direction, not on every session
- No overlap with existing commands:
  - /rpi:status = feature progress dashboard
  - /rpi:party = open-ended debate
  - /rpi:evolve = structured product analysis with recommendations

## Agent Responsibilities

| Agent | Focus | Output |
|-------|-------|--------|
| Atlas | Codebase structure, technical debt, dependency health, architecture gaps | Strengths, Debt, Dependencies, Architecture Issues |
| Sage | Test coverage map, untested paths, test quality, missing test types | Coverage %, Gaps, Recommendations |
| Hawk | Anti-patterns, code smells, complexity hotspots, risks | Problems (by severity), Quick Wins, Risks |
| Scout | Outdated deps, security advisories, ecosystem trends, better alternatives | Outdated Deps, CVEs, Emerging Patterns |
| Clara | Feature completeness, user journey gaps, UX friction, missing docs | Completeness Score, Missing Features, UX Issues |
| Nexus | Synthesize, resolve contradictions, prioritize, score, generate opportunities | Executive Summary, Health Score, Prioritized List |

## Outputs (3)

### A) Terminal Summary (immediate)

```
Evolution Report: {Project Name} ({date})

Health Score: {N}/10

Top 3 Opportunities:
1. [{category}] {description} ({agent})
2. [{category}] {description} ({agent})
3. [{category}] {description} ({agent})

Full report: rpi/evolution/{date}-report.md
Opportunities: rpi/evolution/{date}-opportunities.md
```

### B) Report (rpi/evolution/{date}-report.md)

```markdown
# Evolution Report — {Project Name}

## Executive Summary
Health: {score}/10 | Opportunities: {N} | Critical: {N}

## Technical Health (Atlas)
### Strengths | ### Debt | ### Dependencies

## Test Coverage (Sage)
### Coverage Map | ### Gaps | ### Recommendations

## Code Quality (Hawk)
### Anti-patterns | ### Risks | ### Quick Wins

## Ecosystem (Scout)
### Outdated Dependencies | ### Security | ### Alternatives

## Product Analysis (Clara)
### Feature Completeness | ### UX Friction | ### Missing Flows

## Prioritized Recommendations
1. {recommendation with effort estimate}
```

### C) Opportunities (rpi/evolution/{date}-opportunities.md)

```markdown
# Evolution Opportunities

## Ready for /rpi:new
- [ ] **{slug}** — {S|M|L|XL} | {description}

## Needs More Research
- [ ] **{slug}** — {S|M|L|XL} | {description}
```

Each opportunity has a slug, complexity estimate, and description — ready for `/rpi:new {slug}`.

## Health Score

Nexus calculates a heuristic 1-10 score based on all agent findings. Not a precise metric — a quick-read indicator of overall project health. Breakdown by area is included in the report body but the terminal summary shows only the aggregate.

## Edge Cases

| Scenario | Handling |
|----------|----------|
| No rpi/context.md | Atlas analyzes from scratch (same as /rpi:init) |
| Very large project | Atlas samples 5-10 representative files |
| No tests | Sage reports "No test framework detected" + recommends adding |
| No dependencies | Scout reports "No package manifest found" + skips dep analysis |
| Previous report exists | Nexus compares with previous and highlights changes |
| --quick flag | Only Atlas + Nexus (skip Scout, Hawk, Clara, Sage) |

## Files Affected

### New
- `commands/rpi/evolve.md` — the command

### Modified
- `.claude-plugin/marketplace.json` — add to commands array
- `test/commands.test.js` — add to EXPECTED_COMMANDS
- `skills/rpi-workflow/SKILL.md` — add to utility commands table

### Not Modified
- No agent files — all agents used as-is with custom prompts
- No new skills — command-only in v1

## Complexity Estimate

M — 1 new command file, 3 registration edits. The command is pure agent orchestration (no business logic). Prompts are the main work.

## Decisions

| Decision | Chosen | Why |
|----------|--------|-----|
| New command vs extend /rpi:party | New /rpi:evolve | Party is for debates, evolve is structured analysis |
| New agents vs reuse existing | Reuse 5 existing + Nexus | All needed perspectives already have agents |
| Report location | rpi/evolution/{date}-.md | Separate from features/, specs/, solutions/ |
| Health score | Heuristic 1-10 by Nexus | Quick read, not scientific — useful for trend tracking |
| --quick flag | Atlas + Nexus only | Fast health check without full analysis |
| Opportunities format | Slug + complexity + description | Ready for /rpi:new pipeline |
