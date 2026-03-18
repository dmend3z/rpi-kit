---
name: rpi:review
description: Adversarial review with Hawk + Shield + Sage in parallel. Nexus synthesizes.
argument-hint: "<feature-name>"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Agent
---

# /rpi:review — Review Phase

Adversarial review with three parallel agents: Hawk (code review), Shield (security audit), Sage (test coverage). Nexus synthesizes findings into a final verdict.

---

## Step 1: Load config and validate

1. Read `.rpi.yaml` for config. Apply defaults if missing:
   - `folder`: `rpi/features`
   - `context_file`: `rpi/context.md`
   - `solutions_dir`: `rpi/solutions`
   - `auto_learn`: `true`
2. Parse `$ARGUMENTS` to extract `{slug}`.
3. Validate `rpi/features/{slug}/implement/IMPLEMENT.md` exists. If not:
   ```
   IMPLEMENT.md not found for '{slug}'. Run /rpi:implement {slug} first.
   ```
   Stop.

## Step 2: Gather all artifacts

1. Read `rpi/features/{slug}/REQUEST.md` — store as `$REQUEST`.
2. Read `rpi/features/{slug}/plan/PLAN.md` — store as `$PLAN`.
3. Read `rpi/features/{slug}/plan/eng.md` if it exists — store as `$ENG`.
4. Read `rpi/features/{slug}/implement/IMPLEMENT.md` — store as `$IMPLEMENT`.
5. Read `rpi/context.md` (project context) if it exists — store as `$CONTEXT`.

## Step 3: Get implementation diff

1. Read `$IMPLEMENT` to extract all commit hashes from the Execution Log (including simplify commit if present).
2. Use git to get the combined diff:
   ```bash
   git diff {first_commit}^..{last_commit}
   ```
3. Store the diff as `$IMPL_DIFF`.
4. Collect the list of all files changed — store as `$CHANGED_FILES`.

## Step 4: Launch Hawk, Shield, and Sage in parallel

Use the Agent tool to launch all three agents simultaneously.

### Hawk (adversarial review)

Launch Hawk agent with this prompt:

```
You are Hawk. Perform an adversarial code review for feature: {slug}

## Implementation Diff
{$IMPL_DIFF}

## Changed Files
{$CHANGED_FILES}

## Engineering Spec
{$ENG}

## Implementation Plan
{$PLAN}

## Project Context
{$CONTEXT}

Your task — ultra-thinking deep dive from 5 perspectives:

1. **Developer**: Code quality, maintainability, readability, patterns
2. **Ops**: Deployability, monitoring, logging, failure modes
3. **User**: Edge cases in user-facing behavior, error messages, UX
4. **Security**: Input validation, auth checks, data exposure
5. **Business**: Does it solve the stated problem? Missed requirements?

CRITICAL RULES:
1. You MUST find problems. Zero findings is not acceptable — re-analyse.
2. Read ALL changed files thoroughly before writing findings.
3. Each finding must reference specific file and line.
4. Classify every finding:
   - P1 (blocker): Must fix before merge. Bugs, data loss, security holes, broken contracts.
   - P2 (should fix): Important but not blocking. Performance, naming, missing validation.
   - P3 (nice-to-have): Suggestions, style, minor improvements.

Output format:
## Findings

### P1 — Blockers
- [{file}:{line}] {description} — Impact: {impact}
(or "None found.")

### P2 — Should Fix
- [{file}:{line}] {description} — Impact: {impact}

### P3 — Nice to Have
- [{file}:{line}] {description} — Suggestion: {suggestion}

## Summary
- P1: {N} | P2: {N} | P3: {N}
- Overall: {assessment}

After your review, append your activity to rpi/features/{slug}/ACTIVITY.md:

### {current_date} — Hawk (Review)
- **Action:** Adversarial code review for {slug}
- **Findings:** P1={count} P2={count} P3={count}
- **Perspectives covered:** {list of 5 perspectives}
- **Quality:** {your quality gate result}
```

Store the output as `$HAWK_OUTPUT`.

