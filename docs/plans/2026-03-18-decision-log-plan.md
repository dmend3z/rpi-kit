# Decision Log Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add automatic decision logging to the RPI workflow — agents emit `<decision>` tags, commands extract them into ACTIVITY.md and DECISIONS.md, `/rpi:status` shows a Key Decisions section.

**Architecture:** Each of the 13 agents gets an identical `<decision_logging>` section between `<output_format>` and `<quality_gate>`. Each of the 6 phase commands gets a consolidation step that extracts `<decision>` tags and writes DECISIONS.md. The `/rpi:status` command gets a new section that reads DECISIONS.md.

**Tech Stack:** Markdown (agent/command files), Node.js test runner (`node:test`)

---

### Task 1: Add `<decision_logging>` to Atlas

**Files:**
- Modify: `agents/atlas.md:61` (between `</output_format>` and `<quality_gate>`)

**Step 1: Read the file**

Read `agents/atlas.md` to confirm the exact insertion point.

**Step 2: Insert the `<decision_logging>` section**

Insert after line 61 (`</output_format>`) and before line 63 (`<quality_gate>`):

```markdown

<decision_logging>
When you make a choice with rationale — choosing one approach over others, scoping in/out, accepting/rejecting, or recommending with trade-offs — emit a <decision> tag inline in your output:

<decision>
type: {approach|scope|architecture|verdict|deviation|tradeoff|pattern}
summary: {one line — what was decided}
alternatives: {what was rejected, or "none" if no alternatives considered}
rationale: {why this choice}
impact: {HIGH|MEDIUM|LOW}
</decision>

Guidelines:
- Emit a tag for every choice where you considered alternatives or where the "why" matters
- Don't tag obvious/mechanical actions (reading a file, running a command)
- HIGH = changes project direction; MEDIUM = shapes implementation; LOW = minor preference
- Multiple tags per output are fine — one per distinct decision
</decision_logging>
```

**Step 3: Verify structure**

Confirm the file has sections in this order: `<output_format>` → `<decision_logging>` → `<quality_gate>`.

**Step 4: Commit**

```bash
git add agents/atlas.md
git commit -m "feat(atlas): add decision logging section"
```

---

### Task 2: Add `<decision_logging>` to remaining 12 agents

**Files:**
- Modify: `agents/scout.md` (insert between `</output_format>` line 49 and `<quality_gate>` line 51)
- Modify: `agents/nexus.md` (insert between `</output_format>` line 107 and `<quality_gate>` line 109)
- Modify: `agents/mestre.md` (insert between `</output_format>` line 61 and `<quality_gate>` line 63)
- Modify: `agents/clara.md` (insert between `</output_format>` line 49 and `<quality_gate>` line 51)
- Modify: `agents/pixel.md` (insert between `</output_format>` line 48 and `<quality_gate>` line 50)
- Modify: `agents/forge.md` (insert between `</output_format>` line 38 and `<quality_gate>` line 40)
- Modify: `agents/sage.md` (insert between `</output_format>` line 52 and `<quality_gate>` line 54)
- Modify: `agents/hawk.md` (insert between `</output_format>` line 54 and `<quality_gate>` line 56)
- Modify: `agents/shield.md` (insert between `</output_format>` line 51 and `<quality_gate>` line 53)
- Modify: `agents/razor.md` (insert between `</output_format>` line 41 and `<quality_gate>` line 43)
- Modify: `agents/quill.md` (insert between `</output_format>` line 40 and `<quality_gate>` line 42)
- Modify: `agents/luna.md` (insert between `</output_format>` line 50 and `<quality_gate>` line 52)

**Step 1: Insert the identical `<decision_logging>` section into each agent**

Use the exact same block from Task 1. Insert between `</output_format>` and `<quality_gate>` in each file.

**Step 2: Verify all 12 files have the section in the correct order**

For each file, confirm: `<output_format>` → `<decision_logging>` → `<quality_gate>`.

**Step 3: Commit**

