# Quality Gates + Observability Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add self-validation quality gates to all 13 agents and activity logging to create an observability layer across the RPIKit pipeline.

**Architecture:** Each agent `.md` file gets a new `<quality_gate>` section with minimum criteria and ACTIVITY.md logging instructions. Commands are updated to instruct agents to log. `/rpi:status` is enhanced to read activity logs and display quality summaries.

**Tech Stack:** Markdown agent prompts, Node.js test runner (existing), Git

---

## Phase 1: Quality Gates in Agent Prompts

### Task 1: Add quality gate to Luna (agents/luna.md)

**Files:**
- Modify: `agents/luna.md`

**Step 1: Read luna.md**

Read `agents/luna.md` to confirm current structure.

**Step 2: Add quality gate section**

Append before `</output_format>` closing tag — add a new section after `</output_format>`:

```markdown
<quality_gate>
## Self-Validation (run before delivering output)

Check these criteria before finalizing REQUEST.md:

1. **Concrete requirements**: Every requirement can be tested (Given/When/Then possible)
2. **Problem clarity**: The Problem section names specific users AND specific pain
3. **Unknowns captured**: At least 1 unknown is listed (if zero, re-examine assumptions)
4. **Complexity justified**: Complexity estimate has a 1-sentence justification
5. **No vague language**: No "various", "etc.", "and more" in requirements

Score: count criteria met out of 5
- 5/5 → PASS
- 3-4/5 → WEAK (deliver with warning)
- 0-2/5 → FAIL (re-examine REQUEST.md, retry once)

Append to output:
```
Quality: {PASS|WEAK|FAIL} ({N}/5 criteria met)
```
</quality_gate>
```

**Step 3: Commit**

```bash
git add agents/luna.md
git commit -m "feat(agents): add quality gate to Luna"
```

---

### Task 2: Add quality gate to Atlas (agents/atlas.md)

**Files:**
- Modify: `agents/atlas.md`

**Step 1: Read atlas.md**

Read `agents/atlas.md` to confirm current structure.

**Step 2: Add quality gate section**

Append after `</output_format>`:

```markdown
<quality_gate>
## Self-Validation (run before delivering output)

Check these criteria before finalizing your analysis:

1. **Sufficient depth**: Analyzed ≥5 relevant source files (not just config files)
2. **Pattern identification**: Identified ≥2 naming/architecture patterns with file:line evidence
3. **Convention evidence**: Each convention claim cites a specific file:line example
4. **Specs checked**: Checked rpi/specs/ and rpi/solutions/ (even if empty, report that)
5. **Impact specificity**: Impact Assessment lists specific files, not vague areas

Score: count criteria met out of 5
- 5/5 → PASS
- 3-4/5 → WEAK (deliver with warning)
- 0-2/5 → FAIL (re-analyze with deeper file reads, retry once)

Append to output:
```
Quality: {PASS|WEAK|FAIL} ({N}/5 criteria met)
```
</quality_gate>
```

**Step 3: Commit**

```bash
git add agents/atlas.md
git commit -m "feat(agents): add quality gate to Atlas"
```

---

### Task 3: Add quality gate to Scout (agents/scout.md)

**Files:**
- Modify: `agents/scout.md`

**Step 1: Read scout.md**

Read `agents/scout.md` to confirm current structure.

**Step 2: Add quality gate section**

Append after `</output_format>`:

```markdown
<quality_gate>
## Self-Validation (run before delivering output)

Check these criteria before finalizing your investigation:

1. **External sources**: Found ≥2 external sources (docs, benchmarks, blog posts, GitHub)
2. **Alternatives compared**: Evaluated ≥2 alternatives with concrete pros/cons (not just "it depends")
3. **Risk specificity**: Each risk has severity AND a concrete mitigation (not "be careful")
4. **Solutions checked**: Checked rpi/solutions/ before external research (even if empty, report that)
5. **Project relevance**: Recommendations reference the specific project stack (not generic advice)

Score: count criteria met out of 5
- 5/5 → PASS
- 3-4/5 → WEAK (deliver with warning)
- 0-2/5 → FAIL (research more deeply, retry once)

Append to output:
```
Quality: {PASS|WEAK|FAIL} ({N}/5 criteria met)
```
</quality_gate>
```

