---
name: rpi:onboarding
description: Analyze your codebase, generate a project profile, suggest features to build, and guide you through your first RPI feature.
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

<objective>
Auto-analyze the user's codebase with parallel agents, generate a persistent .rpi-profile.md, suggest features to build, and interactively guide the user through their first feature.
</objective>

<process>

## 1. Welcome

Output:
```
Welcome to RPIKit — Research, Plan, Implement.

RPIKit is a structured workflow that guides you through 3 phases before
writing any code. Each phase produces artifacts that feed the next, with
validation gates that prevent premature implementation.

I'm going to analyze your project first, then suggest features you
could build with RPIKit.
```

Check if `.rpi-profile.md` already exists and `--refresh` flag is NOT set:
- If exists: ask "Project profile already exists. Refresh it or skip to feature selection?"
- If `--refresh`: proceed with fresh analysis regardless

## 2. Codebase Analysis

Output:
```
Analyzing your project...
```

Launch 3 agents in parallel using the Agent tool in a single message:

### Agent A: Stack & Conventions Scanner

```
You are analyzing a project's technology stack and coding conventions. This is a READ-ONLY task — do not write any files.

1. Use Glob to find project config files:
   - package.json, tsconfig.json, tsconfig*.json
   - Cargo.toml, pyproject.toml, setup.py, setup.cfg
   - go.mod, Gemfile, composer.json, pom.xml, build.gradle
   - .eslintrc*, .prettierrc*, biome.json
   - vite.config.*, next.config.*, webpack.config.*
   - jest.config.*, vitest.config.*, pytest.ini
   - docker-compose.yml, Dockerfile
   - prisma/schema.prisma, drizzle.config.*

2. Read the config files found to identify:
   - Primary language and version
   - Framework and version
   - Database and ORM
   - Test framework and runner
   - Linter and formatter
   - Bundler and build tool
   - Styling approach (CSS modules, Tailwind, styled-components, etc.)

3. Use Glob to find 5-10 representative source files (pick from different directories):
   - Read them to detect:
     - File naming convention (kebab-case, camelCase, PascalCase, snake_case)
     - Component/module pattern (functional components, classes, modules)
     - Import style (relative paths, path aliases, barrel exports)
     - Error handling pattern (try/catch, Result types, custom errors)
     - API pattern (REST routes, GraphQL resolvers, tRPC procedures)

4. Identify architecture:
   - Directory structure pattern (src/, app/, lib/, etc.)
   - Layering (routes → services → repositories, etc.)
   - Key entry points (main files, layout files, middleware)

Output your findings in this exact format:

## Stack
- Language: {language} {version}
- Framework: {framework} {version}
- Database: {db} via {orm}
- Testing: {test_framework}
- Styling: {approach}
- Linter: {tool}
- Bundler: {tool}

## Conventions
- File naming: {pattern}
- Component pattern: {pattern}
- Import style: {pattern}
- Error handling: {pattern}
- API pattern: {pattern}

## Architecture
- Pattern: {description}
- Key directories: {list}
- Entry points: {list}
```

### Agent B: Code Health Scanner

```
You are analyzing a project's code health. This is a READ-ONLY task — do not write any files.

1. Use Grep to search for task markers:
   - Pattern: TODO|FIXME|HACK|XXX|WORKAROUND|BUG
   - Record: file, line number, and the marker text
   - Categorize by priority: FIXME/BUG = high, TODO = medium, HACK/XXX/WORKAROUND = low

2. Analyze test coverage gaps:
   - Use Glob to find all source files (*.ts, *.tsx, *.js, *.jsx, *.py, *.rs, *.go, etc.)
   - Use Glob to find all test files (*.test.*, *.spec.*, *_test.*, test_*.*)
   - Compare: which source modules have no corresponding test file?
   - List the untested modules

3. Check for dead code signals:
   - Use Grep to find exported functions/classes
   - Use Grep to find imports of those exports
   - Flag exports with zero imports (potential dead code)
   - Limit to 5 findings max

4. Check dependency health:
   - If package.json exists, note how many dependencies and devDependencies
   - Look for lock file (package-lock.json, yarn.lock, pnpm-lock.yaml)
   - Note if any dependency versions use '*' or 'latest'

5. Find uncovered error paths:
   - Use Grep to find try/catch blocks, .catch(), or error handlers
   - Look for empty catch blocks or catch blocks that only log
   - Limit to 5 findings max

Output your findings in this exact format:

## Health
- Task markers: {N} found ({high} high, {med} medium, {low} low priority)
- Test coverage: {tested}/{total} modules have tests ({percentage}%)
- Dead code signals: {N} potentially unused exports
- Dependencies: {N} deps, {M} devDeps, lock file: {yes/no}
- Uncovered error paths: {N} found

### High Priority Markers
- {file}:{line} — {marker text}

### Untested Modules
- {file} — no test file found

### Uncovered Error Paths
- {file}:{line} — {description}

## Suggested Features (from code health)
1. [{priority}] {slug} — {description based on findings}
2. [{priority}] {slug} — {description}
(Generate 1-3 suggestions based on the most impactful findings)
```

