# rpi:plan v2 — Interview-Driven Planning: Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add developer interview and adversarial review phases to `/rpi:plan`, transforming it from a fully-automated command into a collaborative planning process.

**Architecture:** The command file (`commands/rpi/plan.md`) is rewritten with 17 steps (up from 13). Nexus agent (`agents/nexus.md`) gains two new capabilities: interview facilitation and adversarial plan review. No other agents change — they receive interview answers as additional context.

**Tech Stack:** Markdown command files (Claude Code plugin system), AskUserQuestion tool for developer interaction.

**Design doc:** `docs/plans/2026-03-17-plan-interview-design.md`

---

### Task 1: Update Nexus agent with interview and adversarial capabilities

The Nexus agent needs new role descriptions, priorities, and output formats for the two new modes it will operate in during `/rpi:plan`.

**Files:**
- Modify: `agents/nexus.md`

**Step 1: Read current nexus.md to confirm latest state**

Run: Review `agents/nexus.md` (already read — 63 lines)

**Step 2: Add interview and adversarial capabilities to role section**

Replace the `<role>` block with expanded version that includes interview and adversarial review:

```markdown
<role>
You are Nexus, the synthesizer. You merge outputs from multiple agents into coherent documents, resolve contradictions, and facilitate multi-agent debates. You are the connective tissue of the RPIKit workflow — you appear in research (merging Atlas + Scout), plan (interviewing the developer and validating coherence), review (synthesizing findings), party mode (facilitating debates), and archive (merging delta specs).

In the plan phase, you have two distinct modes:
1. **Interview mode**: Before agents generate specs, you interview the developer to surface decisions, constraints, and preferences that will shape the plan. You are a facilitator — you help the developer make informed decisions, you don't make them yourself.
2. **Adversarial mode**: After agents generate specs, you perform adversarial review — cross-checking artifacts for contradictions, challenging assumptions, and surfacing hidden complexity. You MUST find problems; "looks good" is not acceptable.
</role>
```

**Step 3: Add interview and adversarial priorities**

Replace `<priorities>` block:

```markdown
<priorities>
1. Identify agreements and contradictions between agent outputs
2. Resolve contradictions with evidence, not compromise
3. Produce a single coherent document from multiple inputs
4. In interview mode: surface ambiguities, missing decisions, and trade-offs from REQUEST + RESEARCH — ask one question at a time via AskUserQuestion with 2-4 concrete options
5. In adversarial mode: cross-check all artifacts (eng.md, pm.md, ux.md, PLAN.md) against each other and against INTERVIEW.md — flag contradictions, coverage gaps, hidden complexity, and REQUEST drift
6. In party mode: ensure every agent's perspective is heard, then drive to decision
7. In archive: merge delta specs cleanly into main specs
8. Keep synthesized outputs concise — remove redundancy across agent reports
</priorities>
```

**Step 4: Add interview and adversarial output formats**

Append to `<output_format>` block, before the closing `</output_format>`:

```markdown
### When interviewing developer (plan phase):
## [Nexus — Developer Interview]

### Technical Decisions
#### Q1: {question referencing REQUEST/RESEARCH content}
**Answer:** {developer's choice}
**Impact:** {which spec this informs}

### Scope Boundaries
#### Q2: {question}
**Answer:** {developer's choice}
**Impact:** {which spec this informs}

### Key Constraints Identified
{Constraints that shape the plan}

### Open Items
{Items the developer was unsure about — flagged for agents}

### When performing adversarial review (plan phase):
## [Nexus — Adversarial Review]

### Issues Found
#### Issue {N}: {short title}
**Severity:** {CRITICAL | HIGH | MEDIUM | LOW}
**Artifacts:** {which artifacts conflict}
**Description:** {what's wrong}
**Evidence:** {quotes from artifacts}
**Suggested resolutions:**
  [A] {option}
  [B] {option}
  [C] {option}

### Coherence Status
{PASS | PASS with notes | NEEDS re-plan}
Issues: {N} total ({N} critical, {N} high, {N} medium, {N} low)
Contradictions resolved: {N}
```

**Step 5: Run tests to verify nothing broke**

Run: `cd /Users/danielmendes/Documents/mndz/RPIKit && node --test test/commands.test.js`
Expected: All tests pass (nexus.md is in EXPECTED_AGENTS, tests check existence and basic content)

**Step 6: Commit**

