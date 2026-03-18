# Research: Project Doc Generator

## Executive Summary
Verdict: **GO with concerns**
Complexity: M (MVP) / XL (full request -- deferred)
Risk: Medium
Recommendation: Build MVP as `/rpi:docs-gen` generating CLAUDE.md only, reusing Atlas + Quill, no new agents.
Key finding: Atlas already handles 60-70% of the codebase analysis; the full XL request has an 80/20 problem where CLAUDE.md generation alone delivers 80% of value at 20% of effort.

---

## Requirements Analysis

### Functional Requirements (22 identified)

**FR-A: Codebase Analysis Engine**
- R1: Detect programming languages (file extensions, config files: package.json, pyproject.toml, Cargo.toml, go.mod)
- R2: Detect frameworks and versions (React 18, Express 4, Django 5)
- R3: Detect tooling (linters, formatters, bundlers, CI/CD)
- R4: Map directory structure and organizational pattern
- R5: Identify APIs (REST, GraphQL) and list endpoints
- R6: Detect architectural patterns (MVC, Clean Architecture, layered)
- R7: Analyze dependencies and versions from manifest files
- R8: Identify code conventions (naming, style, test patterns)

**FR-B: Document Generation**
- R9: Generate CLAUDE.md with project rules, structure, conventions, commands
- R10: Generate AGENTS.md listing agents and when to use them
- R11: Generate README.md with overview, setup, usage, contribution
- R12: Support custom templates (ADRs, API docs)

**FR-C: Incremental Analysis**
- R13: Detect what changed since last generation
- R14: Update only affected sections
- R15: Show diff before applying

**FR-D: Continuous Update / Manual Preservation**
- R16: Allow re-running to update existing docs
- R17: Preserve manually edited sections
- R18: Distinguish auto-generated from manually written sections (markers/metadata)

**FR-E: Invocation Modes**
- R19: Manual command (/rpi:docs-gen)
- R20: RPIKit Skill auto-invoked by Claude

**FR-F: Safety**
- R21: Never overwrite manual content without confirmation
- R22: Analysis is read-only -- never modify source code

### MVP Scope (R1-R9, R19, R21-R22 only)

The MVP addresses 12 of 22 requirements. Deferred: R10-R18, R20. See "Phasing" in Technical Analysis.

### Non-Functional Requirements
- NR1: Complete analysis of ~500 files in reasonable time (undefined threshold -- CONCERN)
- NR2: Work with any programming language/framework
- NR3: Match existing doc style/tone when updating

### Unknowns and Ambiguities (10 identified)

| ID | Unknown | Resolution for MVP |
|----|---------|-------------------|
| U1 | "Reasonable time" undefined | Defer -- Atlas already operates within acceptable time for /rpi:init |
| U2 | Command naming conflict with /rpi:docs | Resolved: use /rpi:docs-gen (all 6 agents agree) |
| U3 | Overlap with /rpi:init and /rpi:onboarding | /rpi:docs-gen focuses on user-facing docs, not internal rpi/context.md |
| U4 | AGENTS.md scope for arbitrary projects | Defer to v2 |
| U5 | Custom templates format and discovery | Defer -- premature generalization, zero evidence of demand |
| U6 | Incremental change detection mechanism | Defer to v2 |
| U7 | Manual section preservation marker format | Defer to v2; HTML comment markers (`<!-- rpi:auto-start:section -->`) proposed |
| U8 | Skill auto-trigger conditions | Defer -- no skill in v1, command-only |
| U9 | CLAUDE.md scope: generate from scratch vs augment | Generate from analysis; if file exists, show diff and confirm before writing |
| U10 | Which agents drive this? | Atlas (analysis) + Quill (generation), no new agent needed |

---

## Product Scope

### User Value

The problem is real but partially addressed by existing tools:

| Pain Point | Current Solution | Gap |
|-----------|-----------------|-----|
| AI context setup | /rpi:init generates rpi/context.md | No CLAUDE.md generation |
| Outdated docs | /rpi:docs updates docs post-feature | Only works inside RPI pipeline, not standalone |
| Dev onboarding | /rpi:onboarding analyzes codebase | Doesn't produce standalone project docs |

Net new value: Users wanting a CLAUDE.md for their project have no RPIKit tool. This is the highest-impact gap.

### Effort vs Impact Matrix

| Item | Effort | Impact | MVP? |
|------|--------|--------|------|
| Codebase analysis (reuse Atlas) | S | Foundation | Yes |
| Generate CLAUDE.md | M | High -- killer use case | Yes |
| Generate AGENTS.md | S | Low -- niche audience | No (v2) |
| Generate README.md | M | Medium -- risk of overwriting good READMEs | No (v2) |
| Custom templates | L | Low -- no evidence of demand | No (v3 or never) |
| Incremental analysis | XL | Medium -- nice-to-have | No (v2) |
| Continuous updates / section markers | L | Medium | No (v2) |
| Skill auto-invocation | M | Medium | No (v2) |
| New command /rpi:docs-gen | S | High -- entry point | Yes |