**Step 3: Commit**

```bash
git add agents/scout.md
git commit -m "feat(agents): add quality gate to Scout"
```

---

### Task 4: Add quality gate to Nexus (agents/nexus.md)

**Files:**
- Modify: `agents/nexus.md`

**Step 1: Read nexus.md**

Read `agents/nexus.md` to confirm current structure.

**Step 2: Add quality gate section**

Append after `</output_format>`:

```markdown
<quality_gate>
## Self-Validation (run before delivering output)

Check these criteria based on your current mode:

### Synthesis mode (research):
1. **All inputs covered**: Every agent's output is referenced in the synthesis
2. **Contradictions explicit**: Disagreements named and resolved (not smoothed over)
3. **Evidence-based resolution**: Each resolution cites evidence, not just opinion
4. **Open questions concrete**: Open questions are specific enough to answer

### Interview mode (plan):
1. **Questions reference artifacts**: Each question cites specific content from REQUEST/RESEARCH
2. **Options concrete**: AskUserQuestion options are actionable choices, not vague
3. **Impact tracked**: Each answer notes which spec it informs
4. **Adaptive depth**: Follow-up questions respond to actual answers, not pre-scripted

### Adversarial mode (plan):
1. **Cross-artifact check**: Checked every artifact pair for contradictions
2. **Issues actionable**: Each issue has suggested resolutions as options
3. **Severity justified**: CRITICAL/HIGH classifications cite specific evidence
4. **No rubber stamp**: Found ≥1 issue (if zero, re-analyzed and documented WHY plan is solid)

Score: count criteria met out of 4 (mode-specific)
- 4/4 → PASS
- 2-3/4 → WEAK (deliver with warning)
- 0-1/4 → FAIL (re-analyze, retry once)

Append to output:
```
Quality: {PASS|WEAK|FAIL} ({N}/4 criteria met) [mode: {synthesis|interview|adversarial}]
```
</quality_gate>
```

**Step 3: Commit**

```bash
git add agents/nexus.md
git commit -m "feat(agents): add quality gate to Nexus"
```

---

### Task 5: Add quality gate to Mestre (agents/mestre.md)

**Files:**
- Modify: `agents/mestre.md`

**Step 1: Read mestre.md**

Read `agents/mestre.md` to confirm current structure.

**Step 2: Add quality gate section**

Append after `</output_format>`:

```markdown
<quality_gate>
## Self-Validation (run before delivering output)

Check these criteria before finalizing specs or plan:

### For eng.md:
1. **Decisions justified**: Every architecture decision names the rejected alternative and why
2. **File paths exact**: All file paths are concrete (no "somewhere in src/")
3. **Risks mitigated**: Each risk has a specific mitigation strategy
4. **Interview alignment**: Decisions match developer preferences from INTERVIEW.md

### For PLAN.md:
1. **Task granularity**: No task touches >5 files (split if it does)
2. **Acceptance criteria**: Every task has a test/verification step
3. **Dependencies explicit**: Every task declares deps or "none"
4. **Effort estimates present**: Every task has S/M/L effort estimate

Score: count criteria met out of 4 (per artifact)
- 4/4 → PASS
- 2-3/4 → WEAK (deliver with warning)
- 0-1/4 → FAIL (revise, retry once)

Append to output:
```
Quality: {PASS|WEAK|FAIL} ({N}/4 criteria met) [artifact: {eng.md|PLAN.md}]
```
</quality_gate>
```

**Step 3: Commit**

```bash
git add agents/mestre.md
git commit -m "feat(agents): add quality gate to Mestre"
```

---

### Task 6: Add quality gate to Clara (agents/clara.md)

**Files:**
- Modify: `agents/clara.md`

**Step 1: Read clara.md**

Read `agents/clara.md` to confirm current structure.

**Step 2: Add quality gate section**

Append after `</output_format>`:

