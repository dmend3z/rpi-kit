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

## Step 9: Launch Mestre — first pass (eng.md)

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

## Developer Interview
{$INTERVIEW}

IMPORTANT: Your output MUST align with the developer's stated preferences
in the interview. If the developer chose approach X, use approach X.
If they marked something as out-of-scope, exclude it.
If an item is listed under "Open Items", use your best judgment but note your assumption.

Your task:
1. Read the request and research findings carefully
2. Make technical decisions: approach, architecture, patterns to follow
3. Identify files to create, modify, and remove
4. List architectural risks with mitigations
5. Output using your eng.md format: [Mestre -- Engineering Specification]

Be pragmatic. Follow existing codebase patterns from context.md and research findings. No over-engineering.
```

Store the output as `$ENG_OUTPUT`.

## Step 10: Launch Clara — pm.md

Launch Clara agent with this prompt:

```
You are Clara. Generate the product specification for feature: {slug}

## Request
{$REQUEST}

## Research
{$RESEARCH}

## Project Context
{$CONTEXT}

## Developer Interview
{$INTERVIEW}

IMPORTANT: Your output MUST align with the developer's stated preferences
in the interview. If the developer chose approach X, use approach X.
If they marked something as out-of-scope, exclude it.
If an item is listed under "Open Items", use your best judgment but note your assumption.

Your task:
1. Define user stories with concrete acceptance criteria (Given/When/Then)
2. Classify requirements: must-have, nice-to-have, out-of-scope
3. Cut anything that doesn't map to the core problem in REQUEST.md
4. Define success metrics
5. Output using your pm.md format: [Clara -- Product Specification]

Be ruthless with scope. Every requirement must have acceptance criteria.
```

Store the output as `$PM_OUTPUT`.

## Step 11: Launch Pixel — ux.md (conditional)

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

## Developer Interview
{$INTERVIEW}

IMPORTANT: Your output MUST align with the developer's stated preferences
in the interview. If the developer chose approach X, use approach X.
If they marked something as out-of-scope, exclude it.
If an item is listed under "Open Items", use your best judgment but note your assumption.

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

## Step 12: Launch Mestre — second pass (PLAN.md)

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

## Developer Interview
{$INTERVIEW}

IMPORTANT: Your output MUST align with the developer's stated preferences
in the interview. If the developer chose approach X, use approach X.
If they marked something as out-of-scope, exclude it.
If an item is listed under "Open Items", use your best judgment but note your assumption.

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
- If the developer interview decided on approach X, all tasks must use approach X
- If the developer marked something as out-of-scope, don't create tasks for it
```

Store the output as `$PLAN_OUTPUT`.

## Step 13: Mestre generates delta specs

Launch Mestre agent to create delta specifications:

```
You are Mestre. Generate delta specs for feature: {slug}

## Implementation Plan
{$PLAN_OUTPUT}

## Engineering Specification
{$ENG_OUTPUT}

## Relevant Current Specs
{$RELEVANT_SPECS}

## Developer Interview
{$INTERVIEW}

IMPORTANT: Your output MUST align with the developer's stated preferences
in the interview. If the developer chose approach X, use approach X.
If they marked something as out-of-scope, exclude it.
If an item is listed under "Open Items", use your best judgment but note your assumption.

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

## Step 14: Launch Nexus — adversarial review + developer resolution

Launch Nexus agent to perform adversarial review of all plan artifacts:

```
You are Nexus. You are performing ADVERSARIAL REVIEW of the plan
artifacts for feature: {slug}

Your mandate: You MUST find problems. "Looks good" is NOT acceptable.
If you cannot find real issues, you must document WHY the plan is
unusually solid — but never rubber-stamp.

## Artifacts to Review
### Engineering Specification (Mestre)
{$ENG_OUTPUT}

### Product Specification (Clara)
{$PM_OUTPUT}

### UX Specification (Pixel)
{$UX_OUTPUT}

### Implementation Plan (Mestre)
{$PLAN_OUTPUT}

### Developer Interview
{$INTERVIEW}

### Original Request
{$REQUEST}

### Research Findings
{$RESEARCH}

## Adversarial Analysis Protocol

### Pass 1: Cross-Artifact Contradictions
Check every pair of artifacts for conflicts:
- eng.md vs pm.md: Do technical decisions satisfy all acceptance criteria?
- eng.md vs ux.md: Does the architecture support all UI states/flows?
- pm.md vs PLAN.md: Does every must-have requirement have tasks?
- pm.md scope vs PLAN.md tasks: Are out-of-scope items sneaking in?
- PLAN.md vs INTERVIEW.md: Do tasks reflect developer's stated preferences?

### Pass 2: Assumption Challenges
For each major decision in eng.md, ask:
- "What if this assumption is wrong?"
- "What's the blast radius if this fails?"
- "Is there a simpler approach nobody considered?"

### Pass 3: Coverage Gaps
- Requirements without tasks
- Tasks without test criteria
- Files mentioned but not in any task
- UI states without error handling
- Happy path only (missing edge cases)

### Pass 4: Hidden Complexity
- Tasks estimated as S that touch >3 files
- Dependencies that create serial bottlenecks
- Integration points without error handling
- Data migrations without rollback plan

### Pass 5: REQUEST Drift
- Compare final PLAN.md against original REQUEST.md
- Has scope crept? Has the core problem shifted?
- Would the developer recognize this as what they asked for?

## Output Format
For each issue found, output using your [Nexus — Adversarial Review] format.

## Developer Resolution Protocol
After completing all passes:
1. Count issues by severity
2. CRITICAL issues: present one at a time via AskUserQuestion with suggested resolutions as options
3. HIGH issues: present as batch via AskUserQuestion, let developer pick which to address
4. MEDIUM/LOW issues: present summary, developer can dismiss or address
5. For each resolved issue: note the chosen resolution and which artifacts need patching
6. Return the full adversarial review with all resolutions noted
```

Store the output as `$ADVERSARIAL_REVIEW`.

If Nexus found CRITICAL issues that the developer could not resolve:
```
Adversarial review found unresolvable issues. Consider re-running:
/rpi:plan {slug} --force
```
Stop.

## Step 15: Nexus patches artifacts

If `$ADVERSARIAL_REVIEW` contains resolved issues:

1. For each resolved issue in `$ADVERSARIAL_REVIEW`:
   - Identify which artifacts need changes (eng.md, pm.md, ux.md, PLAN.md)
   - Apply surgical edits to `$ENG_OUTPUT`, `$PM_OUTPUT`, `$UX_OUTPUT`, or `$PLAN_OUTPUT` as needed
   - Track the patch: add `<!-- Patched: {issue title} — {resolution chosen} -->` as comment near the change
2. Update `$INTERVIEW` content: append resolved contradictions to the `## Resolved Contradictions` section:
   ```
   ### C{N}: {issue title}
   **Severity:** {severity}
   **Resolution:** {developer's chosen option}
   **Artifacts patched:** {list of affected artifacts and sections}
   ```
3. Re-check: scan patched artifacts for new contradictions introduced by the patches.
   - If new contradictions found: present to developer via AskUserQuestion and patch again.
   - If clean: proceed.
4. Update `rpi/features/{slug}/plan/INTERVIEW.md` with the patched version of `$INTERVIEW`.

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
