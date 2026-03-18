# Design: rpi:plan v2 — Interview-Driven Planning

**Date:** 2026-03-17
**Status:** Approved
**Inspiration:** BMAD-METHOD (advanced elicitation, adversarial review, step-based interviews)

## Problem

The current `rpi:plan` command generates all artifacts (eng.md, pm.md, ux.md, PLAN.md) with zero developer interaction. Agents make all decisions based solely on REQUEST.md and RESEARCH.md. This leads to:

- Plans that don't reflect developer preferences or constraints
- Technical decisions made without consulting the person who'll implement them
- Contradictions between artifacts that go unresolved
- No mechanism to challenge assumptions or surface hidden complexity

## Solution

Add two interactive phases to `rpi:plan`:

1. **Nexus Interview** (before generation) — adaptive questions about technical approach, scope, trade-offs, and constraints
2. **Nexus Adversarial Review** (after generation) — contradiction detection with developer resolution

## New Flow (17 steps, up from 13)

```
Step  1: Load config & validate
Step  2: Check research verdict
Step  3: Check existing plan
Step  4: Gather context
Step  5: Detect frontend
Step  6: ★ Assess complexity (NEW)
Step  7: ★ Nexus interview (NEW — adaptive questions via AskUserQuestion)
Step  8: ★ Write INTERVIEW.md (NEW)
Step  9: Mestre → eng.md (receives INTERVIEW.md as input)
Step 10: Clara → pm.md (receives INTERVIEW.md as input)
Step 11: Pixel → ux.md (conditional, receives INTERVIEW.md as input)
Step 12: Mestre → PLAN.md (synthesis)
Step 13: Mestre → delta specs
Step 14: ★ Nexus adversarial + developer review (NEW — replaces simple coherence)
Step 15: ★ Nexus patches artifacts (NEW)
Step 16: Write all artifacts
Step 17: Output summary
```

## Step 6: Assess Complexity

Analyzes REQUEST + RESEARCH to determine interview depth.

**Input:** `$REQUEST`, `$RESEARCH`
**Output:** `$COMPLEXITY` (S|M|L|XL), `$INTERVIEW_DEPTH` (3-8 questions)

Logic:
- Count files affected in RESEARCH.md
- Check if involves new architecture vs modification
- Check if involves multiple systems/layers
- Check if RESEARCH flags risks or open questions

Mapping:
| Complexity | Files | Layers | Interview Depth |
|-----------|-------|--------|----------------|
| S | 1-3 | single | 3-4 questions |
| M | 4-8 | 1-2 | 4-5 questions |
| L | 9-15 | multiple | 5-6 questions |
| XL | 16+ | cross-cutting | 6-8 questions |

## Step 7: Nexus Interview

Nexus reads REQUEST + RESEARCH, analyzes gaps, and asks the developer adaptive questions.

### Nexus Interview Prompt

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
After all questions answered, compile INTERVIEW.md with format below.
Write to: rpi/features/{slug}/plan/INTERVIEW.md
```

## Step 8: INTERVIEW.md Format

```markdown
# Interview: {Feature Name}
Date: {date}
Complexity: {S|M|L|XL}
Questions: {N asked} / {N planned}

## Technical Decisions
### Q1: {question}
**Answer:** {developer answer}
**Impact:** Informs eng.md approach section

## Scope Boundaries
### Q2: {question}
**Answer:** {developer answer}
**Impact:** Informs pm.md must-have/out-of-scope

## Trade-offs
### Q3: {question}
**Answer:** {developer answer}
**Impact:** Shapes PLAN.md task ordering

## Key Constraints Identified
{Constraints that will shape the plan}

## Open Items
{Anything the developer said "I'm not sure" about — flagged for agents}

## Resolved Contradictions
(Populated later by Step 14-15)
```

## Steps 9-13: Agent Generation (modified)

Same as current v1, but each agent prompt now includes:

```
## Developer Interview
{$INTERVIEW — contents of INTERVIEW.md}

IMPORTANT: Your output MUST align with the developer's stated preferences
in the interview. If the developer chose approach X, use approach X.
If they marked something as out-of-scope, exclude it.
```

## Step 14: Nexus Adversarial Review

Replaces the current simple coherence validation (Step 11 in v1) with a deeper adversarial analysis.

### Nexus Adversarial Prompt

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
For each issue found:

### Issue {N}: {short title}
**Severity:** CRITICAL | HIGH | MEDIUM | LOW
**Artifacts:** {which artifacts are involved}
**Description:** {what's wrong}
**Evidence:** {quote from artifacts showing the contradiction}
**Suggested resolutions:**
  [A] {option}
  [B] {option}
  [C] {option}

## Developer Resolution Protocol
1. Count issues by severity
2. CRITICAL issues: present one at a time via AskUserQuestion
3. HIGH issues: present as batch, let developer pick which to address
4. MEDIUM/LOW: present summary, developer can dismiss or address
```

## Step 15: Nexus Patches Artifacts

After developer resolves each issue:
- Nexus applies surgical edits to affected artifacts
- Adds tracking comment: `<!-- Patched: {issue} — {resolution} -->`
- Updates INTERVIEW.md "Resolved Contradictions" section
- Re-runs Pass 1 (cross-artifact contradictions) on patched versions
- If new contradictions introduced by patches: flags them

## Steps 16-17: Write & Summary (same as v1)

Same as current steps 12-13, with INTERVIEW.md added to artifact list.

Output summary updated:
```
Plan complete: rpi/features/{slug}/plan/

Artifacts:
  - plan/INTERVIEW.md (Nexus — developer interview)     ← NEW
  - plan/eng.md       (Mestre — engineering spec)
  - plan/pm.md        (Clara — product spec)
  - plan/ux.md        (Pixel — UX spec)                  ← only if frontend
  - plan/PLAN.md      (Mestre — implementation tasks)
  - delta/ADDED/      ({N} new specs)
  - delta/MODIFIED/   ({N} updated specs)
  - delta/REMOVED/    ({N} removed specs)

Tasks: {N} | Files: {N} | Complexity: {S|M|L|XL}
Interview: {N} questions asked, {N} contradictions resolved
Coherence: {Nexus adversarial verdict}

Next: /rpi {slug}
```

## Files to Modify

1. `commands/rpi/plan.md` — rewrite with new 17-step flow
2. `agents/nexus.md` — add interview and adversarial capabilities to persona/priorities

## Files Unchanged

- `agents/mestre.md` — receives INTERVIEW.md as context, no agent changes needed
- `agents/clara.md` — receives INTERVIEW.md as context, no agent changes needed
- `agents/pixel.md` — receives INTERVIEW.md as context, no agent changes needed

## Design Decisions

| Decision | Chosen | Rejected | Reason |
|----------|--------|----------|--------|
| Interview timing | Before generation | After (draft+challenge) | Developer preferences shape the plan, not just fix it |
| Facilitator | Nexus | Each agent / New agent | Nexus already synthesizes; adding interview is natural extension |
| Question count | Adaptive (3-8) | Fixed 5 | Simple features shouldn't tax the developer; complex ones need depth |
| Contradiction resolution | Nexus patches | Agents re-generate | Faster, fewer tokens, surgical fixes |
| Interview persistence | INTERVIEW.md file | Context only | Traceability, reference for implementation phase |