### MVP Definition (M, 1-2 days)

- New command: `/rpi:docs-gen`
- Reuse Atlas for codebase analysis
- Reuse Quill for CLAUDE.md generation
- Simple overwrite protection: detect existing file, preview output, confirm before writing
- No incremental tracking, no section markers, no custom templates, no skill, no AGENTS.md/README.md
- Files touched: 1 new command, marketplace.json, test/commands.test.js

### Deferred Phases

- **v2**: README.md, AGENTS.md, `--refresh` mode with section markers, skill auto-invocation
- **v3 or never**: Custom templates, continuous updates with merge-conflict resolution

---

## Codebase Context

### Existing Capabilities to Reuse

1. **Atlas agent** (`agents/atlas.md`) -- already performs core codebase analysis: config files, directory structure, conventions, architecture patterns. Used in `/rpi:init` (Step 6) and `/rpi:onboarding`. Covers R1-R8 at 60-70%.

2. **Quill agent** (`agents/quill.md`) -- generates README sections, changelogs, API docs. Writing capability exists; needs an extended prompt for CLAUDE.md output format.

3. **/rpi:init orchestration** (`commands/rpi/init.md`, lines 106-151) -- launches Atlas to generate `rpi/context.md`. The exact pattern needed: launch agent, collect output, write file.

### Naming Conflict

`/rpi:docs` (`commands/rpi/docs.md`) already exists for the feature-scoped docs phase (requires IMPLEMENT.md and review pass). The new command must use a different name. All agents converge on `/rpi:docs-gen`.

### Architecture Patterns to Follow

- **Commands**: YAML frontmatter (name, description, argument-hint, allowed-tools), markdown body with numbered steps, spawn agents via Agent tool
- **Agents**: YAML frontmatter, XML-wrapped sections (`<role>`, `<persona>`, `<priorities>`, `<output_format>`)
- **Skills**: YAML frontmatter with trigger description, markdown body with reference content
- **Registration**: `marketplace.json` has commands/agents/skills arrays
- **Tests**: `test/commands.test.js` with EXPECTED_COMMANDS array for existence checks

### Impact Assessment

