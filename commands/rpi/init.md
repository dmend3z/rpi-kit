---
name: rpi:init
description: Configure RPIKit and generate project-context.md by analyzing your codebase.
argument-hint: ""
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Agent
  - AskUserQuestion
---

# /rpi:init — Setup & Context Generation

Configure RPIKit for this project: interview the user for preferences, write `.rpi.yaml`, create directory structure, and launch Atlas to generate `rpi/context.md`.

---

## Step 1: Check for existing config

Check if `.rpi.yaml` exists in the project root.

If it exists:
- Read the file and store its contents as `$EXISTING_CONFIG`.
- Ask the user with AskUserQuestion: "`.rpi.yaml` already exists. Do you want to overwrite it with fresh config, or update specific settings?"
  - If overwrite: proceed to Step 2 (will replace everything).
  - If update: proceed to Step 2 but pre-fill answers from `$EXISTING_CONFIG` and only ask about values the user wants to change.

If it does not exist: proceed to Step 2.

## Step 2: Interview — Batch 1 (Development preferences)

Ask the user with a single AskUserQuestion call:

```
Let's configure RPIKit for this project. A few quick questions:

1. **TDD** — Should Sage write failing tests before Forge implements? (true/false, default: false)
2. **Commit style** — conventional commits or freeform? (conventional/freeform, default: conventional)
3. **UX agent (Pixel)** — When should Pixel participate in planning? (auto = only if frontend detected / always / never, default: auto)
```

Store the responses. Use defaults for any unanswered or unclear answers.

## Step 3: Interview — Batch 2 (Workflow preferences)

Ask the user with a single AskUserQuestion call:

```
Almost done:

1. **Auto-learn** — Should review findings be saved to rpi/solutions/ automatically? (true/false, default: true)
2. **Party mode agents** — How many agents should participate in /rpi:party debates? (3-5, default: 4)
```

Store the responses. Use defaults for any unanswered or unclear answers.

## Step 4: Write .rpi.yaml

Write `.rpi.yaml` to the project root with the collected responses and sensible defaults:

```yaml
version: 2

# Directories
folder: rpi/features
specs_dir: rpi/specs
solutions_dir: rpi/solutions
context_file: rpi/context.md

# Execution
parallel_threshold: 8
commit_style: {user_response or "conventional"}
tdd: {user_response or false}

# Agents
ux_agent: {user_response or "auto"}

# Quick flow
quick_complexity: S

# Knowledge compounding
auto_learn: {user_response or true}

# Party mode
party_default_agents: {user_response or 4}
```

If updating an existing config: merge user responses into `$EXISTING_CONFIG`, preserving any keys the user did not explicitly change.

## Step 5: Create directory structure

Run these commands to create the RPIKit directories:

```bash
mkdir -p rpi/specs
mkdir -p rpi/solutions
mkdir -p rpi/features
```

## Step 6: Launch Atlas for context generation

Launch Atlas agent to analyze the codebase and generate `rpi/context.md`:

```
You are Atlas. Analyze this entire codebase and generate a project context file.

Your task:
1. Read config files first: package.json, tsconfig.json, pyproject.toml, Cargo.toml, go.mod, Gemfile, composer.json, or whatever exists
2. Scan the directory structure to understand architecture and layering
3. Find 5-10 representative source files across different directories
4. Detect naming conventions, component patterns, import style, error handling
5. Check for CLAUDE.md, .cursorrules, .clinerules, or similar project rules files
6. Identify the testing framework and test patterns
7. Identify styling/CSS approach if frontend

Produce a context file with this EXACT structure:

# Project Context

## Stack
- Language: {language} {version}
- Framework: {framework} {version}
- Database: {db} via {orm} (or "None detected")
- Testing: {test_framework}
- Styling: {approach} (or "N/A")

## Conventions
- File naming: {pattern}
- Components: {pattern} (or "N/A")
- Error handling: {pattern}
- API: {pattern} (or "N/A")

## Architecture
- {directory}: {purpose}
- {directory}: {purpose}
- ...

## Rules
- {rule 1 derived from codebase analysis or existing rules files}
- {rule 2}
- ...

RULES:
- Be specific — cite actual patterns you found, not generic advice
- Only include what you can verify from the code
- If a section doesn't apply (e.g., no database), write "N/A" and move on
- Keep each section concise — this file is read by every agent on every run
```

Wait for Atlas to complete. Store the output as `$ATLAS_CONTEXT`.

## Step 7: Write rpi/context.md

Write the Atlas output to `rpi/context.md`.

## Step 8: Output summary

Output to the user:

```
RPIKit initialized!

Config: .rpi.yaml
Context: rpi/context.md
Directories: rpi/specs/, rpi/solutions/, rpi/features/

Settings:
- TDD: {value}
- Commit style: {value}
- UX agent: {value}
- Auto-learn: {value}
- Party agents: {value}

Quick reference:
- /rpi:new <feature>     Create a new feature (Luna interviews you)
- /rpi <feature>         Auto-progress to next phase
- /rpi:research <feat>   Run research phase
- /rpi:plan <feat>       Run plan phase
- /rpi:implement <feat>  Run implement phase
- /rpi:simplify <feat>   Run simplify phase
- /rpi:review <feat>     Run review phase
- /rpi:docs <feat>       Run docs phase
- /rpi:status            View all features and progress
- /rpi:party "topic"     Multi-agent debate
- /rpi:learn             Save a solution manually
- /rpi:archive <feat>    Archive completed feature
```