### Agent C: Git & History Analyzer

```
You are analyzing a project's git history and risk profile. This is a READ-ONLY task — do not write any files.

1. Run git commands to gather history (last 30 days):
   ```bash
   git log --oneline --since="30 days ago" | head -30
   ```
   ```bash
   git shortlog -sn --since="30 days ago"
   ```
   ```bash
   git log --since="30 days ago" --pretty=format: --name-only | sort | uniq -c | sort -rn | head -10
   ```

2. Identify hotspot files (most frequently changed in 30 days)

3. Identify recent focus areas from commit messages:
   - What themes appear? (auth, payments, UI, refactor, bugfix, etc.)

4. Check for GitHub remote and issues:
   ```bash
   git remote get-url origin 2>/dev/null
   ```
   If GitHub remote exists, try:
   ```bash
   gh issue list --limit 5 --state open 2>/dev/null
   ```
   If gh is not available or fails, skip gracefully.

5. Assess risks:
   - Files changed very frequently (>10 times in 30 days) = churn risk
   - Single contributor to critical files = bus factor risk
   - No recent commits in important directories = stale code risk

Output your findings in this exact format:

## Git Insights
- Commits (30d): {N}
- Contributors (30d): {N}
- Most changed files: {file1} ({count}), {file2} ({count}), {file3} ({count})
- Recent focus: {themes}
- Open issues: {N} (or "GitHub CLI not available")

## Risks
- {risk_type}: {description} — {evidence}
(List 1-5 risks based on findings. If no significant risks, say "No significant risks detected.")

## Suggested Features (from git analysis)
1. [{priority}] {slug} — {description based on findings}
(Generate 0-2 suggestions. Only suggest if findings warrant it.)
```

## 3. Generate Project Profile

After all 3 agents complete, merge their outputs into `.rpi-profile.md`.

### 3.1 Merge agent outputs

Combine the structured sections from all 3 agents:
- From Agent A: Stack, Conventions, Architecture
- From Agent B: Health, Suggested Features
- From Agent C: Git Insights, Risks, Suggested Features

### 3.2 Deduplicate and rank suggestions

Merge suggested features from Agent B and Agent C:
- Remove duplicates (same area of code)
- Rank by priority: HIGH > MEDIUM > LOW
- Keep top 5 suggestions max

### 3.3 Write .rpi-profile.md

Write the merged profile to `.rpi-profile.md` at the project root:

```markdown
# Project Profile

Generated: {YYYY-MM-DD HH:mm}

{Stack section from Agent A}

{Conventions section from Agent A}

{Architecture section from Agent A}

{Health section from Agent B}

{Risks section from Agent C}

## Suggested Features
{Merged and ranked list from Agents B and C}
1. [{priority}] {slug} — {description}
   Source: {what finding led to this suggestion}
2. ...

{Git Insights section from Agent C}
```

### 3.4 Run /rpi:init if needed

Check if `.rpi.yaml` exists:
- If yes: read it and confirm with user ("Found existing config. Using it.")
- If no: run the init flow — ask the 4 batches of questions from `/rpi:init` and create `.rpi.yaml`

### 3.5 Present profile summary

Output a condensed version of the profile:
```
Project Profile — saved to .rpi-profile.md

  Stack:    {language} / {framework} / {db}
  Tests:    {tested}/{total} modules covered ({percentage}%)
  Health:   {N} TODOs, {M} uncovered error paths
  Risks:    {risk_count} identified
  Hotspots: {top_file} ({changes} changes in 30d)

  {N} feature suggestions generated.
```