| Action | File |
|--------|------|
| Create | `commands/rpi/docs-gen.md` |
| Modify | `.claude-plugin/marketplace.json` (add command to commands array) |
| Modify | `test/commands.test.js` (add to EXPECTED_COMMANDS) |
| Possibly modify | `skills/rpi-workflow/SKILL.md` (add to utility commands table) |
| Possibly modify | `skills/rpi-agents/SKILL.md` (mention Quill's extended role) |

No new agents, no new agent files, no new skill file in MVP.

---

## Technical Analysis

### Architecture Approach

Composition of existing agents, not construction of new ones:

```
/rpi:docs-gen (new command)
  Step 1: Load config (.rpi.yaml), check for existing CLAUDE.md
  Step 2: Atlas analyzes codebase (reuse /rpi:init Step 6 pattern)
  Step 3: Quill generates CLAUDE.md from Atlas output (extended prompt)
  Step 4: If CLAUDE.md exists, show preview + confirm; if not, write directly
  Step 5: Output summary
```

Why no new agent: Atlas handles analysis (R1-R8), Quill handles writing (R9). A third agent would duplicate existing roles.

Why separate command from /rpi:docs: Different lifecycle. `/rpi:docs` operates within the feature pipeline (requires IMPLEMENT.md + review pass). `/rpi:docs-gen` is standalone, project-level, no feature context needed.

### Implementation Sequence

1. `commands/rpi/docs-gen.md` -- new command file following existing pattern
2. `.claude-plugin/marketplace.json` -- register the command
3. `test/commands.test.js` -- add `docs-gen` to EXPECTED_COMMANDS
4. `skills/rpi-workflow/SKILL.md` -- add to utility commands table
5. Manual testing with RPIKit's own codebase

### Key Technical Decisions

| Decision | Chosen | Alternative | Rationale |
|----------|--------|-------------|-----------|
| New agent vs extend existing | Extend Atlas + Quill | New "DocGen" agent | Avoids role duplication; Atlas and Quill already do this work |
| Separate command vs extend /rpi:docs | New /rpi:docs-gen | Flag on /rpi:docs | Different lifecycle; /rpi:docs requires feature pipeline context |
| All-at-once vs phased | Phased MVP | Full XL build | P1 delivers core value at M complexity |
| Section markers (v2) | HTML comments | YAML frontmatter | Invisible in rendered markdown, section-level granularity |
| Skill in v1 | No skill | Include skill | Reduces scope; command-only is sufficient for v1 |
| AGENTS.md in v1 | Deferred | Include in P1 | Low impact for arbitrary projects; CLAUDE.md is the killer use case |

### Disagreement Resolution: v1 Scope

Three items had agent disagreement:

1. **AGENTS.md in v1**: CTO says no, Senior Engineer says yes. Resolution: **Defer**. AGENTS.md is RPIKit-specific and low value for arbitrary projects. Focus v1 on the universal use case (CLAUDE.md).

2. **Skill in v1**: CTO says no, UX and Product say yes. Resolution: **Defer**. A skill adds a file and registration overhead. The command alone is sufficient; users can run it explicitly. If usage patterns show demand, add the skill in v2.

3. **README.md in v1**: Product Manager says no, Senior Engineer says yes. Resolution: **Defer**. README overwrite risk is real (many projects have carefully crafted READMEs). CLAUDE.md is greenfield for most projects -- lower risk, higher impact per effort.

---

## Strategic Assessment

### Alignment with RPIKit Mission

RPIKit's core identity is "Research -> Plan -> Implement" pipeline. A standalone doc generator is adjacent, not core. However, CLAUDE.md generation directly enables RPIKit's effectiveness: better project context = better Atlas analysis = better research/plan/implement outcomes. This is an enabler, not a distraction.

### Competitive Landscape

Existing alternatives: forja doc-gen, claude-md-management:claude-md-improver, gsd-codebase-mapper. RPIKit's differentiation is the structured pipeline and named agents, not doc generation. Building a competing full-featured doc generator does not leverage RPIKit's advantage. The smart move is a lightweight composition (Atlas + Quill) that solves the CLAUDE.md gap without becoming a doc-gen product.

### Backlog Context

Two features already in progress:
- agent-model-profiles (L complexity, at IMPLEMENT phase)
- auto-research (XL complexity, at RESEARCH phase)

Adding a third XL feature would create a 3-feature WIP problem. The M-scoped MVP avoids this: 1-2 days of work, ship, gather feedback, then decide on expansion.

### Priority Recommendation

1. agent-model-profiles (finish -- already at IMPLEMENT)
2. auto-research (core pipeline value)
3. project-doc-generator MVP (nice-to-have, low effort)

### Long-term Risk

Full XL implementation carries maintenance burden: multi-language analysis prompts, incremental state tracking, section marker management, merge-conflict resolution. Each of these is a mini system. The phased approach lets usage data drive which of these actually matter.

---

## Concerns

### CONCERN 1: Scope Creep Risk (HIGH)
The original request is XL. Without firm boundaries, implementation could drift toward incremental analysis, custom templates, and continuous updates -- each adding weeks of work.
**Mitigation**: Lock MVP scope to CLAUDE.md generation only. Document deferred items explicitly in PLAN.md. Treat each expansion as a separate feature with its own REQUEST.md.

### CONCERN 2: Undefined Performance Threshold (MEDIUM)
NR1 specifies "reasonable time" for 500-file projects but sets no concrete target. Atlas already operates at acceptable speed for /rpi:init, but CLAUDE.md generation adds a second agent pass.
**Mitigation**: Accept Atlas's current performance as the baseline. If users report slowness, address in v2. Do not pre-optimize.

### CONCERN 3: CLAUDE.md Quality (MEDIUM)
A CLAUDE.md needs actionable project rules, not just a structural dump. Atlas detects patterns but does not formulate rules. Quill writes docs but has never generated a CLAUDE.md.
**Mitigation**: Craft a detailed prompt for Quill that specifies CLAUDE.md structure (rules, conventions, architecture, commands). Test on RPIKit's own codebase. Iterate on prompt quality before shipping.

### CONCERN 4: Naming Confusion with /rpi:docs (LOW)
`/rpi:docs` (feature docs phase) and `/rpi:docs-gen` (project doc generator) are semantically close. Users may confuse them.
**Mitigation**: Document the distinction clearly. `/rpi:docs` = feature-scoped, pipeline-bound. `/rpi:docs-gen` = project-scoped, standalone. Consider renaming to `/rpi:generate-docs` or `/rpi:context-gen` if confusion persists.

### CONCERN 5: Strategic Drift (LOW)
Building doc generation tools moves RPIKit toward "general developer productivity" and away from its core "structured feature development" identity.
**Mitigation**: Frame `/rpi:docs-gen` as an enabler for the core pipeline, not a standalone product. Keep scope minimal. Do not market it as a primary feature.

---

## Appendix: Full Requirements Traceability

| Req | Description | MVP | v2 | v3 |
|-----|-------------|-----|----|----|
| R1-R8 | Codebase analysis | Yes (via Atlas) | - | - |
| R9 | Generate CLAUDE.md | Yes | - | - |
| R10 | Generate AGENTS.md | - | Yes | - |
| R11 | Generate README.md | - | Yes | - |
| R12 | Custom templates | - | - | Yes |
| R13-R15 | Incremental analysis | - | Yes | - |
| R16-R18 | Continuous updates / preservation | - | Yes | - |
| R19 | Manual command | Yes | - | - |
| R20 | Skill auto-invocation | - | Yes | - |
| R21 | No overwrite without confirmation | Yes | - | - |
| R22 | Read-only analysis | Yes | - | - |
