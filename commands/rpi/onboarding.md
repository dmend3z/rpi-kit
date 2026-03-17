---
name: rpi:onboarding
description: First-time setup — analyzes your codebase, generates context, and guides you through your first feature.
argument-hint: "[--refresh]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Agent
  - AskUserQuestion
---

# /rpi:onboarding — Guided First-Time Setup

Walks the user through RPIKit setup: explains the workflow, configures the project, analyzes the codebase, and guides them into their first feature.

---

## Step 1: Welcome message

Output to the user:

```
Welcome to RPIKit v2 — Research, Plan, Implement.

RPIKit is a 7-phase development workflow with 13 specialized AI agents.
Each phase produces artifacts that feed the next, with validation gates
that prevent premature implementation.

I'll analyze your project, set up configuration, and guide you through
your first feature.
```

## Step 2: Parse arguments and check existing setup

1. Parse `$ARGUMENTS` for `--refresh` flag.
2. Check if `rpi/context.md` exists.

- If `rpi/context.md` exists and `--refresh` was NOT passed:
  Ask with AskUserQuestion: "Project already configured. Do you want to refresh the analysis or skip to feature selection?"
  - If refresh: proceed to Step 3 (full init flow).
  - If skip: jump to Step 5 (read existing `rpi/context.md` and present summary).
- If `--refresh` was passed: proceed to Step 3 (full init flow).
- If `rpi/context.md` does not exist: proceed to Step 3 (full init flow).

## Step 3: Run /rpi:init flow inline — configuration interview

### Step 3a: Check existing config

Check if `.rpi.yaml` exists.
- If it exists and `--refresh` was NOT passed: ask with AskUserQuestion: ".rpi.yaml already exists. Overwrite with fresh config or keep current settings?"
  - If keep: skip to Step 3c.
  - If overwrite: proceed to Step 3b.
- If it exists and `--refresh` was passed: proceed to Step 3b.
- If it does not exist: proceed to Step 3b.

### Step 3b: Interview (2 batches)

**Batch 1** (use AskUserQuestion — ask all at once):
- "Do you use TDD? (yes/no, default: no)"
- "Commit style? (conventional/freeform, default: conventional)"
- "When should the UX agent (Pixel) run? (auto/always/never, default: auto — runs when frontend detected)"

**Batch 2** (use AskUserQuestion — ask all at once):
- "Auto-learn from implementations? When Forge finishes a task, should RPIKit capture the solution in rpi/solutions/? (yes/no, default: no)"
- "Party mode default panel size? (3/5/7, default: 5)"

### Step 3c: Write .rpi.yaml

Write `.rpi.yaml` to the project root with the user's responses (use defaults for unanswered questions):

```yaml
# RPI Workflow Configuration
# Docs: https://github.com/mndz/rpi-kit

folder: rpi/features
tier: deep
tdd: {user_response | false}
auto_simplify: true
commit_style: {user_response | conventional}
parallel_threshold: 8
skip_artifacts: []
review_after_implement: true
branch_per_feature: false
ux_agent: {user_response | auto}
auto_learn: {user_response | false}
party_panel_size: {user_response | 5}
```

### Step 3d: Create directory structure

```bash
mkdir -p rpi/specs
mkdir -p rpi/solutions
mkdir -p rpi/features
```

## Step 4: Launch Atlas — codebase analysis

Launch Atlas agent to analyze the codebase and generate `rpi/context.md`:

```
You are Atlas. Analyze this entire codebase and produce a comprehensive project context document.

Your task:
1. Read config files first (package.json, tsconfig, Cargo.toml, pyproject.toml, go.mod, etc.)
2. Explore the directory structure — map all key directories and their purposes
3. Find 5-10 representative source files across different parts of the codebase
4. Detect naming conventions, component patterns, import style, error handling
5. Identify the testing setup and coverage patterns
6. Note any TODOs, FIXMEs, or incomplete areas in the code
7. Identify untested modules or areas with weak coverage
8. Spot architectural risks or technical debt

Output format — write this directly to rpi/context.md:

# Project Context

## Stack
- Language: {language} {version}
- Framework: {framework} {version}
- Database: {db} (if any)
- Testing: {test_framework}
- Build: {build_tool}
- Package Manager: {package_manager}

## Architecture
- Pattern: {description}
- Key directories: {list with purposes}
- Entry points: {list}

## Conventions
- File naming: {pattern}
- Component pattern: {pattern}
- Import style: {pattern}
- Error handling: {pattern}
- API pattern: {pattern}

## Key Files
{List of important files with brief descriptions}

## Existing Tests
{Summary of test coverage and testing patterns}

## Risks and Technical Debt
{Identified risks, TODOs, FIXMEs, weak areas}

## Opportunities
{3-5 concrete feature ideas based on: TODOs found, untested modules, missing error handling, potential improvements}
```

Wait for Atlas to complete. Store the output as `$ATLAS_OUTPUT`.

## Step 5: Present codebase analysis summary

1. Read `rpi/context.md` (freshly generated or existing).
2. Output a condensed summary to the user:

```
Project Analysis Complete

Stack: {language} + {framework}
Architecture: {pattern}
Files: {approximate count}
Tests: {coverage summary}

Key findings:
- {finding 1}
- {finding 2}
- {finding 3}
```

## Step 6: Suggest features

Based on the `## Opportunities` section in `rpi/context.md` (or from `$ATLAS_OUTPUT`), present 3-5 concrete feature suggestions:

```
Based on the analysis, here are some things you could work on:

1. {feature idea} — {brief justification from codebase analysis}
2. {feature idea} — {brief justification}
3. {feature idea} — {brief justification}
```

Each suggestion should be grounded in something Atlas actually found (a TODO, an untested module, a missing pattern, a risk to address).

## Step 7: Ask what the user wants to do

Use AskUserQuestion:

"What would you like to do?
A) Build one of these features (pick a number)
B) Describe my own feature
C) I'll explore on my own"

### If A (build a suggested feature):

1. Convert the selected feature idea into a slug.
2. Read `commands/rpi/new.md` and follow its process from Step 4 onward (Luna's interview), using the suggested feature as context.
3. After REQUEST.md is created, output:
   ```
   Feature created: rpi/features/{slug}/REQUEST.md

   Next: /rpi {slug}
   ```

### If B (describe own feature):

1. Ask with AskUserQuestion: "What's the name for this feature? (short, e.g. 'oauth', 'dark-mode', 'csv-export')"
2. Read `commands/rpi/new.md` and follow its process from Step 4 onward (Luna's interview).
3. After REQUEST.md is created, output:
   ```
   Feature created: rpi/features/{slug}/REQUEST.md

   Next: /rpi {slug}
   ```

### If C (explore on their own):

Proceed to Step 8.

## Step 8: Quick reference card

Output to the user:

```
Quick Reference:
  /rpi:new my-feature    Start a new feature
  /rpi my-feature        Auto-progress to next phase
  /rpi:party "topic"     Multi-agent debate
  /rpi:learn             Capture a solution
  /rpi:status            See all features

Setup complete. Happy building!
```
