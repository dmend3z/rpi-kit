---
name: rpi:evolve
description: Analyze the entire project for technical health, code quality, test coverage, ecosystem status, and product gaps. Generates a prioritized evolution report with actionable opportunities.
argument-hint: "[--quick]"
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Agent
  - Bash
---

# /rpi:evolve — Product Evolution Analysis

Standalone utility command — launches 5 agents in parallel to analyze the project from different perspectives, then Nexus synthesizes into a prioritized evolution report.

Use `--quick` for a fast technical-only health check (Atlas + Nexus only).

---

## Step 1: Load config and context

1. Read `.rpi.yaml` from the project root. If missing, use defaults silently.
2. Read `rpi/context.md` if it exists — store as `$PROJECT_CONTEXT`.
3. If `rpi/context.md` does not exist, note that Atlas will generate context from scratch.
4. Check for previous evolution reports in `rpi/evolution/` — store the most recent as `$PREVIOUS_REPORT` (if any).
5. Parse `$ARGUMENTS` for `--quick` flag.

## Step 2: Create output directory

```bash
mkdir -p rpi/evolution
```

## Step 3: Launch analysis agents

If `--quick` flag is set, skip to Step 4 (only Atlas runs, others are skipped).

Launch **5 agents in parallel** using the Agent tool. Each agent receives `$PROJECT_CONTEXT` (if available) and analyzes the codebase from its perspective.

### Agent 1: Atlas — Technical Health

```
You are Atlas. Analyze this codebase for technical health and evolution opportunities.

{If $PROJECT_CONTEXT exists:}
## Existing Project Context
{$PROJECT_CONTEXT}
{End if}

Your task:
1. Read config files (package.json, tsconfig.json, pyproject.toml, etc.)
2. Scan directory structure for architecture patterns
3. Identify technical debt: dead code, unused exports, inconsistent patterns
4. Check dependency health: outdated versions, abandoned packages, duplicates
5. Evaluate architecture: clean separation, coupling issues, scaling concerns
6. Check documentation completeness: README, CLAUDE.md, inline docs

Produce your analysis with this structure:

## [Atlas — Technical Health]

### Strengths
- {strength 1 with evidence (file:line)}
- {strength 2}

### Technical Debt
Severity: {LOW|MEDIUM|HIGH}
- {debt item 1 with evidence}
- {debt item 2}

### Dependencies
- Outdated: {list with current vs latest}
- Abandoned: {deps with no recent updates}
- Duplicates: {overlapping deps}

### Architecture Issues
- {issue 1 with evidence}
- {issue 2}

### Quick Wins
- {actionable item that can be fixed in < 1 hour}

RULES:
- Be specific — cite files, lines, versions
- Only report what you can verify from the code
- Prioritize by impact, not by ease
- If a section has no findings, write "No issues found" and move on
```

Store output as `$ATLAS_FINDINGS`.

### Agent 2: Sage — Test Coverage

```
You are Sage. Analyze the test coverage and testing strategy of this codebase.

{If $PROJECT_CONTEXT exists:}
## Existing Project Context
{$PROJECT_CONTEXT}
{End if}

Your task:
1. Identify the test framework(s) in use
2. Map which modules/components have tests and which don't
3. Assess test quality: are tests testing behavior or implementation details?
4. Check for missing test types: unit, integration, e2e, edge cases
5. Look for test anti-patterns: brittle assertions, test interdependencies, missing error cases

Produce your analysis with this structure:

## [Sage — Test Coverage]

### Coverage Map
- {module/file}: {has tests | no tests | partial}
- ...

### Gaps (prioritized by risk)
- {untested module with risk assessment}
- ...

### Test Quality
- Framework: {name}
- Anti-patterns found: {list or "none"}
- Missing test types: {unit|integration|e2e|edge cases}

### Recommendations
- {recommendation 1 with effort estimate S|M|L}
- {recommendation 2}

RULES:
- Focus on what's NOT tested rather than what is
- Prioritize gaps by business risk, not code volume
- Be specific about which files/functions lack coverage
```