```bash
git add agents/scout.md agents/nexus.md agents/mestre.md agents/clara.md agents/pixel.md agents/forge.md agents/sage.md agents/hawk.md agents/shield.md agents/razor.md agents/quill.md agents/luna.md
git commit -m "feat(agents): add decision logging to all 12 remaining agents"
```

---

### Task 3: Add test for `<decision_logging>` in agents

**Files:**
- Modify: `test/commands.test.js` (add new test after the `quality_gate` test at line ~260)

**Step 1: Write the failing test**

Add this test inside the `"RPIKit v2 — Agents"` describe block, after the quality_gate test:

```javascript
  it("all agents have a decision_logging section", () => {
    for (const agent of EXPECTED_AGENTS) {
      const filePath = path.join(AGENTS_DIR, `${agent}.md`);
      if (!fs.existsSync(filePath)) {
        assert.fail(`${agent}.md does not exist`);
      }
      const content = fs.readFileSync(filePath, "utf8");
      assert.match(
        content,
        /<decision_logging>/i,
        `${agent}.md must have a <decision_logging> section`
      );
    }
  });
```

**Step 2: Run test to verify it passes**

Run: `node --test test/commands.test.js`
Expected: PASS (since Tasks 1 and 2 already added the sections)

**Step 3: Commit**

```bash
git add test/commands.test.js
git commit -m "test(agents): add assertion for decision_logging section"
```

---

### Task 4: Enrich ACTIVITY.md templates in research command + add consolidation step

**Files:**
- Modify: `commands/rpi/research.md`

**Step 1: Read the file to confirm current ACTIVITY.md templates**

Read `commands/rpi/research.md`.

**Step 2: Update Atlas's ACTIVITY.md template (lines 79-86)**

Replace the Atlas ACTIVITY.md block with:

```
6. After your analysis, append your activity to rpi/features/{slug}/ACTIVITY.md:

### {current_date} — Atlas (Research)
- **Action:** Codebase analysis for {slug}
- **Scope:** {list files you actually read}
- **Key decisions:** {for each <decision> tag you emitted: summary (rationale), separated by semicolons. If none: "No decisions in this phase."}
- **Patterns found:** {count and summary}
- **Quality:** {your quality gate result}
```

**Step 3: Update Scout's ACTIVITY.md template (lines 112-119)**

Replace the Scout ACTIVITY.md block with:

```
7. After your investigation, append your activity to rpi/features/{slug}/ACTIVITY.md:

### {current_date} — Scout (Research)
- **Action:** External research for {slug}
- **Key decisions:** {for each <decision> tag you emitted: summary (rationale), separated by semicolons. If none: "No decisions in this phase."}
- **Sources consulted:** {count and list}
- **Recommendations:** {count and summary}
- **Quality:** {your quality gate result}
```

**Step 4: Update Nexus synthesis ACTIVITY.md template (lines 215-222)**

Replace the Nexus ACTIVITY.md block with:

```
After synthesis, append your activity to rpi/features/{slug}/ACTIVITY.md:

### {current_date} — Nexus (Research Synthesis)
- **Action:** Synthesized Atlas + Scout findings for {slug}
- **Key decisions:** {for each <decision> tag you emitted: summary (rationale), separated by semicolons. If none: "No decisions in this phase."}
- **Consensus points:** {count}
- **Disagreements resolved:** {count}
- **Quality:** {your quality gate result}
```

**Step 5: Add consolidation step**

After Step 8 (Write RESEARCH.md), insert a new step before Step 9:

```markdown
## Step 9: Consolidate decisions to DECISIONS.md

1. Read `rpi/features/{slug}/ACTIVITY.md`.
2. Extract all `<decision>` tags from entries belonging to the Research phase (Atlas, Scout, Nexus entries).
3. If no decisions found, skip this step.
4. Write or append to `rpi/features/{slug}/DECISIONS.md`:

```markdown
# Decision Log — {slug}

## Research Phase
_Generated: {current_date}_

| # | Type | Decision | Alternatives | Rationale | Impact |
|---|------|----------|-------------|-----------|--------|
| {N} | {type} | {summary} | {alternatives} | {rationale} | {impact} |
```

5. Number decisions sequentially starting from 1.
```