```markdown
<quality_gate>
## Self-Validation (run before delivering output)

Check these criteria before finalizing pm.md:

1. **Testable criteria**: Every acceptance criterion uses Given/When/Then format
2. **Scope discipline**: At least 1 item is explicitly listed as "Out of Scope" with reason
3. **Must-have justified**: Every must-have traces back to a problem in REQUEST.md
4. **Success measurable**: At least 1 success metric has a concrete target (not "improved" or "better")
5. **Interview alignment**: Scope decisions match developer's stated preferences from INTERVIEW.md

Score: count criteria met out of 5
- 5/5 → PASS
- 3-4/5 → WEAK (deliver with warning)
- 0-2/5 → FAIL (revise scope, retry once)

Append to output:
```
Quality: {PASS|WEAK|FAIL} ({N}/5 criteria met)
```
</quality_gate>
```

**Step 3: Commit**

```bash
git add agents/clara.md
git commit -m "feat(agents): add quality gate to Clara"
```

---

### Task 7: Add quality gate to Pixel (agents/pixel.md)

**Files:**
- Modify: `agents/pixel.md`

**Step 1: Read pixel.md**

Read `agents/pixel.md` to confirm current structure.

**Step 2: Add quality gate section**

Append after `</output_format>`:

```markdown
<quality_gate>
## Self-Validation (run before delivering output)

Check these criteria before finalizing ux.md:

1. **Complete flow**: User flow covers entry → action → result → exit (no dead ends)
2. **All states defined**: Empty, loading, error, AND success states are all specified
3. **Error recovery**: Every error state has a recovery path described
4. **Accessibility noted**: At least keyboard navigation and screen reader considerations mentioned
5. **Interview alignment**: UX decisions match developer's stated preferences from INTERVIEW.md

Score: count criteria met out of 5
- 5/5 → PASS
- 3-4/5 → WEAK (deliver with warning)
- 0-2/5 → FAIL (revise flows, retry once)

Append to output:
```
Quality: {PASS|WEAK|FAIL} ({N}/5 criteria met)
```
</quality_gate>
```

**Step 3: Commit**

```bash
git add agents/pixel.md
git commit -m "feat(agents): add quality gate to Pixel"
```

---

### Task 8: Add quality gate to Forge (agents/forge.md)

**Files:**
- Modify: `agents/forge.md`

**Step 1: Read forge.md**

Read `agents/forge.md` to confirm current structure.

**Step 2: Add quality gate section**

Append after `</output_format>`:

```markdown
<quality_gate>
## Self-Validation (run before delivering output)

Check these criteria before reporting DONE:

1. **Context read**: CONTEXT_READ lists ≥1 file per target file (actually read, not assumed)
2. **Pattern match**: EXISTING_PATTERNS section is populated with observed conventions
3. **Tests verified**: Ran tests after implementation (or confirmed no test suite exists)
4. **Commit atomic**: Each commit covers exactly one task (not multiple tasks bundled)
5. **No scope creep**: Only files listed in the task were modified (extras reported as deviation)

Score: count criteria met out of 5
- 5/5 → PASS
- 3-4/5 → WEAK (deliver with warning)
- 0-2/5 → FAIL (review implementation, retry once)

Append to output:
```
Quality: {PASS|WEAK|FAIL} ({N}/5 criteria met)
```
</quality_gate>
```

**Step 3: Commit**

```bash
git add agents/forge.md
git commit -m "feat(agents): add quality gate to Forge"
```

---

### Task 9: Add quality gate to Sage (agents/sage.md)

**Files:**
- Modify: `agents/sage.md`

**Step 1: Read sage.md**

Read `agents/sage.md` to confirm current structure.

**Step 2: Add quality gate section**

Append after `</output_format>`:

```markdown
<quality_gate>
## Self-Validation (run before delivering output)

Check these criteria before finalizing your output:

### TDD mode (implement):
1. **Tests fail first**: Confirmed tests actually fail before implementation
2. **Coverage breadth**: Covered happy path + error path + ≥1 edge case
3. **One-thing-per-test**: Each test function tests exactly one behavior
4. **Descriptive names**: Test names describe the scenario, not the function

### Review mode:
1. **Full scan**: Checked ALL changed files for corresponding test files
2. **Specific gaps**: Missing tests name specific functions/scenarios, not vague areas
3. **Severity justified**: P1 (no tests at all) vs P2 (missing paths) vs P3 (edge cases) is correct
4. **Actionable suggestions**: Suggested tests describe concrete scenarios, not "add more tests"

Score: count criteria met out of 4 (mode-specific)
- 4/4 → PASS
- 2-3/4 → WEAK (deliver with warning)
- 0-1/4 → FAIL (re-analyze, retry once)

Append to output:
```
Quality: {PASS|WEAK|FAIL} ({N}/4 criteria met) [mode: {tdd|review}]
```
</quality_gate>
```

