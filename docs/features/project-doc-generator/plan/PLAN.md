# PLAN.md -- Project Doc Generator (MVP)

## Summary

New `/rpi:docs-gen` utility command that generates CLAUDE.md for existing projects by composing Atlas (analysis) + Quill (writing). No new agents, no new skill, no AGENTS.md/README.md in v1.

**Total: 6 tasks across 2 phases. Estimated effort: S (1 session)**

---

## Phase 1: Command & Registration

- [ ] **1.1** Create `/rpi:docs-gen` command file
  Effort: M | Deps: none
  Files: `commands/rpi/docs-gen.md` (create)
  Details:
  - YAML frontmatter: name, description, argument-hint, allowed-tools (Read, Write, Glob, Grep, Agent, AskUserQuestion)
  - Step 1: Load .rpi.yaml config (defaults if missing)
  - Step 2: Check for existing CLAUDE.md at project root
  - Step 3: If exists, ask overwrite/cancel via AskUserQuestion
  - Step 4: Launch Atlas with extended prompt (Stack, Architecture, Conventions, Key Files, Commands, Rules)
  - Step 5: Launch Quill with Atlas output + CLAUDE.md target structure (Behavior, Code, Stack, Architecture, Conventions, Commands). Constraint: under 80 lines.
  - Step 6: Preview generated content, confirm via AskUserQuestion
  - Step 7: Write CLAUDE.md to project root
  - Step 8: Output summary (line count, sections, tip to review)

- [ ] **1.2** Register command in marketplace.json
  Effort: S | Deps: 1.1
  Files: `.claude-plugin/marketplace.json` (modify)
  Details:
  - Add `"./commands/rpi/docs-gen.md"` to `commands` array
  - Insert between `docs.md` and `implement.md` (alphabetical order)

- [ ] **1.3** Add to EXPECTED_COMMANDS in tests
  Effort: S | Deps: 1.1
  Files: `test/commands.test.js` (modify)
  Details:
  - Add `"docs-gen"` to `EXPECTED_COMMANDS` array (line 10-26 area)
  - Required for bidirectional file existence check

- [ ] **1.4** Add to Utility Commands in workflow skill
  Effort: S | Deps: 1.1
  Files: `skills/rpi-workflow/SKILL.md` (modify)
  Details:
  - Add `/rpi:docs-gen   -- generate CLAUDE.md from codebase analysis` to Utility Commands code block (after `/rpi:onboarding` line)

## Phase 2: Verification

- [ ] **2.1** Run automated tests
  Effort: S | Deps: 1.1, 1.2, 1.3
  Files: none (read-only)
  Details:
  - Run `node --test test/commands.test.js`
  - Verify all existing tests still pass
  - Verify new `docs-gen` entry passes file existence, frontmatter validation, and no-unexpected-files checks

- [ ] **2.2** Manual smoke test
  Effort: S | Deps: 2.1
  Files: none (generated CLAUDE.md is outside feature scope)
  Details:
  - Run `/rpi:docs-gen` on RPIKit's own codebase
  - Verify Atlas produces Stack, Architecture, Conventions, Key Files, Commands sections
  - Verify Quill generates CLAUDE.md with 6 target sections (Behavior, Code, Stack, Architecture, Conventions, Commands)
  - Verify preview is shown before writing
  - Verify overwrite flow works when CLAUDE.md already exists
  - Delete test CLAUDE.md after verification

---

## Deferred (v2)

These items are explicitly out of scope for this plan:

- README.md generation
- AGENTS.md generation
- Skill auto-invocation (rpi-docs-gen/SKILL.md)
- Incremental analysis (--refresh mode)
- Section markers (<!-- rpi:auto-start -->)
- Manual section preservation
- Custom templates
- Per-package docs in monorepos

Each deferred item should go through its own `/rpi:new` → `/rpi:research` → `/rpi:plan` cycle when prioritized.