Renumber the old Step 9 to Step 10.

**Step 6: Commit**

```bash
git add commands/rpi/research.md
git commit -m "feat(research): enrich ACTIVITY.md templates and add DECISIONS.md consolidation"
```

---

### Task 5: Enrich ACTIVITY.md templates in plan command + add consolidation step

**Files:**
- Modify: `commands/rpi/plan.md`

**Step 1: Read the file**

Read `commands/rpi/plan.md`.

**Step 2: Update Nexus interview ACTIVITY.md template (around line 182-189)**

Add `- **Key decisions:**` field after `- **Action:**`:

```
### {current_date} — Nexus (Plan Interview)
- **Action:** Developer interview for {slug}
- **Key decisions:** {for each <decision> tag you emitted: summary (rationale), separated by semicolons. If none: "No decisions in this phase."}
- **Questions asked:** {count}
- **Quality:** {your quality gate result}
```

**Step 3: Update Mestre eng.md ACTIVITY.md template (around line 256-263)**

Add `- **Key decisions:**` field:

```
### {current_date} — Mestre (Plan — eng.md)
- **Action:** Engineering specification for {slug}
- **Key decisions:** {for each <decision> tag you emitted: summary (rationale), separated by semicolons. If none: "No decisions in this phase."}
- **Architecture decisions:** {count}
- **Files planned:** {count create + modify}
- **Quality:** {your quality gate result}
```

**Step 4: Update Clara pm.md ACTIVITY.md template (around line 300-308)**

Add `- **Key decisions:**` field:

```
### {current_date} — Clara (Plan — pm.md)
- **Action:** Product specification for {slug}
- **Key decisions:** {for each <decision> tag you emitted: summary (rationale), separated by semicolons. If none: "No decisions in this phase."}
- **User stories:** {count}
- **Acceptance criteria:** {count}
- **Scope cuts:** {count of out-of-scope items}
- **Quality:** {your quality gate result}
```

**Step 5: Update Mestre PLAN.md ACTIVITY.md template (around line 404-411)**

Add `- **Key decisions:**` field:

```
### {current_date} — Mestre (Plan — PLAN.md)
- **Action:** Implementation plan for {slug}
- **Key decisions:** {for each <decision> tag you emitted: summary (rationale), separated by semicolons. If none: "No decisions in this phase."}
- **Tasks:** {count}
- **Complexity:** {S|M|L|XL}
- **Quality:** {your quality gate result}
```

**Step 6: Update Nexus adversarial review ACTIVITY.md template (around line 534-542)**

Add `- **Key decisions:**` field:

```
### {current_date} — Nexus (Plan Adversarial Review)
- **Action:** Adversarial review for {slug}
- **Key decisions:** {for each <decision> tag you emitted: summary (rationale), separated by semicolons. If none: "No decisions in this phase."}
- **Issues found:** {count by severity}
- **Contradictions resolved:** {count}
- **Coherence status:** {PASS|PASS with notes|NEEDS re-plan}
- **Quality:** {your quality gate result}
```

**Step 7: Add consolidation step**

After Step 16 (Write all artifacts), insert a new step before Step 17:

```markdown
## Step 17: Consolidate decisions to DECISIONS.md

1. Read `rpi/features/{slug}/ACTIVITY.md`.
2. Extract all `<decision>` tags from entries belonging to the Plan phase (Nexus interview, Mestre eng.md, Clara, Mestre PLAN.md, Nexus adversarial entries).
3. If no decisions found, skip this step.
4. Read `rpi/features/{slug}/DECISIONS.md` if it exists (to get the last decision number).
5. Append a new section:

```markdown
## Plan Phase
_Generated: {current_date}_

| # | Type | Decision | Alternatives | Rationale | Impact |
|---|------|----------|-------------|-----------|--------|
| {N} | {type} | {summary} | {alternatives} | {rationale} | {impact} |
```

6. Number decisions sequentially, continuing from the last number in DECISIONS.md.
```

Renumber the old Step 17 to Step 18.