**Step 3: Commit**

```bash
git add agents/sage.md
git commit -m "feat(agents): add quality gate to Sage"
```

---

### Task 10: Add quality gate to Razor (agents/razor.md)

**Files:**
- Modify: `agents/razor.md`

**Step 1: Read razor.md**

Read `agents/razor.md` to confirm current structure.

**Step 2: Add quality gate section**

Append after `</output_format>`:

```markdown
<quality_gate>
## Self-Validation (run before delivering output)

Check these criteria before finalizing simplification:

1. **Behavior preserved**: Tests pass after changes (ran them, not assumed)
2. **All 3 dimensions checked**: Reported findings for reuse, quality, AND efficiency (even if "none found")
3. **Changes justified**: Every change has a "why" (not just "cleaned up")
4. **Metrics reported**: Lines removed/added count is concrete (not "several")
5. **No over-abstraction**: Did NOT extract a helper for <3 usages

Score: count criteria met out of 5
- 5/5 → PASS
- 3-4/5 → WEAK (deliver with warning)
- 0-2/5 → FAIL (review changes, retry once)

Append to output:
```
Quality: {PASS|WEAK|FAIL} ({N}/5 criteria met)
```
</quality_gate>
```

**Step 3: Commit**

```bash
git add agents/razor.md
git commit -m "feat(agents): add quality gate to Razor"
```

---

### Task 11: Add quality gate to Hawk (agents/hawk.md)

**Files:**
- Modify: `agents/hawk.md`

**Step 1: Read hawk.md**

Read `agents/hawk.md` to confirm current structure.

**Step 2: Add quality gate section**

Append after `</output_format>`:

```markdown
<quality_gate>
## Self-Validation (run before delivering output)

Check these criteria before finalizing your review:

1. **Non-zero findings**: Found ≥1 finding (if zero, re-analyzed from all 5 perspectives)
2. **File references**: Every finding cites specific file:line (not just file name)
3. **Severity accuracy**: P1 findings describe actual bugs/data-loss/security, not style issues
4. **Actionable fixes**: Every finding has a concrete fix suggestion (not "consider improving")
5. **All perspectives used**: Ultra-thinking covered developer + ops + user + security + business

Score: count criteria met out of 5
- 5/5 → PASS
- 3-4/5 → WEAK (deliver with warning)
- 0-2/5 → FAIL (re-review more carefully, retry once)

Append to output:
```
Quality: {PASS|WEAK|FAIL} ({N}/5 criteria met)
```
</quality_gate>
```

**Step 3: Commit**

```bash
git add agents/hawk.md
git commit -m "feat(agents): add quality gate to Hawk"
```

---

### Task 12: Add quality gate to Shield (agents/shield.md)

**Files:**
- Modify: `agents/shield.md`

**Step 1: Read shield.md**

Read `agents/shield.md` to confirm current structure.

**Step 2: Add quality gate section**

Append after `</output_format>`:

```markdown
<quality_gate>
## Self-Validation (run before delivering output)

Check these criteria before finalizing your audit:

1. **OWASP coverage**: Checked ≥5 OWASP categories (marked each PASS/FAIL/N/A)
2. **Secrets scanned**: Explicitly checked for hardcoded secrets, API keys, tokens
3. **Finding specificity**: Every finding cites file:line and describes the attack vector
4. **Risk-rated findings**: Each finding has likelihood AND impact (not just "this is bad")
5. **Dependency check**: Checked for known CVEs in dependencies (or stated "no new dependencies")

Score: count criteria met out of 5
- 5/5 → PASS
- 3-4/5 → WEAK (deliver with warning)
- 0-2/5 → FAIL (audit more thoroughly, retry once)

Append to output:
```
Quality: {PASS|WEAK|FAIL} ({N}/5 criteria met)
```
</quality_gate>
```

**Step 3: Commit**

```bash
git add agents/shield.md
git commit -m "feat(agents): add quality gate to Shield"
```

---