## 4. Feature Selection

Present the suggested features from the profile and ask the user what they want to do.

Use AskUserQuestion:

"Based on your project analysis, here are the top suggestions:

{numbered list of suggestions with priority and description}

What would you like to do?"

Options:
- "Build one of these features" → ask which one, proceed to Phase 5 option A
- "Describe my own feature" → proceed to Phase 5 option B
- "See a demo first" → proceed to Phase 5 option C
- "I'm done — I'll explore on my own" → proceed to Phase 5 option D

If user picks "Build one of these features", follow up with AskUserQuestion listing the suggestions as selectable options.

## 5. Guided First Feature

### Option A: Build a suggested feature

1. Read the selected suggestion from the profile
2. Read `.rpi.yaml` for the configured folder
3. Create the feature folder structure:
   ```bash
   mkdir -p {folder}/{slug}/research
   mkdir -p {folder}/{slug}/plan
   mkdir -p {folder}/{slug}/implement
   ```
4. Pre-fill REQUEST.md using context from the profile and the suggestion:
   - Summary: from the suggestion description
   - Problem: from the source finding (TODO, test gap, risk)
   - Target Users: infer from the codebase context
   - Constraints: from conventions and architecture in the profile
   - Complexity Estimate: infer from the suggestion scope
5. Show the generated REQUEST.md to the user
6. Output:
   ```
   Feature created: {folder}/{slug}/REQUEST.md

   This is what /rpi:new produces — a structured feature description.

   Next steps:
     /rpi:research {slug}    Agents analyze feasibility → GO/NO-GO
     /rpi:plan {slug}        Generate specs + task checklist
     /rpi:implement {slug}   Build it task by task

   Want me to run /rpi:research {slug} now?
   ```
7. If user says yes, explain what's about to happen ("Research phase: agents will analyze your codebase and requirements in parallel..."), then suggest they run the command.

### Option B: Describe your own feature

1. Explain: "Let's create your first feature. I'll ask a few questions to understand what you want to build."
2. Run the same interview flow as `/rpi:new`:
   - Ask: "What feature do you want to build?"
   - Derive slug from answer
   - Ask: "What problem does this solve? Who benefits?"
   - Ask adaptive follow-ups based on answers
3. Create REQUEST.md in the feature folder
4. Present next steps as in Option A

### Option C: See a demo

1. If `.rpi.yaml` doesn't exist, create a minimal one with defaults
2. Create demo folder and REQUEST.md:
   ```bash
   mkdir -p {folder}/demo-greeting/research
   mkdir -p {folder}/demo-greeting/plan
   mkdir -p {folder}/demo-greeting/implement
   ```
3. Write `{folder}/demo-greeting/REQUEST.md`:
   ```markdown
   # Greeting Message

   ## Summary
   Add a simple greeting function that returns a personalized welcome message.

   ## Problem
   The application has no way to greet users by name.

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
4. Explain each section:
   ```
   I created a demo feature: {folder}/demo-greeting/

   This is what /rpi:new produces. Let me walk through the sections:

     Summary      → One-line description of the feature
     Problem      → Why this is needed, who's affected
     Target Users → Who will use it
     Constraints  → Technical and business boundaries
     Complexity   → Rough size estimate (S/M/L/XL)

   In a real workflow, the next steps would be:
     /rpi:research demo-greeting    → agents analyze feasibility
     /rpi:plan demo-greeting        → generate specs and task checklist
     /rpi:implement demo-greeting   → build it task by task

   You can run these commands now, or clean up the demo:
     rm -rf {folder}/demo-greeting
   ```

### Option D: Exit

Output:
```
Your project profile is saved at .rpi-profile.md
RPIKit agents will use it for better context in all future commands.

Quick reference:
  /rpi:new my-feature          Start a new feature
  /rpi:research my-feature     Analyze feasibility
  /rpi:plan my-feature         Generate implementation plan
  /rpi:implement my-feature    Build it
  /rpi:status                  See all features

Tips:
  - Start with --quick tier for small features
  - Use --deep tier for risky or large changes
  - Enable tdd: true in .rpi.yaml for test-first development
  - Run /rpi:onboarding --refresh to re-analyze your project anytime
```

</process>