**Step 8: Commit**

```bash
git add commands/rpi/plan.md
git commit -m "feat(plan): enrich ACTIVITY.md templates and add DECISIONS.md consolidation"
```

---

### Task 6: Enrich ACTIVITY.md templates in implement command + add consolidation step

**Files:**
- Modify: `commands/rpi/implement.md`

**Step 1: Update Sage TDD ACTIVITY.md template (around line 123-130)**

Add `- **Key decisions:**` field:

```
### {current_date} — Sage (Implement — TDD for Task {task_id})
- **Action:** Wrote failing tests for task {task_id}
- **Key decisions:** {for each <decision> tag you emitted: summary (rationale), separated by semicolons. If none: "No decisions in this phase."}
- **Tests written:** {count}
- **Edge cases covered:** {count}
- **Quality:** {your quality gate result}
```

**Step 2: Update Forge ACTIVITY.md template (around line 167-174)**

Add `- **Key decisions:**` field:

```
### {current_date} — Forge (Implement — Task {task_id})
- **Action:** Implemented task {task_id} for {slug}
- **Key decisions:** {for each <decision> tag you emitted: summary (rationale), separated by semicolons. If none: "No decisions in this phase."}
- **Files changed:** {list}
- **Status:** {DONE|BLOCKED|DEVIATED}
- **Quality:** {your quality gate result}
```

**Step 3: Add consolidation step**

After Step 6 (Completion summary), insert a new step before the final IMPLEMENT.md update:

```markdown
## Step 7: Consolidate decisions to DECISIONS.md

1. Read `rpi/features/{slug}/ACTIVITY.md`.
2. Extract all `<decision>` tags from entries belonging to the Implement phase (Sage and Forge entries).
3. If no decisions found, skip this step.
4. Read `rpi/features/{slug}/DECISIONS.md` if it exists (to get the last decision number).
5. Append a new section:

```markdown
## Implement Phase
_Generated: {current_date}_

| # | Type | Decision | Alternatives | Rationale | Impact |
|---|------|----------|-------------|-----------|--------|
| {N} | {type} | {summary} | {alternatives} | {rationale} | {impact} |
```

6. Number decisions sequentially, continuing from the last number in DECISIONS.md.
```

**Step 4: Commit**

```bash
git add commands/rpi/implement.md
git commit -m "feat(implement): enrich ACTIVITY.md templates and add DECISIONS.md consolidation"
```

---

### Task 7: Enrich ACTIVITY.md templates in review command + add consolidation step

**Files:**
- Modify: `commands/rpi/review.md`

**Step 1: Update Hawk ACTIVITY.md template (around line 112-119)**

Add `- **Key decisions:**` field:

```
### {current_date} — Hawk (Review)
- **Action:** Adversarial code review for {slug}
- **Key decisions:** {for each <decision> tag you emitted: summary (rationale), separated by semicolons. If none: "No decisions in this phase."}
- **Findings:** P1={count} P2={count} P3={count}
- **Perspectives covered:** {list of 5 perspectives}
- **Quality:** {your quality gate result}
```

**Step 2: Update Shield ACTIVITY.md template (around line 190-197)**

Add `- **Key decisions:**` field:

```
### {current_date} — Shield (Review)
- **Action:** Security audit for {slug}
- **Key decisions:** {for each <decision> tag you emitted: summary (rationale), separated by semicolons. If none: "No decisions in this phase."}
- **Findings:** P1={count} P2={count} P3={count}
- **OWASP categories checked:** {count}
- **Quality:** {your quality gate result}
```

**Step 3: Update Sage review ACTIVITY.md template (around line 262-269)**

Add `- **Key decisions:**` field:

```
### {current_date} — Sage (Review)
- **Action:** Test coverage analysis for {slug}
- **Key decisions:** {for each <decision> tag you emitted: summary (rationale), separated by semicolons. If none: "No decisions in this phase."}
- **Untested modules:** {count}
- **Missing critical paths:** {count}
- **Missing edge cases:** {count}
- **Quality:** {your quality gate result}
```

**Step 4: Add consolidation step**