### Task 13: Add quality gate to Quill (agents/quill.md)

**Files:**
- Modify: `agents/quill.md`

**Step 1: Read quill.md**

Read `agents/quill.md` to confirm current structure.

**Step 2: Add quality gate section**

Append after `</output_format>`:

```markdown
<quality_gate>
## Self-Validation (run before delivering output)

Check these criteria before finalizing documentation:

1. **Accuracy**: Every code example compiles/runs (not pseudo-code)
2. **WHY not WHAT**: Comments explain reasoning, not restate code
3. **Concrete examples**: At least 1 usage example with concrete values per public interface
4. **Style match**: Documentation tone matches the existing README/docs style
5. **No filler**: No sentences that could be removed without losing information

Score: count criteria met out of 5
- 5/5 → PASS
- 3-4/5 → WEAK (deliver with warning)
- 0-2/5 → FAIL (revise docs, retry once)

Append to output:
```
Quality: {PASS|WEAK|FAIL} ({N}/5 criteria met)
```
</quality_gate>
```

**Step 3: Commit**

```bash
git add agents/quill.md
git commit -m "feat(agents): add quality gate to Quill"
```

---

## Phase 2: Activity Logging in Commands

### Task 14: Add ACTIVITY.md logging to /rpi:research

**Files:**
- Modify: `commands/rpi/research.md`

**Step 1: Read research.md**

Read `commands/rpi/research.md` to confirm current structure.

**Step 2: Add logging instructions to Atlas prompt (Step 4)**

In the Atlas agent prompt (Step 4), add at the end before the closing ```:

```
6. After your analysis, append your activity to {feature_dir}/ACTIVITY.md:

### {current_date} — Atlas (Research)
- **Action:** Codebase analysis for {slug}
- **Scope:** {list files you actually read}
- **Patterns found:** {count and summary}
- **Quality:** {your quality gate result}
```

**Step 3: Add logging instructions to Scout prompt (Step 4)**

In the Scout agent prompt (Step 4), add at the end before the closing ```:

```
7. After your investigation, append your activity to {feature_dir}/ACTIVITY.md:

### {current_date} — Scout (Research)
- **Action:** External research for {slug}
- **Sources consulted:** {count and list}
- **Recommendations:** {count and summary}
- **Quality:** {your quality gate result}
```

**Step 4: Add logging instructions to Nexus prompt (Step 7)**

In the Nexus synthesis prompt (Step 7), add at the end before the closing ```:

After synthesis, append your activity to {feature_dir}/ACTIVITY.md:

### {current_date} — Nexus (Research Synthesis)
- **Action:** Synthesized Atlas + Scout findings for {slug}
- **Consensus points:** {count}
- **Disagreements resolved:** {count}
- **Quality:** {your quality gate result}
```

**Step 5: Commit**

```bash
git add commands/rpi/research.md
git commit -m "feat(research): add ACTIVITY.md logging for Atlas, Scout, and Nexus"
```

---

### Task 15: Add ACTIVITY.md logging to /rpi:plan

**Files:**
- Modify: `commands/rpi/plan.md`

**Step 1: Read plan.md**

Read `commands/rpi/plan.md` to confirm current structure.

**Step 2: Add logging to Nexus interview prompt (Step 7)**

In the Nexus interview prompt, add at the end before the closing ```:

```
After the interview, append your activity to rpi/features/{slug}/ACTIVITY.md:

### {current_date} — Nexus (Plan Interview)
- **Action:** Developer interview for {slug}
- **Questions asked:** {count}
- **Key decisions:** {summary of decisions made}
- **Quality:** {your quality gate result}
```

**Step 3: Add logging to Mestre eng.md prompt (Step 9)**

In the Mestre eng.md prompt, add at the end before the closing ```:

```
After generating eng.md, append your activity to rpi/features/{slug}/ACTIVITY.md:

### {current_date} — Mestre (Plan — eng.md)
- **Action:** Engineering specification for {slug}
- **Architecture decisions:** {count}
- **Files planned:** {count create + modify}
- **Quality:** {your quality gate result}
```

**Step 4: Add logging to Clara prompt (Step 10)**

In the Clara pm.md prompt, add at the end before the closing ```:

```
After generating pm.md, append your activity to rpi/features/{slug}/ACTIVITY.md:

