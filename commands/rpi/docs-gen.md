---
name: rpi:docs-gen
description: Analyze the codebase and generate a CLAUDE.md with project rules, conventions, and architecture.
argument-hint: ""
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Agent
  - AskUserQuestion
---

# /rpi:docs-gen — Generate CLAUDE.md

Standalone utility command — uses Atlas for codebase analysis and Quill for writing. Does not require the RPI feature pipeline.

---

## Step 1: Load config

Read `.rpi.yaml` from the project root. Extract:
- `commit_style` (default: `conventional`)

If `.rpi.yaml` does not exist, use defaults silently.

## Step 2: Check for existing CLAUDE.md

Check if `CLAUDE.md` exists at the project root.

- If it exists: read it and store as `$EXISTING_CLAUDE_MD`. Proceed to Step 3.
- If it does not exist: set `$EXISTING_CLAUDE_MD` to empty. Skip to Step 4.

## Step 3: Handle existing CLAUDE.md

Ask with AskUserQuestion:

```
CLAUDE.md already exists ({line_count} lines). What would you like to do?
A) Overwrite — generate a new CLAUDE.md from scratch (existing content will be replaced)
B) Cancel — keep the existing file unchanged
```

- If A (overwrite): proceed to Step 4.
- If B (cancel): output "No changes made." and stop.

## Step 4: Launch Atlas for codebase analysis

Launch Atlas agent with the following prompt:

```
You are Atlas. Analyze this entire codebase and produce a structured analysis for generating a CLAUDE.md file.

Your task:
1. Read config files first: package.json, tsconfig.json, pyproject.toml, Cargo.toml, go.mod, Gemfile, composer.json, Makefile, Dockerfile, or whatever exists
2. Scan the directory structure to understand architecture and layering
3. Find 5-10 representative source files across different directories
4. Detect naming conventions, component patterns, import style, error handling
5. Check for existing CLAUDE.md, .cursorrules, .clinerules, or similar project rules files — if found, note their content for reference
6. Identify the testing framework and test patterns
7. Identify styling/CSS approach if frontend
8. List the 10-15 most important files in the project with one-line descriptions
9. Detect useful developer commands: scripts in package.json, Makefile targets, common commands for running, testing, building, linting

Produce your analysis with this EXACT structure:

## Stack
- Language: {language} {version}
- Framework: {framework} {version}
- Database: {db} via {orm} (or "None detected")
- Testing: {test_framework}
- Styling: {approach} (or "N/A")
- Build: {build_tool}
- Package Manager: {package_manager}

## Architecture
- Pattern: {description — e.g., "layered MVC", "monorepo with packages/", "plugin system"}
- Key directories:
  - {directory}: {purpose}
  - {directory}: {purpose}
  - ...
- Entry points: {list}

## Conventions
- File naming: {pattern — e.g., "kebab-case.ts", "PascalCase.tsx for components"}
- Components: {pattern} (or "N/A")
- Import style: {pattern — e.g., "absolute imports via @/", "relative imports"}
- Error handling: {pattern — e.g., "try/catch with custom AppError class", "Result types"}
- API: {pattern} (or "N/A")
- Commits: {pattern detected from git log — e.g., "conventional commits", "freeform"}

## Key Files
- {file}: {one-line description}
- {file}: {one-line description}
- ...

## Commands
- {command}: {what it does}
- {command}: {what it does}
- ...

## Rules
- {rule 1 derived from codebase analysis or existing rules files}
- {rule 2}
- ...

RULES:
- Be specific — cite actual patterns you found, not generic advice
- Only include what you can verify from the code
- If a section doesn't apply (e.g., no database), write "N/A" and move on
- Keep each section concise
- For Rules: derive actionable rules from what you observed, not generic software engineering advice
- If you found an existing CLAUDE.md or similar rules file, incorporate its rules (they are the team's explicit preferences)
```

Wait for Atlas to complete. Store the output as `$ATLAS_ANALYSIS`.

## Step 5: Launch Quill to generate CLAUDE.md

Launch Quill agent with the following prompt:

```
You are Quill. Generate a CLAUDE.md file for this project based on the codebase analysis below.

## Codebase Analysis (from Atlas)
{$ATLAS_ANALYSIS}

## Project Config
- Commit style: {commit_style from .rpi.yaml or "conventional"}

{If $EXISTING_CLAUDE_MD is not empty:}
## Previous CLAUDE.md (being replaced)
{$EXISTING_CLAUDE_MD}
Note: The user chose to overwrite. You may incorporate relevant rules from the previous version if they are still valid based on Atlas's analysis.
{End if}

Your task: generate a complete CLAUDE.md file. Output only the file content — the command will handle writing to disk after user confirmation.

Target structure:

# Project Rules

## Behavior
{3-6 rules about development behavior: how to handle errors, when to ask vs assume, commit practices.
Derive these from the codebase analysis — e.g., if conventional commits are used, state it.
If an existing CLAUDE.md had behavior rules, preserve the ones still relevant.}

## Code
{3-6 rules about code style: naming, patterns, imports, error handling.
These come directly from Atlas's Conventions section.
Be specific — "Use kebab-case for file names" not "Follow naming conventions."}

## Stack
{Direct copy of Atlas's Stack section, formatted as a concise list.}

## Architecture
{Direct copy of Atlas's Architecture section.
Include directory map with purposes.}

## Conventions
{Merge of Atlas's Conventions section with any additional patterns.
Focus on things another developer or AI assistant would need to know to write consistent code.}

## Commands
{Useful developer commands from Atlas's Commands section.
Format: `command` — description
Include: run, test, build, lint, format, deploy — whatever exists.}

Rules for writing:
- Every rule must be actionable — "Use X" not "Consider X"
- No generic software engineering advice — only project-specific rules
- If a convention is obvious from the language/framework default, omit it
- Keep the file under 80 lines total — CLAUDE.md is read on every AI invocation, brevity matters
- Match the tone of existing project documentation if any exists
- If the code says WHAT, the docs should say WHY
```

Wait for Quill to complete. Store the output as `$CLAUDE_MD_CONTENT`.

## Step 6: Preview and confirm

Output the generated content to the user:

```
Generated CLAUDE.md preview:

---
{$CLAUDE_MD_CONTENT}
---
```

Ask with AskUserQuestion:

```
Write this to CLAUDE.md at the project root?
A) Yes — write the file
B) No — discard (you can copy the content above manually if you want)
```

- If A (yes): proceed to Step 7.
- If B (no): output "No changes made." and stop.

## Step 7: Write CLAUDE.md

Write `$CLAUDE_MD_CONTENT` to `CLAUDE.md` at the project root.

## Step 8: Output summary

```
CLAUDE.md generated ({line_count} lines)

Sections: Behavior, Code, Stack, Architecture, Conventions, Commands

{If $EXISTING_CLAUDE_MD was not empty:}
Previous CLAUDE.md was replaced.
{End if}

Tip: Review and edit CLAUDE.md to add project-specific rules that automated analysis might miss.
```
