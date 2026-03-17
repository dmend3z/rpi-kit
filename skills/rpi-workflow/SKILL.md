---
name: rpi-workflow
description: This skill should be used when the user wants to develop a feature systematically, asks "how do I start a new feature", "walk me through the workflow", or mentions any RPI command.
---

# RPIKit Workflow

## Overview

RPIKit v2 is a 7-phase pipeline for AI-assisted feature development:
request -> research -> plan -> implement -> simplify -> review -> docs

Each phase produces artifacts that feed the next, with named agents driving each step.

## Quick Start

1. `/rpi:init` -- configure RPIKit for your project
2. `/rpi:new my-feature` -- start a feature (Luna interviews you)
3. `/rpi my-feature` -- auto-progress through phases

## Phases

| Phase | Command | Agents | Artifacts |
|-------|---------|--------|-----------|
| Request | /rpi:new | Luna | REQUEST.md |
| Research | /rpi:research | Atlas, Scout, Nexus | RESEARCH.md |
| Plan | /rpi:plan | Mestre, Clara, Pixel, Nexus | PLAN.md, eng.md, pm.md, ux.md, delta/ |
| Implement | /rpi:implement | Forge, Sage | IMPLEMENT.md |
| Simplify | /rpi:simplify | Razor | code changes |
| Review | /rpi:review | Hawk, Shield, Sage, Nexus | review verdict |
| Docs | /rpi:docs | Quill | README, changelog |

## Auto-Flow

`/rpi {feature}` detects the current phase and runs the next one automatically:

```
/rpi oauth  ->  has REQUEST.md?   ->  Phase 2: Research
/rpi oauth  ->  has RESEARCH.md?  ->  Phase 3: Plan
/rpi oauth  ->  has PLAN.md?      ->  Phase 4: Implement
/rpi oauth  ->  has IMPLEMENT.md? ->  Phase 5: Simplify
/rpi oauth  ->  simplify done?    ->  Phase 6: Review
/rpi oauth  ->  review PASS?      ->  Phase 7: Docs
```

If the feature does not exist: `Feature 'oauth' not found. Run /rpi:new oauth to start.`

## Escape Hatches

Run a specific phase directly:

```
/rpi:research oauth   -- force (re)run research
/rpi:plan oauth       -- force (re)generate plan
/rpi:implement oauth  -- force (re)implement
/rpi:simplify oauth   -- force simplify
/rpi:review oauth     -- force review
/rpi:docs oauth       -- force docs
```

## Global Flags

```
--quick          -- quick flow (skip research + full plan)
--skip=phase     -- skip specific phase(s)
--force          -- re-run phase even if artifacts exist
--from=phase     -- start from a specific phase
```

## Quick Flow

`/rpi:new my-feature --quick` triggers a streamlined pipeline for small (S) features:

1. Luna asks 1-2 quick questions, produces compact REQUEST.md
2. Skip research + full plan
3. Forge receives REQUEST.md + context.md directly
4. Forge generates mini-plan inline (3-5 tasks max)
5. Implements task by task
6. Razor does quick simplify
7. Skip formal review (lint/tests only)
8. Quill updates docs if needed

**Auto-trigger:** Luna estimates complexity S and suggests quick flow.
**Safeguard:** If Forge detects complexity > S during implement, it stops and suggests running full research + plan.

## Delta Specs

Delta specs capture only what changes, not the full system state.

- `rpi/specs/` -- source of truth for current system state
- `rpi/features/{slug}/delta/` -- what changes for this feature
  - `ADDED/` -- new spec files
  - `MODIFIED/` -- changes to existing specs
  - `REMOVED/` -- specs being deleted
- `/rpi:archive` merges delta into specs and cleans up the feature folder

Flow: research creates baseline from existing specs, plan creates delta, archive merges delta back into specs.

## Knowledge Compounding

RPIKit builds a persistent knowledge base that grows with every feature.

- `rpi/solutions/` -- organized by category (performance/, security/, database/, testing/, architecture/, patterns/, decisions/)
- **Auto-saved:** during review, when Hawk/Shield find problems and the dev fixes them
- **Manual:** `/rpi:learn` -- Nexus asks what you learned and generates a solution doc
- **Reuse:** Scout checks solutions/ before external research and includes relevant solutions in RESEARCH.md

Solution format:

```markdown
# {Title}

## Problem
{symptoms, how it manifests}

## Solution
{code, approach, what worked}

## Prevention
{how to avoid in the future}

## Context
Feature: {slug} | Date: {YYYY-MM-DD}
Files: {list}
```

## Party Mode

`/rpi:party "topic"` -- multi-agent debate on any topic.

```
/rpi:party "GraphQL vs REST for the API?"
/rpi:party oauth "how to handle token refresh?"
```

1. Nexus analyzes the topic and selects 3-5 relevant agents
2. Each agent responds in character with their perspective
3. Nexus identifies consensus and divergence points
4. If divergence: Nexus asks each agent to respond to the opposing argument
5. Nexus synthesizes final recommendation with trade-offs

Output is saved to `rpi/solutions/decisions/` when requested.

## Utility Commands

```
/rpi:init       -- configure RPIKit + generate context.md
/rpi:status     -- view all features and their current phase
/rpi:party      -- multi-agent debate on any topic
/rpi:learn      -- manually capture a solution/insight
/rpi:archive    -- merge delta into specs, delete feature folder
/rpi:onboarding -- first-time setup, analyzes codebase, guides the user
```

## Configuration

`.rpi.yaml` reference:

```yaml
version: 2

# Directories
folder: rpi/features
specs_dir: rpi/specs
solutions_dir: rpi/solutions
context_file: rpi/context.md

# Execution
commit_style: conventional
tdd: false

# Conditional agents
ux_agent: auto                 # auto | always | never

# Quick flow
quick_complexity: S

# Knowledge compounding
auto_learn: true

# Party mode
party_default_agents: 4
```

## Directory Structure

```
rpi/
├── context.md
├── specs/
│   ├── auth/
│   │   └── session-management.md
│   └── payments/
│       └── stripe-checkout.md
├── solutions/
│   ├── performance/
│   ├── security/
│   ├── database/
│   ├── testing/
│   ├── architecture/
│   ├── patterns/
│   └── decisions/
└── features/
    └── {slug}/
        ├── REQUEST.md
        ├── research/
        │   └── RESEARCH.md
        ├── delta/
        │   ├── ADDED/
        │   ├── MODIFIED/
        │   └── REMOVED/
        ├── plan/
        │   ├── PLAN.md
        │   ├── eng.md
        │   ├── pm.md
        │   └── ux.md
        └── implement/
            └── IMPLEMENT.md
```
