# eng.md -- Project Doc Generator (MVP)

## 1. Architecture Overview

### How /rpi:docs-gen Fits

`/rpi:docs-gen` is a standalone utility command. It does not participate in the 7-phase pipeline (request -> research -> plan -> implement -> simplify -> review -> docs). It sits alongside `/rpi:init`, `/rpi:status`, `/rpi:learn`, and other utility commands listed in `skills/rpi-workflow/SKILL.md` lines 144-154.

The distinction from `/rpi:docs` (`commands/rpi/docs.md`) is lifecycle:

- `/rpi:docs` is pipeline-bound. Requires `IMPLEMENT.md` + review verdict PASS (`commands/rpi/docs.md` lines 28-49). Generates README sections, changelogs, API docs for a specific feature.
- `/rpi:docs-gen` is standalone. No feature context, no pipeline artifacts. Analyzes the entire project and generates a CLAUDE.md from scratch.

No new agents are introduced. This command composes two existing agents:

1. **Atlas** (`agents/atlas.md`) -- read-only codebase analysis (tools: Read, Glob, Grep)
2. **Quill** (`agents/quill.md`) -- doc writing (tools: Read, Write, Edit, Glob, Grep)

### Data Flow

```
User runs /rpi:docs-gen
    |
Step 1: Read .rpi.yaml (optional, for commit_style)
    |
Step 2: Check if CLAUDE.md exists at project root
    |
    +--> If exists: read it, warn user, ask to overwrite via AskUserQuestion
    |
Step 3: Launch Atlas agent -- full codebase analysis
    |    (reuse /rpi:init Step 6 pattern from commands/rpi/init.md lines 106-151)
    |    Atlas output: Stack, Conventions, Architecture, Rules, Key Files, Commands
    |
Step 4: Launch Quill agent -- generate CLAUDE.md content from Atlas output
    |    Quill receives Atlas output + CLAUDE.md target structure
    |    Quill output: complete CLAUDE.md content
    |
Step 5: Preview output to user, confirm before writing via AskUserQuestion
    |
Step 6: Write CLAUDE.md to project root
    |
Step 7: Output summary
```

Why two agent passes instead of one: Atlas is read-only (`agents/atlas.md` line 9: "You are READ-ONLY -- never modify files"). It can analyze but cannot write. Quill writes but is not an explorer. Combining both in a single agent would violate Atlas's read-only constraint and Quill's scoped persona. The existing `/rpi:docs` command (`commands/rpi/docs.md` lines 60-112) follows this same two-phase pattern: gather context first, then launch Quill to write.

---

## 2. Dependencies

### External Dependencies

None. No new npm packages required.

### Internal Dependencies

| Module | File | Role in /rpi:docs-gen |
|--------|------|----------------------|
| Atlas agent | `agents/atlas.md` | Codebase analysis (R1-R8 from RESEARCH.md) |
| Quill agent | `agents/quill.md` | CLAUDE.md content generation (R9) |
| .rpi.yaml | project root (optional) | `commit_style` for Commands section in output |
| Agent tool | Claude Code built-in | Spawn Atlas and Quill |
| AskUserQuestion tool | Claude Code built-in | Overwrite confirmation, preview confirmation |

### Config Usage

`.rpi.yaml` is optional. If present, `commit_style` is used to inform the generated CLAUDE.md's Conventions section. If absent, defaults are used silently -- same pattern as `/rpi:learn`.

---

## 3. Command Design: /rpi:docs-gen

### File: `commands/rpi/docs-gen.md`

### Frontmatter

```yaml
---
name: rpi:docs-gen
description: Analyze the codebase and generate a CLAUDE.md with project rules, conventions, and architecture.
argument-hint: ""
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Agent
  - AskUserQuestion
---
```

### Step-by-Step Process

#### Step 1: Load config

Read `.rpi.yaml` from the project root. Extract `commit_style` (default: `conventional`). If `.rpi.yaml` does not exist, use defaults silently.

#### Step 2: Check for existing CLAUDE.md

Check if `CLAUDE.md` exists at the project root.

- If it exists: read it and store as `$EXISTING_CLAUDE_MD`. Proceed to Step 3.
- If it does not exist: set `$EXISTING_CLAUDE_MD` to empty. Skip to Step 4.

#### Step 3: Handle existing CLAUDE.md

Ask with AskUserQuestion:
- A) Overwrite -- generate a new CLAUDE.md from scratch (existing content will be replaced)
- B) Cancel -- keep the existing file unchanged

If cancel: output "No changes made." and stop.

#### Step 4: Launch Atlas for codebase analysis