After Step 9 (Update IMPLEMENT.md), insert a new step before Step 10:

```markdown
## Step 10: Consolidate decisions to DECISIONS.md

1. Read `rpi/features/{slug}/ACTIVITY.md`.
2. Extract all `<decision>` tags from entries belonging to the Review phase (Hawk, Shield, Sage entries).
3. If no decisions found, skip this step.
4. Read `rpi/features/{slug}/DECISIONS.md` if it exists (to get the last decision number).
5. Append a new section:

```markdown
## Review Phase
_Generated: {current_date}_

| # | Type | Decision | Alternatives | Rationale | Impact |
|---|------|----------|-------------|-----------|--------|
| {N} | {type} | {summary} | {alternatives} | {rationale} | {impact} |
```

6. Number decisions sequentially, continuing from the last number in DECISIONS.md.
```

Renumber old Step 10 to Step 11.

**Step 5: Commit**

```bash
git add commands/rpi/review.md
git commit -m "feat(review): enrich ACTIVITY.md templates and add DECISIONS.md consolidation"
```

---

### Task 8: Enrich ACTIVITY.md template in simplify command + add consolidation step

**Files:**
- Modify: `commands/rpi/simplify.md`

**Step 1: Update Razor ACTIVITY.md template (around line 126-135)**

Add `- **Key decisions:**` field:

```
### {current_date} — Razor (Simplify)
- **Action:** Simplified implementation for {slug}
- **Key decisions:** {for each <decision> tag you emitted: summary (rationale), separated by semicolons. If none: "No decisions in this phase."}
- **Reuse fixes:** {count}
- **Quality fixes:** {count}
- **Efficiency fixes:** {count}
- **Lines removed:** {count}
- **Quality:** {your quality gate result}
```

**Step 2: Add consolidation step**

After Step 8 (Update IMPLEMENT.md), insert a new step before Step 9:

```markdown
## Step 9: Consolidate decisions to DECISIONS.md

1. Read `rpi/features/{slug}/ACTIVITY.md`.
2. Extract all `<decision>` tags from entries belonging to the Simplify phase (Razor entries).
3. If no decisions found, skip this step.
4. Read `rpi/features/{slug}/DECISIONS.md` if it exists (to get the last decision number).
5. Append a new section:

```markdown
## Simplify Phase
_Generated: {current_date}_

| # | Type | Decision | Alternatives | Rationale | Impact |
|---|------|----------|-------------|-----------|--------|
| {N} | {type} | {summary} | {alternatives} | {rationale} | {impact} |
```

6. Number decisions sequentially, continuing from the last number in DECISIONS.md.
```

Renumber old Step 9 to Step 10.

**Step 3: Commit**

```bash
git add commands/rpi/simplify.md
git commit -m "feat(simplify): enrich ACTIVITY.md template and add DECISIONS.md consolidation"
```

---

### Task 9: Enrich ACTIVITY.md template in docs command + add consolidation step

**Files:**
- Modify: `commands/rpi/docs.md`

**Step 1: Update Quill ACTIVITY.md template (around line 113-120)**

Add `- **Key decisions:**` field:

```
### {current_date} — Quill (Docs)
- **Action:** Documentation updates for {slug}
- **Key decisions:** {for each <decision> tag you emitted: summary (rationale), separated by semicolons. If none: "No decisions in this phase."}
- **Files updated:** {list}
- **Changelog entry:** {yes|no}
- **Quality:** {your quality gate result}
```

**Step 2: Add consolidation step**

After Step 5 (Commit documentation changes), insert a new step before Step 6:

```markdown
## Step 6: Consolidate decisions to DECISIONS.md

1. Read `rpi/features/{slug}/ACTIVITY.md`.
2. Extract all `<decision>` tags from entries belonging to the Docs phase (Quill entries).
3. If no decisions found, skip this step.
4. Read `rpi/features/{slug}/DECISIONS.md` if it exists (to get the last decision number).
5. Append a new section:

```markdown
## Docs Phase
_Generated: {current_date}_