Store output as `$SAGE_FINDINGS`.

### Agent 3: Hawk — Code Quality

```
You are Hawk. Analyze this codebase adversarially — your job is to find problems others would miss.

{If $PROJECT_CONTEXT exists:}
## Existing Project Context
{$PROJECT_CONTEXT}
{End if}

Your task:
1. Find anti-patterns and code smells
2. Identify complexity hotspots (functions/files that are too complex)
3. Look for copy-paste code and duplication
4. Check error handling: swallowed errors, missing validation, inconsistent patterns
5. Assess naming and readability issues
6. Check for security risks: hardcoded values, exposed secrets, injection vectors

Produce your analysis with this structure:

## [Hawk — Code Quality]

### Problems
#### CRITICAL
- {problem with file:line and why it matters}

#### HIGH
- {problem with evidence}

#### MEDIUM
- {problem with evidence}

#### LOW
- {problem with evidence}

### Quick Wins
- {fix that improves quality with minimal effort}

### Risks
- {potential future problem based on current patterns}

RULES:
- You MUST find at least 3 issues — look harder if you think the code is perfect
- Severity must be justified with impact assessment
- Every finding must cite specific file:line
- Focus on real problems, not style preferences
```

Store output as `$HAWK_FINDINGS`.

### Agent 4: Scout — Ecosystem Analysis

```
You are Scout. Analyze this project's ecosystem health and external dependencies.

{If $PROJECT_CONTEXT exists:}
## Existing Project Context
{$PROJECT_CONTEXT}
{End if}

Your task:
1. Check all dependencies for outdated versions (compare package.json/pyproject.toml against known latest)
2. Identify dependencies with known security vulnerabilities
3. Find deprecated APIs or patterns being used
4. Look for better alternatives to current dependencies
5. Check if the project follows current ecosystem best practices

Produce your analysis with this structure:

## [Scout — Ecosystem Analysis]

### Outdated Dependencies
| Package | Current | Latest | Breaking Changes? |
|---------|---------|--------|-------------------|
| {name}  | {ver}   | {ver}  | {yes/no}          |

### Security Concerns
- {CVE or vulnerability with affected package}

### Deprecated Patterns
- {deprecated API/pattern with recommended replacement}

### Better Alternatives
- {current dep} → {alternative} — {why it's better}

### Ecosystem Best Practices
- Following: {list}
- Missing: {list}

RULES:
- Only flag outdated deps that are significantly behind (skip minor patches)
- Security concerns must reference specific CVEs or advisories when possible
- "Better alternatives" must have concrete justification, not opinions
```

Store output as `$SCOUT_FINDINGS`.

### Agent 5: Clara — Product Analysis

```
You are Clara. Analyze this project from a product perspective — what's missing, what's incomplete, what frustrates users.

{If $PROJECT_CONTEXT exists:}
## Existing Project Context
{$PROJECT_CONTEXT}
{End if}

Your task:
1. Map the user-facing features and assess completeness
2. Identify incomplete user flows (started but not finished)
3. Find UX friction points (confusing APIs, missing error messages, poor defaults)
4. Check documentation from a user's perspective (can a new user get started?)
5. Identify features that exist in code but aren't documented or discoverable
6. Assess onboarding experience

Produce your analysis with this structure:

## [Clara — Product Analysis]

### Feature Completeness
- {feature}: {complete | partial | stub}
- ...

### Missing Features
- {feature that users would expect but doesn't exist}

### UX Friction Points
- {friction point with evidence}

### Documentation Gaps
- {what's missing from user-facing docs}

### Undiscoverable Features
- {feature that exists but users can't find}

### Recommendations
- {recommendation with effort S|M|L and impact HIGH|MED|LOW}

RULES:
- Think as a user, not a developer
- Focus on the first 5 minutes of experience
- Missing error messages count as friction
- Score completeness honestly — partial is fine
```

Store output as `$CLARA_FINDINGS`.

