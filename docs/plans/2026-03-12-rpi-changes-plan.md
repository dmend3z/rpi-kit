# RPI Changes Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable `rpi:new` to create sub-features (changes) within existing features, and update all downstream commands to resolve and work with changes transparently.

**Architecture:** All 7 command .md files are modified to include a shared "Resolve Feature Path" logic block. `rpi:new` gets a new branch in its flow for change creation. `rpi:status` gets hierarchical display. Tests verify the new cross-references.

**Tech Stack:** Markdown prompt files, Node.js test runner (node:test)

---

### Task 1: Add Resolve Feature Path block to `rpi:new`

**Files:**
- Modify: `commands/rpi/new.md:19-33` (step 3 replacement)

**Step 1: Read the current file**

Verify current content of `commands/rpi/new.md` steps 2-3.

**Step 2: Replace step 3 with resolve + change detection**

Replace the existing step 3 ("Check for existing feature") in `commands/rpi/new.md` with:

```markdown
## 3. Check for existing feature

Check if `{folder}/{feature-slug}/` already exists.

If it does NOT exist, continue to step 4 (new feature interview).

If it DOES exist, ask the user with AskUserQuestion:

"Feature '{feature-slug}' already exists ({folder}/{feature-slug}/). What do you want to do?"

Options:
- "Create a change for this feature" — go to step 3b
- "Overwrite existing REQUEST.md" — continue to step 4 (current behavior)
- "Pick a different name" — go back to step 2

## 3b. Set up change

Ask: "What change do you want to make to {feature-slug}?" and derive change-slug (kebab-case) from the answer.

Check if `{folder}/{feature-slug}/changes/{change-slug}/` already exists. If yes, warn and ask to overwrite or pick a different name.

Read parent feature context for the interview:
- `{folder}/{feature-slug}/REQUEST.md`
- `{folder}/{feature-slug}/research/RESEARCH.md` (if exists)
- `{folder}/{feature-slug}/plan/PLAN.md` (if exists)
- `{folder}/{feature-slug}/implement/IMPLEMENT.md` (if exists)

Store the parent artifacts content as `parent_context` for use in steps 4 and 6.

Set `is_change = true` and `parent_slug = {feature-slug}`.
```

**Step 3: Commit**

```bash
git add commands/rpi/new.md
git commit -m "feat(new): add change detection when feature exists"
```

---

### Task 2: Add change-mode interview to `rpi:new`

**Files:**
- Modify: `commands/rpi/new.md:36-49` (step 4 addition)

**Step 1: Add change-mode interview after current step 4**

After the existing adaptive interview section, add a conditional block for change mode:

```markdown
### Change mode interview (if `is_change == true`)

Replace the core questions with context-aware ones:

**Core (always ask):**
- "What do you want to change in {parent_slug}?" (skip if already answered in step 3b)
- "Why is this change needed?"

**Adaptive follow-ups (based on parent artifacts):**
- If parent has IMPLEMENT.md: "Which parts of the existing implementation are affected?"
- If parent has PLAN.md with architecture decisions: "Does this change any architecture decisions from the original plan?"
- If change sounds like it could break things: "Will this break any existing behavior?"
- Always offer: "Any constraints or references?"

Use AskUserQuestion. Keep it lighter than new features — max 2 batches.
```

**Step 2: Commit**

```bash
git add commands/rpi/new.md
git commit -m "feat(new): add context-aware interview for changes"
```

---

### Task 3: Add change-mode REQUEST.md template and directory creation to `rpi:new`

**Files:**
- Modify: `commands/rpi/new.md:86-143` (steps 5, 6, 7)

**Step 1: Add change-mode directory creation in step 5/6**

After the existing isolation + directory creation sections, add the change-mode variant:

```markdown
### Change mode directory creation (if `is_change == true`)

Skip isolation setup (changes use the parent feature's branch/worktree context).

Create the change directory structure:
```bash
mkdir -p {folder}/{parent_slug}/changes/{change-slug}/research
mkdir -p {folder}/{parent_slug}/changes/{change-slug}/plan
mkdir -p {folder}/{parent_slug}/changes/{change-slug}/implement
```

Write `{folder}/{parent_slug}/changes/{change-slug}/REQUEST.md` with this structure:

```markdown
# {Change Title}

## Parent Feature
[{Parent Feature Title}]({relative-path-to-parent-REQUEST.md})
{1-2 sentence summary of parent feature from parent_context}

## Summary of Change
{What changes in the existing feature}

## Motivation
{Why this change is needed}

## Affected Areas
- {Components/files of parent feature that are affected}

## Breaking Changes
- {List or "None"}

## Constraints
- {Technical/business constraints}

## Complexity Estimate
{S | M | L | XL} — {brief justification}
```
```

**Step 2: Add change-mode next step output**

