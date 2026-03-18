---
name: rpi:plan
description: Interview developer, generate specs with Mestre/Clara/Pixel, then adversarial review with Nexus.
argument-hint: "<feature-name> [--force]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Agent
  - AskUserQuestion
---

# /rpi:plan — Plan Phase (v2: Interview-Driven)

Nexus interviews the developer, then Mestre (architecture), Clara (product), and Pixel (UX, conditional) generate specs informed by the interview. Nexus performs adversarial review, surfacing contradictions for developer resolution.

---

## Step 1: Load config and validate

1. Read `.rpi.yaml` for config. Apply defaults if missing:
   - `folder`: `rpi/features`
   - `specs_dir`: `rpi/specs`
   - `context_file`: `rpi/context.md`
   - `ux_agent`: `auto`
2. Parse `$ARGUMENTS` to extract `{slug}` and optional `--force` flag.
3. Validate `rpi/features/{slug}/research/RESEARCH.md` exists. If not:
   ```
   RESEARCH.md not found for '{slug}'. Run /rpi:research {slug} first.
   ```
   Stop.

## Step 2: Check research verdict

1. Read `rpi/features/{slug}/research/RESEARCH.md`.
2. Look for the `## Verdict` section.
3. If verdict is `NO-GO` and `--force` was NOT passed:
   ```
   Research verdict is NO-GO for '{slug}'.
   Review RESEARCH.md for details and alternatives.
   To override: /rpi:plan {slug} --force
   ```
   Stop.
4. If `--force` was passed: proceed despite NO-GO verdict.

## Step 3: Check existing plan

1. Check if `rpi/features/{slug}/plan/PLAN.md` already exists.
2. If it exists and `--force` was NOT passed:
   - Ask the user: "PLAN.md already exists for '{slug}'. Overwrite? (yes/no)"
   - If no: stop.
3. If `--force` was passed or user confirms: proceed (will overwrite).

## Step 4: Gather context

1. Read `rpi/features/{slug}/REQUEST.md` — store as `$REQUEST`.
2. Read `rpi/features/{slug}/research/RESEARCH.md` — store as `$RESEARCH`.
3. Read `rpi/context.md` (project context) if it exists — store as `$CONTEXT`.
4. Scan `rpi/specs/` for specs relevant to the feature — store as `$RELEVANT_SPECS`.

## Step 5: Detect frontend

Check the project root for frontend framework config files:
- `next.config.*` or `next.config.ts` → Next.js
- `vite.config.*` → Vite (React/Vue/Svelte)
- `angular.json` → Angular
- `svelte.config.*` → Svelte/SvelteKit
- `nuxt.config.*` → Nuxt
- `package.json` containing `react`, `vue`, `angular`, or `svelte` in dependencies

Set `$HAS_FRONTEND` to `true` if any of these are detected.

Read `ux_agent` from `.rpi.yaml`:
- If `always`: set `$RUN_PIXEL` to `true` regardless of frontend detection.
- If `never`: set `$RUN_PIXEL` to `false` regardless.
- If `auto` (default): set `$RUN_PIXEL` to `$HAS_FRONTEND`.

## Step 6: Assess complexity

Analyze `$REQUEST` and `$RESEARCH` to determine interview depth.

1. Count files mentioned in RESEARCH.md (file changes, affected components).
2. Check if the feature involves new architecture (new system/service) vs modification of existing.
3. Check if it spans multiple system layers (frontend + backend + database, or multiple services).
4. Count open questions and risks flagged in RESEARCH.md.
5. Determine complexity and interview depth:

| Complexity | Files affected | Layers | Interview depth |
|-----------|---------------|--------|----------------|
| S | 1-3 | single | 3-4 questions |
| M | 4-8 | 1-2 | 4-5 questions |
| L | 9-15 | multiple | 5-6 questions |
| XL | 16+ | cross-cutting | 6-8 questions |

6. Store as `$COMPLEXITY` and `$INTERVIEW_DEPTH`.
7. Output to user:
   ```
   Complexity: {$COMPLEXITY} — Interview depth: {$INTERVIEW_DEPTH} questions
   ```

## Step 7: Launch Nexus — developer interview

Launch Nexus agent to interview the developer before spec generation:

