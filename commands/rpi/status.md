---
name: rpi:status
description: Show all RPI features and their current phase, progress, and status.
argument-hint: "[feature-slug]"
allowed-tools:
  - Read
  - Glob
  - Bash
---

<objective>
Display detailed status cards for all features (or a specific feature) in the RPI workflow.
</objective>

<process>

## 1. Load config

Read `.rpi.yaml` for folder path. Default to `rpi/` if not found. Also read `profile` and `models` keys.

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

## 3. Determine phase for each feature

For each feature slug, check which files exist:

- `REQUEST.md` exists, no `research/RESEARCH.md` → Phase: **new**
- `research/RESEARCH.md` exists, no `plan/PLAN.md` → Phase: **researched**
- `plan/PLAN.md` exists, no `implement/IMPLEMENT.md` → Phase: **planned**
- `implement/IMPLEMENT.md` exists → Phase: **implementing** or **complete**

For each change, determine phase using the same logic as features,
but looking in `{folder}/{parent_slug}/changes/{change_slug}/` instead.

## 4. Gather details per feature

For each feature, read the relevant files to extract:

**If researched or later:**
- Read RESEARCH.md executive summary for verdict and complexity

**If planned or later:**
- Read PLAN.md to count total tasks and phases

**If implementing:**
- Check for checkpoint files in `{folder}/{slug}/implement/checkpoints/`
- If checkpoints exist:
  - Read each checkpoint file, parse status and task_id
  - Count done / blocked / deviated / rolled_back
  - Identify current task (first unchecked in PLAN.md order that has no checkpoint)
  - Read latest session file in `sessions/` for session count and tier
- If no checkpoints (old-style):
  - Fall back to reading IMPLEMENT.md for `[x]` vs `[ ]` counts
- Check for review verdict in IMPLEMENT.md

**If complete:**
- Read IMPLEMENT.md for final review verdict and completion timestamp

## 5. Display detailed cards

First, display the active profile at the top of the output. Resolve the effective model for each phase using the Model Resolution Algorithm in the rpi-workflow skill:
- With profile: `Profile: {profile} (research: {model}, plan: {model}, implement: {model}, review: {model})`
- With overrides, mark overridden phases with `*`: `Profile: balanced (research: opus, plan: opus, implement: opus*, review: opus)`
- No profile: `Profile: none (inheriting parent model)`

Then output a card per feature:

```markdown
## {feature-slug}
Phase: {phase} ({progress details})
Verdict: {GO|GO with concerns|NO-GO|—}
{Complexity: S|M|L|XL (if known)}
{Tier: 1|2|3 (context weight: {weight}) (if implementing)}
{Sessions: {count} (if implementing with checkpoints)}
{Current: Task {id} — {name} (if implementing)}
{Blocked: Task {id} — {reason} (if any blocked)}
{Review: PASS|FAIL (if reviewed)}
```

### Example output:

```markdown
# RPI Status

Profile: balanced (research: opus, plan: opus, implement: sonnet, review: opus)

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

## 6. Suggest next action

For each feature, suggest the logical next command:
- **new** → `/rpi:research {slug}`
- **researched (GO)** → `/rpi:plan {slug}`
- **researched (NO-GO)** → Review alternatives or `/rpi:plan {slug} --force`
- **planned** → `/rpi:implement {slug}`
- **implementing** → `/rpi:implement {slug} --resume`
- **complete (PASS)** → Done
- **complete (FAIL)** → `/rpi:review {slug}`

</process>