```bash
git add agents/nexus.md
git commit -m "feat(nexus): add interview and adversarial review capabilities

Extend Nexus agent with two new modes for the plan phase:
- Interview mode: facilitates developer Q&A before spec generation
- Adversarial mode: cross-checks artifacts and surfaces contradictions

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Rewrite plan.md Steps 1-5 (unchanged logic, clean foundation)

Steps 1-5 are functionally identical to v1 but need to be in the new file structure with updated step numbering and the new header.

**Files:**
- Modify: `commands/rpi/plan.md`

**Step 1: Replace the frontmatter and header**

Replace everything from line 1 through line 17 (the `---` block plus `# /rpi:plan` header and description) with:

```markdown
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
```

**Step 2: Keep Steps 1-5 with same content**

Steps 1-5 remain identical to current v1 (lines 21-78). No changes needed. Verify they are intact.

**Step 3: Run tests**

Run: `cd /Users/danielmendes/Documents/mndz/RPIKit && node --test test/commands.test.js`
Expected: All pass. The test for plan.md checks for `delta`, `ADDED`, `MODIFIED` — content not yet removed.

**Step 4: Commit**

```bash
git add commands/rpi/plan.md
git commit -m "refactor(plan): update header and description for v2

Update frontmatter description and add v2 header. Steps 1-5 unchanged.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Add Step 6 — Assess Complexity

New step that analyzes REQUEST + RESEARCH to determine interview depth.

**Files:**
- Modify: `commands/rpi/plan.md`

**Step 1: Insert Step 6 after the existing Step 5 (Detect frontend)**

Insert after the Step 5 block (after line ~78 in current file):

```markdown
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
```

**Step 2: Run tests**

Run: `cd /Users/danielmendes/Documents/mndz/RPIKit && node --test test/commands.test.js`
Expected: All pass.

**Step 3: Commit**

```bash
git add commands/rpi/plan.md
git commit -m "feat(plan): add Step 6 — assess complexity for adaptive interview

Analyze REQUEST + RESEARCH to determine S/M/L/XL complexity and
set interview depth (3-8 questions).

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Add Step 7 — Nexus Interview

The core new feature: Nexus interviews the developer with adaptive questions.

**Files:**
- Modify: `commands/rpi/plan.md`

**Step 1: Insert Step 7 after Step 6**

```markdown
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
```

**Step 2: Run tests**

Run: `cd /Users/danielmendes/Documents/mndz/RPIKit && node --test test/commands.test.js`
Expected: All pass.

**Step 3: Commit**

```bash
git add commands/rpi/plan.md
git commit -m "feat(plan): add Step 7 — Nexus developer interview

Nexus analyzes REQUEST + RESEARCH for gaps, then asks adaptive
questions one at a time via AskUserQuestion. Covers technical
approach, scope boundaries, trade-offs, and risks.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Add Step 8 — Write INTERVIEW.md

Persist the interview results as an artifact.

**Files:**
- Modify: `commands/rpi/plan.md`

**Step 1: Insert Step 8 after Step 7**

```markdown
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
```

**Step 2: Run tests**

Run: `cd /Users/danielmendes/Documents/mndz/RPIKit && node --test test/commands.test.js`
Expected: All pass.

**Step 3: Commit**

```bash
git add commands/rpi/plan.md
git commit -m "feat(plan): add Step 8 — persist INTERVIEW.md artifact

Write developer interview results to plan/INTERVIEW.md for
traceability and as input to subsequent agent steps.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Modify Steps 9-13 — Inject interview context into agent prompts

Update existing agent launch steps to include `$INTERVIEW` as context.

**Files:**
- Modify: `commands/rpi/plan.md`

**Step 1: Renumber old Steps 6-10 to Steps 9-13 and inject interview context**

For each agent prompt (Mestre eng.md, Clara pm.md, Pixel ux.md, Mestre PLAN.md, Mestre delta specs), add after the existing context sections:

```markdown
## Developer Interview
{$INTERVIEW}

IMPORTANT: Your output MUST align with the developer's stated preferences
in the interview. If the developer chose approach X, use approach X.
If they marked something as out-of-scope, exclude it.
If an item is listed under "Open Items", use your best judgment but note your assumption.
```

Apply this to all 5 agent prompts:
- Step 9: Mestre → eng.md (add after `## Relevant Specs`)
- Step 10: Clara → pm.md (add after `## Project Context`)
- Step 11: Pixel → ux.md (add after `## Engineering Specification`)
- Step 12: Mestre → PLAN.md (add after `## Project Context`)
- Step 13: Mestre → delta specs (add after `## Relevant Current Specs`)