```
You are Nexus. You are interviewing the developer about feature: {slug}
before the planning agents (Mestre, Clara, Pixel) generate their specs.

Your goal: surface decisions, constraints, and preferences that will
shape the plan. You are a FACILITATOR — you don't make decisions,
you help the developer make informed ones.

## Context
### REQUEST.md
{$REQUEST}

### RESEARCH.md
{$RESEARCH}

### Project Context
{$CONTEXT}

### Complexity Assessment
Complexity: {$COMPLEXITY}
Interview depth: {$INTERVIEW_DEPTH} questions

## Interview Protocol

### Phase 1: Analyze Context (internal, no output)
1. Read REQUEST.md and identify:
   - Ambiguous requirements (multiple valid interpretations)
   - Unstated assumptions
   - Missing technical decisions
2. Read RESEARCH.md and identify:
   - Open questions flagged by Atlas/Scout
   - Risks without clear mitigations
   - Alternative approaches not yet chosen
   - Contradictions between research findings
3. Prioritize: rank discovered gaps by impact on plan quality
4. Select top {$INTERVIEW_DEPTH} questions across categories

### Phase 2: Interview (interactive)
Ask questions ONE AT A TIME using AskUserQuestion tool.

Rules:
- Each question MUST reference specific content from REQUEST or RESEARCH
- Provide 2-4 concrete options when possible (not vague open-ended)
- Include your recommendation as first option with "(Recommended)"
- After each answer, acknowledge briefly and ask the next question
- If an answer reveals NEW ambiguity, add a follow-up (within limit)
- Categories to cover (pick based on what's most impactful):

  TECHNICAL APPROACH (at least 1 question):
  - Architecture pattern choice
  - Technology/library selection
  - Integration strategy
  - Error handling philosophy

  SCOPE BOUNDARIES (at least 1 question):
  - Must-have vs nice-to-have features
  - Edge cases: in or out?
  - MVP definition

  TRADE-OFFS (if complexity >= L):
  - Speed vs quality
  - Simplicity vs flexibility
  - Convention vs optimal

  RISKS & CONSTRAINTS (if RESEARCH flags risks):
  - Risk mitigation preference
  - Deadline/dependency impacts
  - Performance requirements

### Phase 3: Compile
After all questions answered, compile the interview results using your
[Nexus — Developer Interview] output format.

Return the compiled interview content.
```

Store the output as `$INTERVIEW`.

## Step 8: Write INTERVIEW.md

1. Ensure directory exists: `rpi/features/{slug}/plan/`
2. Write `rpi/features/{slug}/plan/INTERVIEW.md` with `$INTERVIEW` content, using this format:

```markdown
# Interview: {Feature Name}
Date: {current date}
Complexity: {$COMPLEXITY}
Questions: {N asked} / {$INTERVIEW_DEPTH planned}

{$INTERVIEW content organized by category:
- Technical Decisions (Q&A pairs with impact notes)
- Scope Boundaries (Q&A pairs with impact notes)
- Trade-offs (Q&A pairs with impact notes)
- Key Constraints Identified
- Open Items (flagged for agents)}

## Resolved Contradictions
(Populated by Step 14-15)
```

3. Output to user:
   ```
   Interview saved: rpi/features/{slug}/plan/INTERVIEW.md ({N} questions)
   ```

## Step 6: Launch Mestre — first pass (eng.md)

Launch Mestre agent with this prompt:

```
You are Mestre. Generate the engineering specification for feature: {slug}

## Request
{$REQUEST}

## Research
{$RESEARCH}

## Project Context
{$CONTEXT}

## Relevant Specs
{$RELEVANT_SPECS}

Your task:
1. Read the request and research findings carefully
2. Make technical decisions: approach, architecture, patterns to follow
3. Identify files to create, modify, and remove
4. List architectural risks with mitigations
5. Output using your eng.md format: [Mestre -- Engineering Specification]

Be pragmatic. Follow existing codebase patterns from context.md and research findings. No over-engineering.
```

Store the output as `$ENG_OUTPUT`.

## Step 7: Launch Clara — pm.md

Launch Clara agent with this prompt:

```
You are Clara. Generate the product specification for feature: {slug}

## Request
{$REQUEST}

## Research
{$RESEARCH}

## Project Context
{$CONTEXT}

Your task:
1. Define user stories with concrete acceptance criteria (Given/When/Then)
2. Classify requirements: must-have, nice-to-have, out-of-scope
3. Cut anything that doesn't map to the core problem in REQUEST.md
4. Define success metrics
5. Output using your pm.md format: [Clara -- Product Specification]

Be ruthless with scope. Every requirement must have acceptance criteria.
```

Store the output as `$PM_OUTPUT`.

## Step 8: Launch Pixel — ux.md (conditional)

Only if `$RUN_PIXEL` is `true`:

Launch Pixel agent with this prompt:

```
You are Pixel. Generate the UX specification for feature: {slug}

## Request
{$REQUEST}

## Research
{$RESEARCH}

## Project Context
{$CONTEXT}

## Engineering Specification
{$ENG_OUTPUT}

Your task:
1. Map the complete user flow from entry to completion
2. Define all states: empty, loading, error, success, edge cases
3. Identify accessibility requirements
4. Consider responsive behavior
5. Output using your ux.md format: [Pixel -- UX Specification]

Think from the user's perspective. If a flow needs a tooltip, the design failed.
```

Store the output as `$UX_OUTPUT`.

If `$RUN_PIXEL` is `false`: set `$UX_OUTPUT` to `"No UX specification — no frontend detected."`.