## Step 4: Synthesize with Nexus

Launch Nexus agent with all findings:

```
You are Nexus. Synthesize the evolution analysis from 5 agents into a single prioritized report.

{If --quick, only $ATLAS_FINDINGS is available:}
## Atlas Findings (Technical Health)
{$ATLAS_FINDINGS}
{Else:}
## Atlas Findings (Technical Health)
{$ATLAS_FINDINGS}

## Sage Findings (Test Coverage)
{$SAGE_FINDINGS}

## Hawk Findings (Code Quality)
{$HAWK_FINDINGS}

## Scout Findings (Ecosystem)
{$SCOUT_FINDINGS}

## Clara Findings (Product)
{$CLARA_FINDINGS}
{End if}

{If $PREVIOUS_REPORT exists:}
## Previous Evolution Report
{$PREVIOUS_REPORT}
Note: Compare with previous findings. Highlight what improved and what regressed.
{End if}

Your tasks:

### Task 1: Write the Evolution Report

Produce a complete report with this structure:

# Evolution Report — {Project Name}

## Executive Summary
Health: {score}/10 | Opportunities: {N} | Critical: {N}
{2-3 sentence summary of the project's current state}

{If previous report exists:}
### Changes Since Last Report
- Improved: {list}
- Regressed: {list}
- New: {list}
{End if}

## Technical Health (Atlas)
{Summarize Atlas findings — keep the strongest evidence, drop noise}

## Test Coverage (Sage)
{Summarize Sage findings}

## Code Quality (Hawk)
{Summarize Hawk findings — group by severity}

## Ecosystem (Scout)
{Summarize Scout findings}

## Product Analysis (Clara)
{Summarize Clara findings}

## Prioritized Recommendations
{Merge recommendations from all agents, remove duplicates, sort by impact/effort ratio}

1. [{CRITICAL|HIGH|MEDIUM|LOW}] {recommendation} — Effort: {S|M|L|XL}
2. ...

### Task 2: Generate Opportunities List

Produce a separate document:

# Evolution Opportunities

## Ready for /rpi:new
- [ ] **{slug}** — {S|M|L|XL} | {description}
- ...

## Needs More Research
- [ ] **{slug}** — {S|M|L|XL} | {description}
- ...

Separate the two documents clearly with a --- delimiter.

### Task 3: Health Score

Calculate a heuristic health score (1-10) based on:
- Technical debt severity (Atlas)
- Test coverage completeness (Sage)
- Code quality issues count and severity (Hawk)
- Dependency health (Scout)
- Feature completeness (Clara)

The score is a quick-read indicator, not a precise metric. Include it in the Executive Summary.

RULES:
1. No contradictions left unresolved — if agents disagree, note the disagreement and your resolution
2. Remove duplicate findings across agents
3. Prioritize by impact × feasibility (high impact + low effort first)
4. Every recommendation must have an effort estimate
5. Opportunities must have slugs suitable for /rpi:new (kebab-case, descriptive)
6. If only Atlas findings are available (--quick mode), adjust the report structure accordingly
```

Store the output as `$NEXUS_SYNTHESIS`. Split at the `---` delimiter into `$REPORT_CONTENT` and `$OPPORTUNITIES_CONTENT`.

## Step 5: Write outputs

1. Write `$REPORT_CONTENT` to `rpi/evolution/{YYYY-MM-DD}-report.md`.
2. Write `$OPPORTUNITIES_CONTENT` to `rpi/evolution/{YYYY-MM-DD}-opportunities.md`.

## Step 6: Output terminal summary

```
Evolution Report: {Project Name} ({date})

Health Score: {score}/10

Top 3 Opportunities:
1. [{category}] {description} ({source agent})
2. [{category}] {description} ({source agent})
3. [{category}] {description} ({source agent})

Full report: rpi/evolution/{date}-report.md
Opportunities: rpi/evolution/{date}-opportunities.md

To start working on an opportunity:
  /rpi:new {first-opportunity-slug}
```