### {current_date} — Clara (Plan — pm.md)
- **Action:** Product specification for {slug}
- **User stories:** {count}
- **Acceptance criteria:** {count}
- **Scope cuts:** {count of out-of-scope items}
- **Quality:** {your quality gate result}
```

**Step 5: Add logging to Mestre PLAN.md prompt (Step 12)**

In the Mestre PLAN.md prompt, add at the end before the closing ```:

```
After generating PLAN.md, append your activity to rpi/features/{slug}/ACTIVITY.md:

### {current_date} — Mestre (Plan — PLAN.md)
- **Action:** Implementation plan for {slug}
- **Tasks:** {count}
- **Complexity:** {S|M|L|XL}
- **Quality:** {your quality gate result}
```

**Step 6: Add logging to Nexus adversarial prompt (Step 14)**

In the Nexus adversarial review prompt, add at the end before the closing ```:

```
After adversarial review, append your activity to rpi/features/{slug}/ACTIVITY.md:

### {current_date} — Nexus (Plan Adversarial Review)
- **Action:** Adversarial review for {slug}
- **Issues found:** {count by severity}
- **Contradictions resolved:** {count}
- **Coherence status:** {PASS|PASS with notes|NEEDS re-plan}
- **Quality:** {your quality gate result}
```

**Step 7: Commit**

```bash
git add commands/rpi/plan.md
git commit -m "feat(plan): add ACTIVITY.md logging for interview, specs, and review"
```

---

### Task 16: Add ACTIVITY.md logging to /rpi:implement

**Files:**
- Modify: `commands/rpi/implement.md`

**Step 1: Read implement.md**

Read `commands/rpi/implement.md` to confirm current structure.

**Step 2: Add logging to Forge prompt (Step 5b)**

In the Forge implementation prompt, add at the end before the closing ```:

```
After completing the task, append your activity to rpi/features/{slug}/ACTIVITY.md:

### {current_date} — Forge (Implement — Task {task_id})
- **Action:** Implemented task {task_id} for {slug}
- **Files changed:** {list}
- **Status:** {DONE|BLOCKED|DEVIATED}
- **Quality:** {your quality gate result}
```

**Step 3: Add logging to Sage TDD prompt (Step 5a, if TDD enabled)**

In the Sage TDD prompt, add at the end before the closing ```:

```
After writing tests, append your activity to rpi/features/{slug}/ACTIVITY.md:

### {current_date} — Sage (Implement — TDD for Task {task_id})
- **Action:** Wrote failing tests for task {task_id}
- **Tests written:** {count}
- **Edge cases covered:** {count}
- **Quality:** {your quality gate result}
```

**Step 4: Commit**

```bash
git add commands/rpi/implement.md
git commit -m "feat(implement): add ACTIVITY.md logging for Forge and Sage"
```

---

### Task 17: Add ACTIVITY.md logging to /rpi:simplify

**Files:**
- Modify: `commands/rpi/simplify.md`

**Step 1: Read simplify.md**

Read `commands/rpi/simplify.md` to confirm current structure.

**Step 2: Add logging to Razor prompt (Step 5)**

In the Razor simplification prompt, add at the end before the closing ```:

```
After simplification, append your activity to rpi/features/{slug}/ACTIVITY.md:

### {current_date} — Razor (Simplify)
- **Action:** Simplified implementation for {slug}
- **Reuse fixes:** {count}
- **Quality fixes:** {count}
- **Efficiency fixes:** {count}
- **Lines removed:** {count}
- **Quality:** {your quality gate result}
```

**Step 3: Commit**

```bash
git add commands/rpi/simplify.md
git commit -m "feat(simplify): add ACTIVITY.md logging for Razor"
```

---

### Task 18: Add ACTIVITY.md logging to /rpi:review

**Files:**
- Modify: `commands/rpi/review.md`

**Step 1: Read review.md**

Read `commands/rpi/review.md` to confirm current structure.

**Step 2: Add logging to Hawk prompt (Step 4)**

In the Hawk review prompt, add at the end before the closing ```:

```
After your review, append your activity to rpi/features/{slug}/ACTIVITY.md:

### {current_date} — Hawk (Review)
- **Action:** Adversarial code review for {slug}
- **Findings:** P1={count} P2={count} P3={count}
- **Perspectives covered:** {list of 5 perspectives}
- **Quality:** {your quality gate result}
```

**Step 3: Add logging to Shield prompt (Step 4)**

In the Shield security audit prompt, add at the end before the closing ```:

```
After your audit, append your activity to rpi/features/{slug}/ACTIVITY.md:

### {current_date} — Shield (Review)
- **Action:** Security audit for {slug}
- **Findings:** P1={count} P2={count} P3={count}
- **OWASP categories checked:** {count}
- **Quality:** {your quality gate result}
```

**Step 4: Add logging to Sage prompt (Step 4)**

In the Sage coverage check prompt, add at the end before the closing ```:

```
After your analysis, append your activity to rpi/features/{slug}/ACTIVITY.md:

### {current_date} — Sage (Review)
- **Action:** Test coverage analysis for {slug}
- **Untested modules:** {count}
- **Missing critical paths:** {count}
- **Missing edge cases:** {count}
- **Quality:** {your quality gate result}
```

**Step 5: Commit**

```bash
git add commands/rpi/review.md
git commit -m "feat(review): add ACTIVITY.md logging for Hawk, Shield, and Sage"
```

---

### Task 19: Add ACTIVITY.md logging to /rpi:docs

**Files:**
- Modify: `commands/rpi/docs.md`

**Step 1: Read docs.md**

Read `commands/rpi/docs.md` to confirm current structure.

**Step 2: Add logging to Quill prompt (Step 4)**

In the Quill documentation prompt, add at the end before the closing ```:

```
After documentation updates, append your activity to rpi/features/{slug}/ACTIVITY.md:

### {current_date} — Quill (Docs)
- **Action:** Documentation updates for {slug}
- **Files updated:** {list}
- **Changelog entry:** {yes|no}
- **Quality:** {your quality gate result}
```

**Step 3: Commit**

```bash
git add commands/rpi/docs.md
git commit -m "feat(docs): add ACTIVITY.md logging for Quill"
```

---

## Phase 3: Enhanced /rpi:status

### Task 20: Enhance /rpi:status with activity log reading and quality display

**Files:**
- Modify: `commands/rpi/status.md`

**Step 1: Read status.md**

Read `commands/rpi/status.md` to confirm current structure.

**Step 2: Add ACTIVITY.md reading to Step 4 (gather metadata)**

After the existing "Task progress" section in Step 4, add a new subsection:

```markdown
### Activity Log
- Read `{feature_dir}/ACTIVITY.md` if it exists.
- Extract the last 3 activity entries.
- Extract quality scores from all entries — build a quality summary per phase:
  - Research: {PASS|WEAK|FAIL|pending} (Atlas, Scout, Nexus scores)
  - Plan: {PASS|WEAK|FAIL|pending} (Nexus interview, Mestre, Clara, adversarial scores)
  - Implement: {PASS|WEAK|FAIL|pending} (Forge per-task scores)
  - Simplify: {PASS|WEAK|FAIL|pending} (Razor score)
  - Review: {PASS|WEAK|FAIL|pending} (Hawk, Shield, Sage, Nexus scores)
  - Docs: {PASS|WEAK|FAIL|pending} (Quill score)
- Identify any WEAK or FAIL scores for alerts.
- Extract last activity timestamp for "last activity" display.
```

**Step 3: Update overview mode display (Step 5)**

Replace the existing overview output format with:

```markdown
### If no specific feature requested (overview mode)

Output a status card per feature, sorted by phase (most advanced first):

```
# RPI Status

## {feature-slug}
Phase: {phase} {task_progress if applicable}
Verdict: {verdict}
Complexity: {complexity}
Last activity: {relative time, e.g. "2h ago" or "3 days ago"}
Quality: {phase_quality_summary, e.g. "Research PASS | Plan PASS | Implement 3/7"}

## {feature-slug-2}
Phase: {phase}
Verdict: {verdict}
Complexity: {complexity}
Last activity: {relative time}
Quality: {phase_quality_summary}

---
{total_count} feature(s) active
```

### Quality Alerts

After the feature cards, if any feature has WEAK or FAIL quality scores:

```
## Alerts