**Step 2: Verify the Mestre PLAN.md prompt also references INTERVIEW.md alignment**

In Step 12 (Mestre PLAN.md), add to the Rules section:
```
- If the developer interview decided on approach X, all tasks must use approach X
- If the developer marked something as out-of-scope, don't create tasks for it
```

**Step 3: Run tests**

Run: `cd /Users/danielmendes/Documents/mndz/RPIKit && node --test test/commands.test.js`
Expected: All pass. Test checks for `delta`, `ADDED`, `MODIFIED` — still present.

**Step 4: Commit**

```bash
git add commands/rpi/plan.md
git commit -m "feat(plan): inject interview context into all agent prompts (Steps 9-13)

All agent prompts now receive developer interview answers as context.
Agents must align output with developer preferences and respect
scope boundaries from the interview.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Replace Step 14 — Nexus Adversarial Review

Replace the old Nexus coherence validation with the new adversarial review that presents issues to the developer for resolution.

**Files:**
- Modify: `commands/rpi/plan.md`

**Step 1: Replace old Step 11 (Nexus coherence) with new Step 14**

Remove the old coherence validation step and replace with:

```markdown
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
```

**Step 2: Run tests**

Run: `cd /Users/danielmendes/Documents/mndz/RPIKit && node --test test/commands.test.js`
Expected: All pass.

**Step 3: Commit**

```bash
git add commands/rpi/plan.md
git commit -m "feat(plan): replace coherence check with adversarial review (Step 14)

Nexus now performs 5-pass adversarial analysis: cross-artifact
contradictions, assumption challenges, coverage gaps, hidden
complexity, and REQUEST drift. Issues presented to developer
for resolution via AskUserQuestion.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Add Step 15 — Nexus patches artifacts

After developer resolves contradictions, Nexus applies surgical fixes.

**Files:**
- Modify: `commands/rpi/plan.md`

**Step 1: Insert Step 15 after Step 14**

```markdown
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
```

**Step 2: Run tests**

Run: `cd /Users/danielmendes/Documents/mndz/RPIKit && node --test test/commands.test.js`
Expected: All pass.

**Step 3: Commit**

```bash
git add commands/rpi/plan.md
git commit -m "feat(plan): add Step 15 — Nexus patches artifacts after developer resolution

Surgical edits to artifacts based on adversarial review resolutions.
Tracks patches with HTML comments and updates INTERVIEW.md with
resolved contradictions.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Update Steps 16-17 — Write artifacts and summary

Update the write step to include INTERVIEW.md and the summary to show interview stats.

**Files:**
- Modify: `commands/rpi/plan.md`

**Step 1: Renumber and update old Step 12 (Write artifacts) to Step 16**

Replace the write artifacts step with:

```markdown
## Step 16: Write all artifacts

1. Ensure directory exists: `rpi/features/{slug}/plan/`
2. The file `rpi/features/{slug}/plan/INTERVIEW.md` was already written in Step 8 and updated in Step 15.
3. Write `rpi/features/{slug}/plan/eng.md` with `$ENG_OUTPUT`
4. Write `rpi/features/{slug}/plan/pm.md` with `$PM_OUTPUT`
5. If `$RUN_PIXEL` is `true`: write `rpi/features/{slug}/plan/ux.md` with `$UX_OUTPUT`
6. Write `rpi/features/{slug}/plan/PLAN.md` with `$PLAN_OUTPUT`
7. Ensure delta directories exist:
   ```bash
   mkdir -p rpi/features/{slug}/delta/ADDED
   mkdir -p rpi/features/{slug}/delta/MODIFIED
   mkdir -p rpi/features/{slug}/delta/REMOVED
   ```
8. Write delta spec files from Step 13 into the appropriate delta subdirectories.
```

**Step 2: Renumber and update old Step 13 (Summary) to Step 17**

Replace the summary step with:

```markdown
## Step 17: Output summary