| # | Type | Decision | Alternatives | Rationale | Impact |
|---|------|----------|-------------|-----------|--------|
| {N} | {type} | {summary} | {alternatives} | {rationale} | {impact} |
```

6. Number decisions sequentially, continuing from the last number in DECISIONS.md.
```

Renumber old Step 6 to Step 7.

**Step 3: Commit**

```bash
git add commands/rpi/docs.md
git commit -m "feat(docs): enrich ACTIVITY.md template and add DECISIONS.md consolidation"
```

---

### Task 10: Add Key Decisions section to `/rpi:status`

**Files:**
- Modify: `commands/rpi/status.md`

**Step 1: Read the file**

Read `commands/rpi/status.md`.

**Step 2: Add DECISIONS.md reading to Step 4 (Gather metadata per feature)**

After the "### Activity Log" subsection (around line 65), add:

```markdown
### Decisions
- Read `{feature_dir}/DECISIONS.md` if it exists.
- Count total decisions, count by impact (HIGH, MEDIUM, LOW).
- Extract the last 5 decisions (most recent first — bottom of the file).
```

**Step 3: Add Key Decisions to overview mode output (Step 5)**

In the overview mode status card (around line 83-102), add after the Quality line:

```
Decisions: {total} ({HIGH_count} HIGH, {MEDIUM_count} MEDIUM, {LOW_count} LOW)
```

**Step 4: Add Key Decisions section to detailed mode output (Step 5)**

In the detailed mode (around line 129-175), after the "## Activity Log" section and before "## Quality Summary", add:

```markdown
## Key Decisions (last 5)
{If DECISIONS.md exists:}
| # | Phase | Decision | Impact |
|---|-------|----------|--------|
| {N} | {phase} | {summary} | {impact} |

Total: {N} decisions ({HIGH_count} HIGH, {MEDIUM_count} MEDIUM, {LOW_count} LOW)
Full log: rpi/features/{slug}/DECISIONS.md

{If no DECISIONS.md: "No decisions logged yet."}
```

**Step 5: Commit**

```bash
git add commands/rpi/status.md
git commit -m "feat(status): add Key Decisions section to status dashboard"
```

---

### Task 11: Add test for DECISIONS.md reference in phase commands

**Files:**
- Modify: `test/commands.test.js`

**Step 1: Write the test**

Add this test inside the `"RPIKit v2 — Cross-references"` describe block (after the ACTIVITY.md test around line 200):

```javascript
  it("phase commands reference DECISIONS.md for consolidation", () => {
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
        /DECISIONS\.md/i,
        `${cmd}.md should reference DECISIONS.md for decision consolidation`
      );
    }
  });
```

**Step 2: Add test for status command Key Decisions**

Add this test in the same describe block:

```javascript
  it("status command references DECISIONS.md for Key Decisions", () => {
    const filePath = path.join(COMMANDS_DIR, "status.md");
    if (!fs.existsSync(filePath)) {
      assert.fail("status.md does not exist");
    }
    const content = fs.readFileSync(filePath, "utf8");
    assert.match(
      content,
      /DECISIONS\.md/i,
      "status.md should reference DECISIONS.md"
    );
    assert.match(
      content,
      /Key Decisions/i,
      "status.md should have a Key Decisions section"
    );
  });
```

**Step 3: Run all tests**

Run: `node --test test/commands.test.js`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add test/commands.test.js
git commit -m "test: add assertions for DECISIONS.md consolidation and Key Decisions in status"
```

---

### Task 12: Run full test suite and verify

**Files:**
- Test: `test/commands.test.js`, `test/cli.test.js`

**Step 1: Run all tests**

Run: `node --test`
Expected: All 31+ tests pass (29 existing + 3 new)

**Step 2: Verify agent file structure**

For each of the 13 agent files, verify the section order is:
1. Frontmatter (---)
2. `<role>`
3. `<persona>`
4. `<priorities>`
5. `<output_format>`
6. `<decision_logging>` ← NEW
7. `<quality_gate>`

**Step 3: Commit (if any fixes needed)**

Only commit if fixes were required during verification.
