---
name: rpi:onboarding
description: Interactive guided tour of the RPI workflow. Walks through each phase with a real demo feature, explaining what happens at each step.
argument-hint: "[--demo]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - AskUserQuestion
---

<objective>
Guide a new user through the RPIKit workflow with clear explanations of each phase. Optionally create a demo feature to show the pipeline in action.
</objective>

<process>

## 1. Welcome

Output:
```
Welcome to RPIKit — Research, Plan, Implement.

RPIKit is a structured workflow that guides you through 3 phases before writing
any code. Each phase produces artifacts that feed the next, with validation
gates that prevent premature implementation.

Let me walk you through the pipeline.
```

## 2. Explain the pipeline

Present the full pipeline with brief descriptions:

```
The RPIKit Pipeline
───────────────────

  /rpi:init         One-time project setup (.rpi.yaml)

  /rpi:new          Describe your feature → REQUEST.md
       │            You answer a few questions about what you want to build.
       │            RPIKit captures requirements in a structured format.
       ▼
  /rpi:research     Analyze feasibility → RESEARCH.md
       │            2-6 agents run in parallel: parsing requirements,
       │            exploring your codebase, assessing scope and risk.
       │            Produces a GO / NO-GO verdict.
       ▼
  /rpi:plan         Generate specs + tasks → PLAN.md
       │            Creates technical spec (eng.md), product requirements
       │            (pm.md), UX design (ux.md), and a task checklist.
       │            Adapts which artifacts to create based on feature type.
       ▼
  /rpi:implement    Execute tasks → IMPLEMENT.md
       │            Builds the feature task-by-task with per-task commits.
       │            Supports TDD (Red-Green-Refactor) and parallel execution.
       ▼
  /rpi:simplify     Code quality → auto-fix
       │            3 agents check: code reuse, quality patterns, efficiency.
       │            Fixes issues directly.
       ▼
  /rpi:review       Verify against plan → PASS / FAIL
       │            Reviews completeness, correctness, deviations, test
       │            coverage. Every finding cites a plan requirement.
       ▼
  /rpi:docs         Document the code → inline docs + changelog
                    Adds JSDoc/docstrings, API docs, README and changelog
                    updates. Only runs after review PASS.

  /rpi:status       Dashboard — see all features and their current phase.
```

## 3. Explain the agents

```
RPIKit simulates a product team with 12 specialized agents:

  Research agents (run in parallel):
  ┌─────────────────────┬──────────────────────────────────────┐
  │ Requirement Parser  │ Extracts testable requirements       │
  │ Codebase Explorer   │ Scans your code for patterns         │
  │ Product Manager     │ Scope, user stories, effort          │
  │ Senior Engineer     │ Architecture, dependencies           │
  │ CTO Advisor         │ Risk, strategy (deep tier only)      │
  │ UX Designer         │ User flows, interactions (if UI)     │
  │ Doc Synthesizer     │ Merges all outputs into RESEARCH.md  │
  └─────────────────────┴──────────────────────────────────────┘

  Execution agents:
  ┌─────────────────────┬──────────────────────────────────────┐
  │ Plan Executor       │ Implements one task at a time        │
  │ Test Engineer       │ Writes failing tests (TDD)           │
  │ Code Simplifier     │ Reuse, quality, efficiency checks    │
  │ Code Reviewer       │ Reviews against plan requirements    │
  │ Doc Writer          │ Generates code documentation         │
  └─────────────────────┴──────────────────────────────────────┘
```

## 4. Explain research tiers

```
Research Tiers — control depth and cost:

  --quick      2 agents    "Can we do this?"
                           Requirements + codebase scan.
                           Use for small features or feasibility checks.

  --standard   4 agents    "How should we do this?"  (default)
                           Adds product scope and technical approach.
                           Use for most features.

  --deep       6 agents    "Should we do this?"
                           Adds strategic risk and UX analysis.
                           Use for large features or risky changes.
```

## 5. Show folder structure

```
Feature Folder Structure:

  rpi/
  └── your-feature/
      ├── REQUEST.md              ← What you want to build
      ├── research/
      │   └── RESEARCH.md         ← GO/NO-GO analysis
      ├── plan/
      │   ├── PLAN.md             ← Task checklist by phases
      │   ├── eng.md              ← Technical specification
      │   ├── pm.md               ← Product requirements (adaptive)
      │   └── ux.md               ← UX design (adaptive)
      └── implement/
          ├── IMPLEMENT.md        ← Execution audit trail
          └── DOCS.md             ← Documentation summary

Each file is a gate — you can't plan without research, can't implement
without a plan, can't document without a passing review.
```

## 6. Ask about demo

Use AskUserQuestion:
"Want me to create a demo feature so you can see the pipeline in action? I'll create a small example feature and walk you through each step."

Options:
- "Yes, show me a demo" → proceed to step 7
- "No, I'll start on my own" → skip to step 8

## 7. Demo walkthrough (if user wants demo)

Create a minimal demo feature to show what each artifact looks like:

### 7.1 Create demo config

If `.rpi.yaml` doesn't exist, create a minimal one:
```yaml
folder: rpi
tier: quick
auto_simplify: true
commit_style: conventional
parallel_threshold: 8
review_after_implement: true
isolation: none
tdd: false
test_runner: auto
```

### 7.2 Create demo REQUEST.md

```bash
mkdir -p rpi/demo-greeting/research
mkdir -p rpi/demo-greeting/plan
mkdir -p rpi/demo-greeting/implement
```

Write `rpi/demo-greeting/REQUEST.md`:
```markdown
# Greeting Message

## Summary
Add a simple greeting function that returns a personalized welcome message.

## Problem
The application has no way to greet users by name. This is needed for the onboarding flow.

## Target Users
All new users during their first session.

## Constraints
- Must be a pure function (no side effects)
- Must handle missing or empty names gracefully

## References
- None

## Complexity Estimate
S — Single function with basic input validation
```

### 7.3 Explain what just happened

Output:
```
I created a demo feature: rpi/demo-greeting/

This is what /rpi:new does — it interviews you about your feature and creates
REQUEST.md with structured requirements.

In a real workflow, the next steps would be:
  /rpi:research demo-greeting    → agents analyze feasibility
  /rpi:plan demo-greeting        → generate specs and task checklist
  /rpi:implement demo-greeting   → build it task by task

You can run these commands now to see the full pipeline, or delete the demo:
  rm -rf rpi/demo-greeting
```

## 8. Next steps

Output:
```
You're ready to go! Here's your first workflow:

  1. /rpi:init                    Set up your preferences
  2. /rpi:new my-feature          Describe what you want to build
  3. /rpi:research my-feature     Let the agents analyze it
  4. /rpi:plan my-feature         Generate the implementation plan
  5. /rpi:implement my-feature    Build it

Use /rpi:status anytime to see where your features stand.

Tips:
  - Start with --quick tier for small features
  - Use --deep tier when adding new architecture or risky dependencies
  - Enable tdd: true in .rpi.yaml if you want test-first development
  - Run /rpi:simplify anytime to check code quality on recent changes
```

</process>