- {feature}: {phase} quality WEAK — {agent} ({reason from activity log})
  Suggestion: {actionable suggestion, e.g. "Re-run /rpi:research" or "Add context to REQUEST.md"}

- {feature}: {phase} quality FAIL — {agent} ({reason})
  Suggestion: {actionable suggestion}
```

If no alerts: omit this section entirely.
```

**Step 4: Update detailed mode display (Step 5)**

In the detailed mode section, add after "## Review":

```markdown
## Activity Log (last 5 entries)
{If ACTIVITY.md exists, show last 5 entries in reverse chronological order}
{If no ACTIVITY.md: "No activity log yet."}

## Quality Summary
{For each completed phase, show quality scores:}
- Research: Atlas {score} | Scout {score} | Nexus {score}
- Plan: Interview {score} | Mestre {score} | Clara {score} | Adversarial {score}
- Implement: {N}/{total} tasks, Forge avg quality {score}
- Simplify: Razor {score}
- Review: Hawk {score} | Shield {score} | Sage {score}
- Docs: Quill {score}

## Session Resume
Last activity: {timestamp and description of last logged action}
Next step: {suggest the next command based on current phase}
```

**Step 5: Commit**

```bash
git add commands/rpi/status.md
git commit -m "feat(status): display activity log, quality scores, and session resume context"
```

---

## Phase 4: Tests

### Task 21: Add test for quality gate sections in agents

**Files:**
- Modify: `test/commands.test.js`

**Step 1: Read commands.test.js**

Read `test/commands.test.js` to confirm current test structure.

**Step 2: Add quality gate test**

Add a new test inside the `RPIKit v2 — Agents` describe block, after the existing agent tests:

```javascript
it("all agents have a quality_gate section", () => {
  for (const agent of EXPECTED_AGENTS) {
    const filePath = path.join(AGENTS_DIR, `${agent}.md`);
    if (!fs.existsSync(filePath)) {
      assert.fail(`${agent}.md does not exist`);
    }
    const content = fs.readFileSync(filePath, "utf8");
    assert.match(
      content,
      /<quality_gate>/i,
      `${agent}.md must have a <quality_gate> section`
    );
    assert.match(
      content,
      /PASS|WEAK|FAIL/,
      `${agent}.md quality gate must define PASS/WEAK/FAIL scoring`
    );
  }
});
```

**Step 3: Add ACTIVITY.md reference test for phase commands**

Add a new test inside the `RPIKit v2 — Commands` describe block:

```javascript
it("phase commands reference ACTIVITY.md for logging", () => {
  const phaseCommands = [
    "research",
    "plan",
    "implement",
    "simplify",
    "review",
    "docs",
  ];

  for (const cmd of phaseCommands) {
    const filePath = path.join(COMMANDS_DIR, `${cmd}.md`);
    if (!fs.existsSync(filePath)) {
      assert.fail(`${cmd}.md does not exist`);
    }
    const content = fs.readFileSync(filePath, "utf8");
    assert.match(
      content,
      /ACTIVITY\.md/i,
      `${cmd}.md should reference ACTIVITY.md for logging`
    );
  }
});
```

**Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: All tests pass (existing 27 + 2 new = 29)

**Step 5: Commit**

```bash
git add test/commands.test.js
git commit -m "test: add assertions for quality gates and activity logging"
```

---

### Task 22: Run full test suite and verify

**Files:** None (verification only)

**Step 1: Run all tests**

Run: `npm test`
Expected: All 29 tests pass, 0 failures.

**Step 2: If any test fails**

- Read the error output
- Fix the issue in the relevant file
- Re-run tests
- Commit the fix

---

### Task 23: Bump version

**Files:**
- Modify: `package.json`
- Modify: `.claude-plugin/plugin.json`
- Modify: `.claude-plugin/marketplace.json`
- Modify: `marketplace.json` (root, if exists)

**Step 1: Read current versions**

Read `package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` to get current version.

**Step 2: Bump minor version**

Update version from current to next minor (e.g. 2.2.2 → 2.3.0) in all files.

**Step 3: Commit**

```bash
git add package.json .claude-plugin/plugin.json .claude-plugin/marketplace.json marketplace.json
git commit -m "chore: bump version to 2.3.0"
```
