# Implementation: Project Doc Generator (MVP)

Started: 2026-03-18

## Tasks

### Phase 1: Command & Registration

- [x] **1.1** Create `/rpi:docs-gen` command file ✓ 2026-03-18
  Effort: M | Deps: none
  Files: `commands/rpi/docs-gen.md` (created)

- [x] **1.2** Register command in marketplace.json ✓ 2026-03-18
  Effort: S | Deps: 1.1
  Files: `.claude-plugin/marketplace.json` (modified — added between docs.md and implement.md)

- [x] **1.3** Add to EXPECTED_COMMANDS in tests ✓ 2026-03-18
  Effort: S | Deps: 1.1
  Files: `test/commands.test.js` (modified — added "docs-gen" after "docs")

- [x] **1.4** Add to Utility Commands in workflow skill ✓ 2026-03-18
  Effort: S | Deps: 1.1
  Files: `skills/rpi-workflow/SKILL.md` (modified — added after /rpi:onboarding)

### Phase 2: Verification

- [x] **2.1** Run automated tests ✓ 2026-03-18
  Effort: S | Deps: 1.1, 1.2, 1.3
  Files: none
  Result: 16/16 tests passing (4 suites, 16 tests, 0 failures)

- [ ] **2.2** Manual smoke test
  Effort: S | Deps: 2.1
  Files: none

## Deviations

_None._

## Simplify Findings

8 findings (0 HIGH, 2 MEDIUM, 6 LOW). Applied fixes:
- Added `Edit` to `allowed-tools` (Quill needs it — matched `/rpi:docs` pattern)
- Consolidated redundant intro sentence (removed repetition of frontmatter description)
- Consolidated redundant Step 3 output (merged line count into AskUserQuestion)

Not applied (accepted as-is):
- Atlas prompt divergence from init.md (intentional — different output needs)
- Verbose Quill prompt instructions (clarity over brevity for prompts)
- Missing `Bash` for git log (Atlas can infer commit style from other signals)

## Review

Verdict: **PASS**

Verified:
- Frontmatter follows command pattern (name, description, argument-hint, allowed-tools)
- Step numbering matches init.md/onboarding.md style (8 steps)
- Atlas prompt extends /rpi:init pattern with Key Files + Commands sections
- Quill prompt specifies target structure with 80-line constraint
- Overwrite protection correct (Steps 2-3)
- Preview before writing correct (Step 6)
- marketplace.json registration alphabetically sorted
- EXPECTED_COMMANDS array updated
- Skill utility commands table updated
- 16/16 tests passing after all changes
