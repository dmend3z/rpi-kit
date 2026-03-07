# RPI Workflow Rules

You follow the RPI (Research → Plan → Implement) workflow for feature development.

## Core Principles

1. **Never implement without research.** Every feature starts with a REQUEST.md and goes through a GO/NO-GO research gate.
2. **Never code without a plan.** The plan phase produces structured artifacts (PLAN.md, eng.md, and optionally pm.md/ux.md) before any code is written.
3. **Track every task.** Implementation uses task-level tracking with commits per task and phase checkpoints.
4. **Simplify before review.** After implementation, run code simplification (reuse, quality, efficiency) before code review.
5. **Review against the plan.** Code review checks implementation against plan requirements, not just code quality.

## File Conventions

```
{folder}/{feature-slug}/
├── REQUEST.md              # Feature description (structured sections)
├── research/
│   └── RESEARCH.md         # GO/NO-GO analysis with agent perspectives
├── plan/
│   ├── PLAN.md             # Task checklist with effort, deps, files
│   ├── pm.md               # (adaptive) User stories + acceptance criteria
│   ├── ux.md               # (adaptive) User flows + interaction patterns
│   └── eng.md              # Technical architecture + dependencies
└── implement/
    └── IMPLEMENT.md        # Full audit trail: tasks, commits, deviations
```

## Workflow Commands

- `/rpi:init` — Set up RPI config for this project
- `/rpi:new` — Interactive interview to create a feature REQUEST.md
- `/rpi:research <feature>` — Research phase with GO/NO-GO verdict
- `/rpi:plan <feature>` — Generate plan artifacts from research
- `/rpi:implement <feature>` — Execute plan with task tracking
- `/rpi:simplify <feature>` — Code simplification (reuse, quality, efficiency)
- `/rpi:status` — Show all features and their current phase
- `/rpi:review <feature>` — Code review against plan

## Research Tiers

- `--quick` — Feasibility check only (2 agents: requirements + codebase)
- `--standard` — Scope + technical approach (4 agents: + PM + engineer)
- `--deep` — Full analysis with strategic assessment (5-6 agents: + CTO + UX if UI)

## Agent Team

| Role | Perspective |
|------|-------------|
| Requirement Parser | Extracts structured requirements, lists unknowns |
| Product Manager | Scope, user stories, effort, acceptance criteria |
| UX Designer | User flows, interaction patterns, existing components |
| Senior Engineer | Technical approach, architecture, dependencies |
| CTO Advisor | Risk, feasibility, strategic alignment, alternatives |
| Doc Synthesizer | Merges research into executive summary + verdict |
| Plan Executor | Implements tasks surgically, one at a time |
| Code Simplifier | Reuse, quality, efficiency checks with fixes |
| Code Reviewer | Reviews against plan requirements |
| Codebase Explorer | Scans existing code for patterns and context |

## GO/NO-GO Verdicts

- **GO** — Feature is feasible, proceed to planning
- **GO with concerns** — Feasible but has risks that need mitigation
- **NO-GO** — Not feasible as described; alternatives suggested
- Override a NO-GO verdict: `/rpi:plan {feature-slug} --force`
