---
name: rpi:review
description: Run code review against the implementation plan. Checks that all tasks are implemented, deviations are justified, and requirements are met.
argument-hint: "<feature-slug>"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Agent
  - Write
---

<objective>
Review the implementation against the plan. Check completeness, correctness, and plan alignment. Output PASS or FAIL with specific findings.
</objective>

<process>

## 1. Load config and validate

Read `.rpi.yaml` for folder path.
Validate that all required files exist:
- `{folder}/{feature-slug}/plan/PLAN.md`
- `{folder}/{feature-slug}/plan/eng.md`
- `{folder}/{feature-slug}/implement/IMPLEMENT.md`

If any missing, error with guidance on which command to run.

## 2. Gather context

Read all plan and implementation files:
- REQUEST.md (original requirements)
- RESEARCH.md (research findings)
- PLAN.md (task checklist)
- eng.md (technical spec)
- pm.md (if exists — acceptance criteria)
- ux.md (if exists — UX requirements)
- IMPLEMENT.md (implementation record)

## 3. Launch code-reviewer agent

```
You are the code-reviewer agent for the RPI workflow.

Read these files for the complete feature context:
- {folder}/{feature-slug}/REQUEST.md
- {folder}/{feature-slug}/research/RESEARCH.md
- {folder}/{feature-slug}/plan/PLAN.md
- {folder}/{feature-slug}/plan/eng.md
{- {folder}/{feature-slug}/plan/pm.md (if exists)}
{- {folder}/{feature-slug}/plan/ux.md (if exists)}
- {folder}/{feature-slug}/implement/IMPLEMENT.md

Then review the actual code changes. Use Grep and Glob to find the files listed in the plan and verify the implementation.

Your review must check:

### 1. Completeness
- Are all tasks from PLAN.md implemented? List any missing tasks.
- Are all files from eng.md created/modified as specified?

### 2. Correctness
- Does the implementation match the technical approach in eng.md?
- If pm.md exists: are acceptance criteria met?
- If ux.md exists: are user flows implemented correctly?

### 3. Deviations
- Read the Deviations section of IMPLEMENT.md
- Are listed deviations justified?
- Are there unlisted deviations (implementation differs from plan but not recorded)?

### 4. Code quality
- Any obvious bugs or logic errors?
- Security concerns (injection, auth bypass, data exposure)?
- Tests written for critical paths?

### Output format:

## Review: {feature-slug}

### Verdict: {PASS|FAIL}

### Completeness
- {task_id}: {status} — {details}

### Correctness
- {finding with file:line reference}

### Deviations
- {deviation}: {justified|unjustified} — {reason}

### Issues (if any)
- [{severity}] {file}:{line} — {description}

Follow code-reviewer rules from RPI agent guidelines:
- Every finding cites a plan requirement or coding standard
- No style nitpicks — focus on correctness, completeness, plan alignment
- Verdict is PASS only if all requirements are met
```

## 4. Update IMPLEMENT.md

Write the review results into the `## Review` section of IMPLEMENT.md.

## 5. Present verdict

If PASS:
```
Review: PASS
All {N} tasks implemented. Requirements met.
Feature {feature-slug} is complete.
```

If FAIL:
```
Review: FAIL
{list specific gaps}

Options:
- Fix the issues and re-run: /rpi:review {feature-slug}
- Accept as-is: mark complete manually in IMPLEMENT.md
```

</process>