Adapted from `/rpi:init` Step 6 with additions: Key Files enumeration and useful Commands detection.

Atlas prompt produces: Stack, Architecture, Conventions, Key Files, Commands, Rules sections.

Wait for Atlas to complete. Store output as `$ATLAS_ANALYSIS`.

#### Step 5: Launch Quill to generate CLAUDE.md

Quill receives Atlas output + target CLAUDE.md structure + optional existing CLAUDE.md content.

Target structure: Behavior, Code, Stack, Architecture, Conventions, Commands.

Constraint: under 80 lines total (CLAUDE.md is read on every AI invocation).

Wait for Quill to complete. Store output as `$CLAUDE_MD_CONTENT`.

#### Step 6: Preview and confirm

Show generated content to user. Ask to confirm before writing via AskUserQuestion.

#### Step 7: Write CLAUDE.md

Write `$CLAUDE_MD_CONTENT` to `CLAUDE.md` at the project root.

#### Step 8: Output summary

Output line count, sections generated, and tip to review/edit manually.

---

## 4. CLAUDE.md Output Structure

```markdown
# Project Rules

## Behavior
{3-6 rules about development behavior}

## Code
{3-6 rules about code style}

## Stack
{Language, Framework, Database, Testing, Build}

## Architecture
{Directory map with purposes}

## Conventions
{Import style, API patterns, error handling}

## Commands
{Useful dev commands: run, test, build, lint}
```

Target: under 80 lines. Every rule must be actionable and project-specific.

---

## 5. File Structure

### New Files

| File | Description |
|------|-------------|
| `commands/rpi/docs-gen.md` | The `/rpi:docs-gen` command |

### Modified Files

| File | What Changes |
|------|-------------|
| `.claude-plugin/marketplace.json` | Add `"./commands/rpi/docs-gen.md"` to commands array (between docs.md and implement.md) |
| `test/commands.test.js` | Add `"docs-gen"` to EXPECTED_COMMANDS array |
| `skills/rpi-workflow/SKILL.md` | Add `/rpi:docs-gen` to Utility Commands block |

### Files NOT Modified

- `agents/atlas.md` -- Used as-is, extended prompt is in the command
- `agents/quill.md` -- Used as-is, CLAUDE.md generation is prompt-driven
- `commands/rpi/rpi.md` -- Auto-flow only handles pipeline phases

---

## 6. Testing Strategy

### Automated Tests

Existing test suite covers:
1. File existence check (EXPECTED_COMMANDS <-> file on disk)
2. Frontmatter validation (name, description, allowed-tools)
3. No unexpected files check (bidirectional)

No new test cases needed for MVP.

### Manual Testing Checklist

1. Run `/rpi:docs-gen` on project without CLAUDE.md -- verify full flow
2. Run again with existing CLAUDE.md -- verify overwrite/cancel prompt
3. Run on empty project -- verify graceful degradation
4. Run `node --test test/commands.test.js` -- verify all tests pass

---

## 7. Edge Cases

| Scenario | Handling |
|----------|----------|
| Empty project | Atlas outputs N/A sections, Quill generates minimal CLAUDE.md |
| Existing CLAUDE.md | Binary overwrite/cancel via AskUserQuestion |
| No .rpi.yaml | Defaults used silently |
| Very large project | Atlas samples 5-10 representative files |
| Monorepo | Root-level CLAUDE.md covers whole repo (per-package is v2) |

---

## 8. Technical Decisions

| Decision | Chosen | Why |
|----------|--------|-----|
| Agent composition | Atlas + Quill (two passes) | Atlas is read-only, Quill expects pre-digested context |
| Command name | `/rpi:docs-gen` | All 6 research agents converged on this name |
| Overwrite UX | Binary overwrite/cancel | Merge requires section markers (v2) |
| Auto-commit | No | Project setup, user may want to edit first |
| Atlas prompt | Extended (add Key Files + Commands) | CLAUDE.md needs actionable commands that context.md omits |
| Quill target length | Under 80 lines | Brevity matters for AI context consumption |
| Preview before writing | Always | Quality risk mitigation (RESEARCH.md Concern 3) |

---

## 9. Implementation Order

1. `commands/rpi/docs-gen.md` -- Create the command file
2. `.claude-plugin/marketplace.json` -- Register the command
3. `test/commands.test.js` -- Add to EXPECTED_COMMANDS
4. `skills/rpi-workflow/SKILL.md` -- Add to Utility Commands
5. Run tests: `node --test test/commands.test.js`
6. Manual test: run `/rpi:docs-gen` on RPIKit's own codebase

**Estimated Complexity: S** -- 1 new file, 3 modified files, no new agents, no new patterns.