## Step 9: Launch Mestre — second pass (PLAN.md)

Launch Mestre agent to synthesize all specs into a concrete plan:

```
You are Mestre. Generate the implementation plan (PLAN.md) for feature: {slug}

## Engineering Specification
{$ENG_OUTPUT}

## Product Specification
{$PM_OUTPUT}

## UX Specification
{$UX_OUTPUT}

## Request
{$REQUEST}

## Research
{$RESEARCH}

## Project Context
{$CONTEXT}

Your task:
1. Read all specifications and synthesize into numbered tasks
2. Each task must have: effort estimate, file list, dependencies, test criteria
3. Tasks must be small enough for one commit each
4. Group tasks into phases where logical
5. Include metadata: total tasks, total files, overall complexity
6. Output using your PLAN.md format: [Mestre -- Implementation Plan]

Rules:
- Tasks are numbered (1.1, 1.2, 2.1, etc.)
- Every task lists exact files it touches
- Dependencies reference task IDs
- If Clara marked something as out-of-scope, don't create tasks for it
```

Store the output as `$PLAN_OUTPUT`.

## Step 10: Mestre generates delta specs

Launch Mestre agent to create delta specifications:

```
You are Mestre. Generate delta specs for feature: {slug}

## Implementation Plan
{$PLAN_OUTPUT}

## Engineering Specification
{$ENG_OUTPUT}

## Relevant Current Specs
{$RELEVANT_SPECS}

Your task:
1. Based on the plan, determine what specs need to change
2. For each new system component: create a spec in delta/ADDED/
3. For each existing spec that changes: create the updated version in delta/MODIFIED/
4. For any spec that becomes obsolete: create a marker in delta/REMOVED/
5. Delta specs capture ONLY what changes — not the entire system

Output the list of delta specs you will create, with their paths:
- delta/ADDED/{name}.md — {description}
- delta/MODIFIED/{name}.md — {description}
- delta/REMOVED/{name}.md — {description}

Then write each spec file.
```

## Step 11: Launch Nexus — coherence validation

Launch Nexus agent to validate coherence across all plan outputs:

```
You are Nexus. Validate coherence for feature: {slug}

## Engineering Specification (Mestre)
{$ENG_OUTPUT}

## Product Specification (Clara)
{$PM_OUTPUT}

## Implementation Plan (Mestre)
{$PLAN_OUTPUT}

## UX Specification (Pixel)
{$UX_OUTPUT}

Your task:
1. Check that every must-have requirement from Clara's pm.md has at least one task in PLAN.md
2. Check that every file in Mestre's eng.md appears in at least one PLAN.md task
3. Check that no PLAN.md task contradicts Clara's out-of-scope items
4. If Pixel's ux.md exists: check that UI flows have corresponding tasks
5. Flag any gaps, contradictions, or missing coverage

Output as: [Nexus -- Coherence Validation]

## Coherence Status
{PASS | PASS with gaps | FAIL}

## Coverage
- Requirements covered: {N}/{total}
- Files covered: {N}/{total}

## Issues Found
- {issue description} — Severity: {HIGH | MEDIUM | LOW}
(or "No issues found.")

## Recommendations
- {recommendation}
(or "Plan is coherent. Ready for implementation.")
```

If Nexus reports FAIL: output the issues to the user and suggest re-running `/rpi:plan {slug} --force`.

## Step 12: Write all artifacts

1. Ensure directory exists: `rpi/features/{slug}/plan/`
2. Write `rpi/features/{slug}/plan/eng.md` with `$ENG_OUTPUT`
3. Write `rpi/features/{slug}/plan/pm.md` with `$PM_OUTPUT`
4. If `$RUN_PIXEL` is `true`: write `rpi/features/{slug}/plan/ux.md` with `$UX_OUTPUT`
5. Write `rpi/features/{slug}/plan/PLAN.md` with `$PLAN_OUTPUT`
6. Ensure delta directories exist:
   ```bash
   mkdir -p rpi/features/{slug}/delta/ADDED
   mkdir -p rpi/features/{slug}/delta/MODIFIED
   mkdir -p rpi/features/{slug}/delta/REMOVED
   ```
7. Write delta spec files from Step 10 into the appropriate delta subdirectories.

## Step 13: Output summary

```
Plan complete: rpi/features/{slug}/plan/

Artifacts:
  - plan/eng.md     (Mestre — engineering spec)
  - plan/pm.md      (Clara — product spec)
  - plan/ux.md      (Pixel — UX spec)          ← only if frontend
  - plan/PLAN.md    (Mestre — implementation tasks)
  - delta/ADDED/    ({N} new specs)
  - delta/MODIFIED/ ({N} updated specs)
  - delta/REMOVED/  ({N} removed specs)

Tasks: {N} | Files: {N} | Complexity: {S|M|L|XL}
Coherence: {Nexus verdict}

Next: /rpi {slug}
Or explicitly: /rpi:implement {slug}
```