Add after the existing step 7:

```markdown
### Change mode output (if `is_change == true`)

Output:
```
Change created: {folder}/{parent_slug}/changes/{change-slug}/REQUEST.md
Parent: {folder}/{parent_slug}/

Next: /rpi:research {change-slug}
```
```

**Step 3: Commit**

```bash
git add commands/rpi/new.md
git commit -m "feat(new): add change-mode template and directory creation"
```

---

### Task 4: Add Resolve Feature Path to `rpi:research`

**Files:**
- Modify: `commands/rpi/research.md:27-39` (step 2 replacement)

**Step 1: Replace step 2 (Validate feature) with resolve logic**

Replace the current step 2 in `commands/rpi/research.md` with:

```markdown
## 2. Resolve feature path

Parse `{feature-slug}` from arguments.

**Resolution order:**
1. Check if `{folder}/{feature-slug}/` exists → type = "feature", path = `{folder}/{feature-slug}`
2. If not, Glob `{folder}/*/changes/{feature-slug}/` → if found, type = "change", path = matched path, parent_path = parent directory
3. If multiple matches in step 2 → AskUserQuestion listing all matches with full paths
4. If no match → error: `Feature not found: {feature-slug}. Run /rpi:new {feature-slug} first.`

If `type == "change"`:
- Set `parent_path` to the parent feature directory
- Read parent artifacts for agent context:
  - `{parent_path}/REQUEST.md`
  - `{parent_path}/research/RESEARCH.md` (if exists)
  - `{parent_path}/plan/PLAN.md` (if exists)
  - `{parent_path}/plan/eng.md` (if exists)

Validate that `{path}/REQUEST.md` exists. If not, error.

If `{path}/research/RESEARCH.md` already exists and `--force` not set, ask user:
"Research already exists for this feature. Overwrite?"
```

**Step 2: Add parent context to agent prompts**

In step 4 (Launch research agents), after the existing agent prompt template, add:

```markdown
If `type == "change"`, append to each agent prompt:

## Parent Feature Context
{contents of parent artifacts read in step 2}

This is a CHANGE to an existing feature. Focus on:
- What's different from the parent implementation
- Compatibility with existing code
- Breaking changes to watch for
```

**Step 3: Commit**

```bash
git add commands/rpi/research.md
git commit -m "feat(research): add resolve feature path with change support"
```

---

### Task 5: Add Resolve Feature Path to `rpi:plan`

**Files:**
- Modify: `commands/rpi/plan.md:27-42` (step 2 replacement)

**Step 1: Replace step 2 (Validate prerequisites) with resolve logic**

Replace the current step 2 in `commands/rpi/plan.md` with the same resolve pattern:

```markdown
## 2. Resolve feature path and validate prerequisites

Parse `{feature-slug}` from arguments.

**Resolution order:**
1. Check if `{folder}/{feature-slug}/` exists → type = "feature", path = `{folder}/{feature-slug}`
2. If not, Glob `{folder}/*/changes/{feature-slug}/` → if found, type = "change", path = matched path, parent_path = parent directory
3. If multiple matches → AskUserQuestion listing all matches with full paths
4. If no match → error: `Feature not found: {feature-slug}. Run /rpi:new {feature-slug} first.`

If `type == "change"`:
- Set `parent_path` to the parent feature directory
- Read parent artifacts for agent context:
  - `{parent_path}/REQUEST.md`
  - `{parent_path}/research/RESEARCH.md` (if exists)
  - `{parent_path}/plan/PLAN.md` (if exists)
  - `{parent_path}/plan/eng.md` (if exists)

Read `{path}/research/RESEARCH.md`. If missing:
```
Research not found. Run /rpi:research {feature-slug} first.
```

Check verdict. If NO-GO and no `--force`:
```
Research verdict is NO-GO. Review alternatives in RESEARCH.md.
To proceed anyway: /rpi:plan {feature-slug} --force
```

If plan artifacts already exist, ask: "Plan already exists. Overwrite?"
```

**Step 2: Add parent context to agent prompts**

In steps 4, 5, 6, and 7 (agent launches), after each agent prompt, add:

```markdown
If `type == "change"`, append to the agent prompt:

## Parent Feature Context
{contents of parent artifacts read in step 2}

This is a CHANGE to an existing feature. Focus on:
- What's different from the parent implementation
- Compatibility with existing code
- Breaking changes to watch for
```

**Step 3: Commit**

```bash
git add commands/rpi/plan.md
git commit -m "feat(plan): add resolve feature path with change support"
```

---

### Task 6: Add Resolve Feature Path to `rpi:implement`

**Files:**
- Modify: `commands/rpi/implement.md:31-41` (step 2 replacement)

**Step 1: Replace step 2 (Validate prerequisites) with resolve logic**

Replace step 2 in `commands/rpi/implement.md` with:

```markdown
## 2. Resolve feature path and validate prerequisites

Parse `{feature-slug}` from arguments.

**Resolution order:**
1. Check if `{folder}/{feature-slug}/` exists → type = "feature", path = `{folder}/{feature-slug}`
2. If not, Glob `{folder}/*/changes/{feature-slug}/` → if found, type = "change", path = matched path, parent_path = parent directory
3. If multiple matches → AskUserQuestion listing all matches with full paths
4. If no match → error: `Feature not found: {feature-slug}. Run /rpi:new {feature-slug} first.`

If `type == "change"`:
- Set `parent_path` to the parent feature directory
- Read parent artifacts for agent context:
  - `{parent_path}/REQUEST.md`
  - `{parent_path}/research/RESEARCH.md` (if exists)
  - `{parent_path}/plan/PLAN.md` (if exists)
  - `{parent_path}/plan/eng.md` (if exists)

Read `{path}/plan/PLAN.md`. If missing:
```
Plan not found. Run /rpi:plan {feature-slug} first.
```

Also read eng.md (and pm.md, ux.md if they exist) for full context.
```

**Step 2: Add parent context to plan-executor agent prompt**

In step 6a (Agent prompt template), add after the `## Technical Context` section:

```markdown
If `type == "change"`, add to the agent prompt:

## Parent Feature Context
{contents of parent artifacts read in step 2}

This is a CHANGE to an existing feature. When implementing:
- Ensure compatibility with existing parent feature code
- Flag breaking changes as scope deviations
- Reference parent architecture decisions from eng.md
```

**Step 3: Commit**

```bash
git add commands/rpi/implement.md
git commit -m "feat(implement): add resolve feature path with change support"
```

---

### Task 7: Add Resolve Feature Path to `rpi:review`

**Files:**
- Modify: `commands/rpi/review.md:20-28` (step 1 replacement)

**Step 1: Replace step 1 (Load config and validate) with resolve logic**

Replace step 1 in `commands/rpi/review.md` with:

```markdown
## 1. Load config and resolve feature path

Read `.rpi.yaml` for folder path.

Parse `{feature-slug}` from arguments.

**Resolution order:**
1. Check if `{folder}/{feature-slug}/` exists → type = "feature", path = `{folder}/{feature-slug}`
2. If not, Glob `{folder}/*/changes/{feature-slug}/` → if found, type = "change", path = matched path, parent_path = parent directory
3. If multiple matches → AskUserQuestion listing all matches with full paths
4. If no match → error: `Feature not found: {feature-slug}`

If `type == "change"`:
- Set `parent_path` to the parent feature directory
- Read parent artifacts for agent context

Validate that required files exist:
- `{path}/plan/PLAN.md`
- `{path}/plan/eng.md`
- `{path}/implement/IMPLEMENT.md`

If any missing, error with guidance on which command to run.
```

**Step 2: Add parent context to code-reviewer agent prompt**

In step 3, after the file list in the agent prompt, add:

```markdown
If `type == "change"`, append to the agent prompt:

Also read parent feature files for context:
- {parent_path}/REQUEST.md
- {parent_path}/research/RESEARCH.md (if exists)
- {parent_path}/plan/eng.md (if exists)

This is a CHANGE to an existing feature. Additionally check:
- Compatibility with parent feature's existing implementation
- Whether breaking changes listed in the change REQUEST.md are properly handled
```

**Step 3: Commit**

```bash
git add commands/rpi/review.md
git commit -m "feat(review): add resolve feature path with change support"
```

---

### Task 8: Add Resolve Feature Path to `rpi:simplify`

**Files:**
- Modify: `commands/rpi/simplify.md:20-31` (step 1 replacement)

**Step 1: Replace step 1 (Load config and identify changes) with resolve logic**

Replace step 1 in `commands/rpi/simplify.md` with:

```markdown
## 1. Load config, resolve path, and identify changes

Read `.rpi.yaml` for folder path.

Parse `{feature-slug}` from arguments.

**Resolution order:**
1. Check if `{folder}/{feature-slug}/` exists → type = "feature", path = `{folder}/{feature-slug}`
2. If not, Glob `{folder}/*/changes/{feature-slug}/` → if found, type = "change", path = matched path, parent_path = parent directory
3. If multiple matches → AskUserQuestion listing all matches with full paths
4. If no match → error: `Feature not found: {feature-slug}`

Read `{path}/implement/IMPLEMENT.md` to identify what was implemented.

Get the diff of all implementation changes:
```bash
git diff HEAD~{number_of_commits}
```

If no git history, use the files listed in IMPLEMENT.md tasks and read them directly.
```

**Step 2: Commit**

```bash
git add commands/rpi/simplify.md
git commit -m "feat(simplify): add resolve feature path with change support"
```

---

### Task 9: Add hierarchical change display to `rpi:status`

**Files:**
- Modify: `commands/rpi/status.md:22-31` (step 2), `commands/rpi/status.md:40-68` (steps 3-4), `commands/rpi/status.md:72-113` (step 5)

**Step 1: Update step 2 (Discover features) to also find changes**

Replace step 2 in `commands/rpi/status.md` with:

```markdown
## 2. Discover features and changes

Use Glob to find all top-level `REQUEST.md` files:
```
{folder}/*/REQUEST.md
```

Each parent directory is a feature slug.

Also find all change `REQUEST.md` files:
```
{folder}/*/changes/*/REQUEST.md
```

Parse each match to extract parent_slug and change_slug.

If `$ARGUMENTS` specifies a slug:
1. Check if it matches a top-level feature → show that feature and its changes
2. If not, check if it matches a change slug → show just that change (with parent context)
3. Resolution follows the shared Resolve Feature Path logic:
   - Check `{folder}/{slug}/` exists → type = "feature"
   - Glob `{folder}/*/changes/{slug}/` → type = "change"
   - Multiple matches → AskUserQuestion

If no features found:
```
No RPI features found in {folder}/.
Run /rpi:new to start your first feature.
```
```

**Step 2: Update step 3 to determine phase for changes too**

Add to step 3:

```markdown
For each change, determine phase using the same logic as features,
but looking in `{folder}/{parent_slug}/changes/{change_slug}/` instead.
```

**Step 3: Update step 5 display format for hierarchical output**

Replace the example output in step 5 with:

```markdown
### Example output:

```markdown
# RPI Status

## oauth2-auth
Phase: implement (6/9 tasks)
Verdict: GO
Complexity: M
Tier: 2 (context weight: 14.5)
Sessions: 2
Current: Task 2.1 — Login component
  └─ add-social-login  [research: GO]
  └─ fix-token-refresh  [new]

## payment-system
Phase: research
Verdict: pending
Complexity: —

## dark-mode
Phase: plan (ready to implement)
Verdict: GO
Complexity: S

## csv-export
Phase: new
Verdict: —
```

Changes are displayed indented under their parent feature with `└─` prefix.
Each change shows its own phase status using the same rules as features.
```

**Step 4: Commit**

```bash
git add commands/rpi/status.md
git commit -m "feat(status): add hierarchical display for changes"
```

---

### Task 10: Add tests for changes support

**Files:**
- Modify: `test/commands.test.js`

**Step 1: Add test verifying rpi:new references changes concept**

Add to the "command cross-references" describe block:

```javascript
it("new.md supports changes for existing features", () => {
  const content = fs.readFileSync(
    path.join(COMMANDS_DIR, "new.md"),
    "utf8"
  );
  assert.match(content, /changes/, "new.md should reference changes concept");
  assert.match(content, /change-slug/, "new.md should use change-slug");
  assert.match(content, /Parent Feature/, "new.md should have parent feature template");
  assert.match(content, /Breaking Changes/, "new.md should have breaking changes section");
});
```

**Step 2: Add test verifying all downstream commands have resolve logic**

```javascript
it("downstream commands have resolve feature path logic", () => {
  const downstreamCommands = ["research", "plan", "implement", "review", "simplify"];

  for (const cmd of downstreamCommands) {
    const content = fs.readFileSync(
      path.join(COMMANDS_DIR, `${cmd}.md`),
      "utf8"
    );
    assert.match(
      content,
      /Resolve feature path|Resolution order/i,
      `${cmd}.md should have resolve feature path logic`
    );
    assert.match(
      content,
      /changes/,
      `${cmd}.md should reference changes`
    );
  }
});
```

**Step 3: Add test verifying status supports hierarchical display**

```javascript
it("status.md supports hierarchical change display", () => {
  const content = fs.readFileSync(
    path.join(COMMANDS_DIR, "status.md"),
    "utf8"
  );
  assert.match(content, /└─/, "status.md should use tree characters for changes");
  assert.match(content, /changes/, "status.md should reference changes discovery");
});
```

**Step 4: Run tests**

```bash
node --test test/commands.test.js
```

Expected: All tests pass, including the 3 new ones.

**Step 5: Commit**

```bash
git add test/commands.test.js
git commit -m "test: add coverage for changes feature across commands"
```

---

### Task 11: Final verification

**Step 1: Run full test suite**

```bash
npm test
```

Expected: All tests pass.

**Step 2: Verify file consistency**

Read each modified command file to confirm:
- `new.md` has steps 3, 3b, change-mode interview, and change-mode template
- `research.md`, `plan.md`, `implement.md`, `review.md`, `simplify.md` all have resolve logic
- `status.md` has hierarchical display
- No broken cross-references

**Step 3: Commit any remaining fixes**

If any issues found, fix and commit.