### Shield (security audit)

Launch Shield agent with this prompt:

```
You are Shield. Perform a security audit for feature: {slug}

## Implementation Diff
{$IMPL_DIFF}

## Changed Files
{$CHANGED_FILES}

## Engineering Spec
{$ENG}

## Project Context
{$CONTEXT}

Your task — systematic security audit:

### OWASP Top 10 Check
For each applicable category, check the implementation:
1. Injection (SQL, NoSQL, OS command, LDAP)
2. Broken Authentication
3. Sensitive Data Exposure
4. XML External Entities (XXE)
5. Broken Access Control
6. Security Misconfiguration
7. Cross-Site Scripting (XSS)
8. Insecure Deserialization
9. Using Components with Known Vulnerabilities
10. Insufficient Logging & Monitoring

### Additional Checks
- Hardcoded secrets, API keys, tokens
- Missing input validation or sanitization
- Auth bypass possibilities
- Race conditions
- Edge cases and boundary conditions (overflow, empty input, null)
- Error messages leaking internal details

RULES:
1. Read ALL changed files before auditing
2. Each finding must reference specific file and line
3. Classify: P1 (blocker) | P2 (should fix) | P3 (nice-to-have)
4. If no security issues found, explicitly state which checks passed

Output format:
## Security Findings

### P1 — Critical
- [{file}:{line}] {vulnerability} — Risk: {risk description}
(or "None found.")

### P2 — Important
- [{file}:{line}] {vulnerability} — Risk: {risk description}

### P3 — Hardening
- [{file}:{line}] {suggestion} — Benefit: {benefit}

## OWASP Coverage
- {category}: PASS | FAIL | N/A — {notes}

## Summary
- P1: {N} | P2: {N} | P3: {N}

After your audit, append your activity to rpi/features/{slug}/ACTIVITY.md:

### {current_date} — Shield (Review)
- **Action:** Security audit for {slug}
- **Findings:** P1={count} P2={count} P3={count}
- **OWASP categories checked:** {count}
- **Quality:** {your quality gate result}
```

Store the output as `$SHIELD_OUTPUT`.

### Sage (coverage check)

Launch Sage agent with this prompt:

```
You are Sage. Verify test coverage for feature: {slug}

## Implementation Diff
{$IMPL_DIFF}

## Changed Files
{$CHANGED_FILES}

## Engineering Spec
{$ENG}

## Implementation Plan
{$PLAN}

## Project Context
{$CONTEXT}

Your task — check what is tested and what is not:

1. For each changed file, find the corresponding test file(s)
2. Identify modules/functions with NO tests at all
3. Identify tested modules with MISSING edge cases:
   - Error paths not tested
   - Boundary values not tested
   - Null/empty/invalid inputs not tested
   - Concurrent/race condition scenarios not tested
4. Check that acceptance criteria from the plan have test coverage
5. Suggest specific tests that should be added

RULES:
1. Read ALL changed files and their test files before reporting
2. Be specific — name the function/module and the missing test case
3. Classify: P1 (no tests at all) | P2 (missing critical paths) | P3 (missing edge cases)

Output format:
## Coverage Analysis

### Untested Modules (P1)
- {file}:{function/class} — No tests found
(or "All modules have tests.")

### Missing Critical Paths (P2)
- {file}:{function} — Missing: {description of untested path}

### Missing Edge Cases (P3)
- {file}:{function} — Missing: {description of edge case}

## Suggested Tests
1. {test description} — covers {what it covers}
2. ...

## Summary
- Modules without tests: {N}
- Missing critical paths: {N}
- Missing edge cases: {N}

After your analysis, append your activity to rpi/features/{slug}/ACTIVITY.md:

### {current_date} — Sage (Review)
- **Action:** Test coverage analysis for {slug}
- **Untested modules:** {count}
- **Missing critical paths:** {count}
- **Missing edge cases:** {count}
- **Quality:** {your quality gate result}
```

Store the output as `$SAGE_OUTPUT`.

## Step 5: Wait for completion