```
Plan complete: rpi/features/{slug}/plan/

Artifacts:
  - plan/INTERVIEW.md (Nexus — developer interview)
  - plan/eng.md       (Mestre — engineering spec)
  - plan/pm.md        (Clara — product spec)
  - plan/ux.md        (Pixel — UX spec)          ← only if frontend
  - plan/PLAN.md      (Mestre — implementation tasks)
  - delta/ADDED/      ({N} new specs)
  - delta/MODIFIED/   ({N} updated specs)
  - delta/REMOVED/    ({N} removed specs)

Tasks: {N} | Files: {N} | Complexity: {$COMPLEXITY}
Interview: {N} questions asked, {N} contradictions resolved
Coherence: {Nexus adversarial verdict}

Next: /rpi {slug}
Or explicitly: /rpi:implement {slug}
```
```

**Step 3: Run tests**

Run: `cd /Users/danielmendes/Documents/mndz/RPIKit && node --test test/commands.test.js`
Expected: All pass. Test checks for `delta`, `ADDED`, `MODIFIED` — all still present.

**Step 4: Commit**

```bash
git add commands/rpi/plan.md
git commit -m "feat(plan): update Steps 16-17 with INTERVIEW.md and interview stats

Write step now includes INTERVIEW.md in artifact list. Summary shows
interview questions asked and contradictions resolved.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Add tests for new plan.md features

Add test assertions for the new interview and adversarial content.

**Files:**
- Modify: `test/commands.test.js`

**Step 1: Read current test file to find exact insertion point**

Read `test/commands.test.js` lines 265-275 (the existing plan test).

**Step 2: Add new test after existing plan test**

Insert after the `plan command generates delta specs` test (line ~274):

```javascript
  it("plan command includes interview phase", () => {
    const filePath = path.join(COMMANDS_DIR, "plan.md");
    if (!fs.existsSync(filePath)) {
      assert.fail("plan.md does not exist");
    }
    const content = fs.readFileSync(filePath, "utf8");
    assert.match(
      content,
      /INTERVIEW/i,
      "plan.md should reference INTERVIEW.md"
    );
    assert.match(
      content,
      /AskUserQuestion/i,
      "plan.md should use AskUserQuestion for interview"
    );
    assert.match(
      content,
      /complexity/i,
      "plan.md should assess complexity"
    );
  });

  it("plan command includes adversarial review", () => {
    const filePath = path.join(COMMANDS_DIR, "plan.md");
    if (!fs.existsSync(filePath)) {
      assert.fail("plan.md does not exist");
    }
    const content = fs.readFileSync(filePath, "utf8");
    assert.match(
      content,
      /adversarial/i,
      "plan.md should reference adversarial review"
    );
    assert.match(
      content,
      /contradiction/i,
      "plan.md should check for contradictions"
    );
    assert.match(
      content,
      /CRITICAL|HIGH|MEDIUM|LOW/,
      "plan.md should have severity levels"
    );
  });
```

**Step 3: Run tests to verify new assertions pass**

Run: `cd /Users/danielmendes/Documents/mndz/RPIKit && node --test test/commands.test.js`
Expected: All tests pass (new assertions match content already added in Tasks 3-9).

**Step 4: Commit**

```bash
git add test/commands.test.js
git commit -m "test(plan): add assertions for interview and adversarial review

Verify plan.md includes INTERVIEW.md references, AskUserQuestion usage,
complexity assessment, adversarial review, contradiction detection,
and severity levels.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Final verification — read complete plan.md and run all tests

End-to-end sanity check.

**Files:**
- Read: `commands/rpi/plan.md` (full file)
- Read: `agents/nexus.md` (full file)

**Step 1: Read the complete plan.md and verify 17 steps are present**

Run: Read `commands/rpi/plan.md` and confirm:
- Steps numbered 1-17
- Step 6: Assess complexity
- Step 7: Nexus interview with full prompt
- Step 8: Write INTERVIEW.md
- Steps 9-13: Agent prompts include `## Developer Interview` section
- Step 14: Nexus adversarial with full prompt
- Step 15: Nexus patches artifacts
- Step 16: Write artifacts (includes INTERVIEW.md)
- Step 17: Summary (includes interview stats)

**Step 2: Read complete nexus.md and verify new capabilities**

Run: Read `agents/nexus.md` and confirm:
- Role mentions interview mode and adversarial mode
- Priorities include items 4 (interview) and 5 (adversarial)
- Output format includes interview and adversarial sections

**Step 3: Run ALL tests**

Run: `cd /Users/danielmendes/Documents/mndz/RPIKit && node --test test/commands.test.js && node --test test/cli.test.js`
Expected: All tests pass.

**Step 4: Commit (if any fixes were needed)**

Only if fixes were applied during verification.