Wait for all three agents (Hawk, Shield, Sage) to complete.

## Step 6: Launch Nexus — synthesize findings

Launch Nexus agent to produce the final review report:

```
You are Nexus. Synthesize the review findings for feature: {slug}

## Hawk Output (Code Review)
{$HAWK_OUTPUT}

## Shield Output (Security Audit)
{$SHIELD_OUTPUT}

## Sage Output (Coverage)
{$SAGE_OUTPUT}

## Request
{$REQUEST}

Your task:
1. Merge all findings from Hawk, Shield, and Sage
2. Deduplicate — if multiple agents flagged the same issue, combine into one finding
3. Classify every finding: P1 (blocker) | P2 (should fix) | P3 (nice-to-have)
4. Determine verdict based on findings

Verdict rules:
- Any P1 finding → FAIL
- No P1 but has P2/P3 → PASS with concerns
- No findings → PASS

Output format:
## Review Report: {slug}

### Verdict: {PASS | PASS with concerns | FAIL}

### P1 — Blockers (must fix)
- [{source}] [{file}:{line}] {description}
(or "None.")

### P2 — Should Fix
- [{source}] [{file}:{line}] {description}

### P3 — Nice to Have
- [{source}] [{file}:{line}] {description}

### Coverage Summary (Sage)
- {summary of test coverage status}

### Totals
- P1: {N} | P2: {N} | P3: {N}
- Sources: Hawk {N} | Shield {N} | Sage {N}
```

Store the output as `$NEXUS_OUTPUT`.

## Step 7: Handle verdict

### If FAIL (P1 findings exist):

1. Output to the user:
   ```
   Review FAILED for '{slug}'. {N} P1 blockers must be fixed.

   {list P1 findings with file:line and description}

   Fix all P1 issues and re-run: /rpi:review {slug}
   ```
2. Do NOT proceed to docs phase.

### If PASS with concerns (P2/P3 only):

1. Output to the user:
   ```
   Review PASSED with concerns for '{slug}'.
   P2: {N} | P3: {N}

   {list P2 findings}

   These are non-blocking but should be addressed.
   ```
2. Proceed to Step 8.

### If PASS (no findings):

1. Output to the user:
   ```
   Review PASSED for '{slug}'. No issues found.
   ```
2. Proceed to Step 8.

## Step 8: Auto-learn to solutions

If `auto_learn` is `true` in config (default):

1. Review all P1 and P2 findings that were particularly insightful or represent reusable knowledge.
2. For each solution worth saving, write to `rpi/solutions/{category}/{slug}.md` using this format:
   ```markdown
   # {Title}

   ## Problem
   {symptoms, how it manifests}

   ## Solution
   {code, approach, what worked}

   ## Prevention
   {how to avoid in the future}

   ## Context
   Feature: {slug} | Date: {YYYY-MM-DD}
   Files: {list}
   ```
3. Categories are auto-detected: `performance/`, `security/`, `database/`, `testing/`, `architecture/`, `patterns/`
4. If no findings are worth saving, skip this step.

## Step 9: Update IMPLEMENT.md

Append a review section to `rpi/features/{slug}/implement/IMPLEMENT.md`:

```markdown
## Review

Date: {YYYY-MM-DD}
Agents: Hawk + Shield + Sage → Nexus
Verdict: {PASS | PASS with concerns | FAIL}

### Findings
- P1: {N} | P2: {N} | P3: {N}

### Details
{$NEXUS_OUTPUT summary}

### Solutions Saved
- {path to solution file}: {title}
(or "No solutions saved.")
```

## Step 10: Output summary

```
Review complete: {slug}

Verdict: {PASS | PASS with concerns | FAIL}
Findings: P1={N} P2={N} P3={N}
Agents: Hawk({N}) Shield({N}) Sage({N})

{If PASS or PASS with concerns:}
Next: /rpi {slug}
Or explicitly: /rpi:docs {slug}

{If FAIL:}
Fix P1 blockers and re-run: /rpi:review {slug}
```
