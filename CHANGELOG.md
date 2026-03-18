# Changelog

## [2.5.1] - 2026-03-18

### Fixed
- Add `gemini-extension.json` manifest — fixes `gemini extensions link` failing with "Configuration file not found"
- Include `gemini-extension.json` in npm package

## [2.5.0] - 2026-03-18

### Added
- **Full Gemini CLI Support**: RPIKit now works natively in Gemini CLI as an extension.
- **TOML Commands**: Automatically generated 18 commands in `.gemini/commands/rpi/` for Gemini CLI.
- **Self-Installation**: Updated `bin/cli.js` to support automatic extension linking via `rpi-kit install --gemini`.
- **NPM Package**: Updated `files` in `package.json` to include `.gemini/` directory for npm distribution.
- **Multi-tool Update**: `rpi-kit update` now updates all detected tools (Claude Code, Codex, Gemini CLI) in one command.

## [2.4.0] - 2026-03-18

### Added
- /rpi:fix quick bugfix command — Luna interviews, Mestre plans (max 3 tasks), Forge implements, all in one step
- Auto-flow detection now skips research if PLAN.md already exists (supports /rpi:fix artifacts)

## [2.0.0] - 2026-03-17

### Breaking Changes
- Complete rewrite -- v1 command files replaced
- New directory structure: rpi/features/, rpi/specs/, rpi/solutions/
- .rpi.yaml schema changed (v1 configs need re-init)

### Added
- 13 named agents with rich personas (Luna, Atlas, Scout, Nexus, Mestre, Clara, Pixel, Forge, Sage, Razor, Hawk, Shield, Quill)
- /rpi auto-flow command (detects phase and progresses)
- /rpi:party multi-agent debate mode
- /rpi:learn knowledge compounding
- /rpi:archive delta spec merging
- /rpi:onboarding guided first-time setup
- Delta specs system (rpi/specs/ + rpi/features/{slug}/delta/)
- Knowledge base (rpi/solutions/)
- Project context (rpi/context.md)
- Quick flow (--quick flag)
- Adversarial review (Hawk forced to find problems)
- Security audit (Shield -- OWASP, secrets scan)

### Removed
- v1 agents (requirement-parser, explore-codebase, senior-engineer, etc.)
- /rpi:test (merged into implement via Sage)
- /rpi:add-todo
- /rpi:set-profile
- Session isolation tiers
- Change/sub-feature system

## [Unreleased]

### Added

- **Model Profiles** -- 4 pre-defined profiles (`quality-first`, `balanced`, `speed-first`, `budget`) that control which AI model runs each workflow phase
- **`/rpi:set-profile` command** -- display current profile, switch between profiles, or remove profile interactively
- **Per-phase model overrides** -- customize individual phases in `.rpi.yaml` `models:` block (overrides take precedence over profile)
- **Profile selection in `/rpi:init`** -- Batch 5 asks about model profile during project initialization
- **Active profile in `/rpi:status`** -- status output now shows the active profile with phase-model mapping

### Changed

- **Separate sessions for simplify and review** -- `/rpi:implement` no longer runs simplify/review inline; outputs next-step instructions to run each in a fresh session for better accuracy
- Removed `auto_simplify` and `review_after_implement` config keys (no longer needed)
- Removed `--skip-simplify` and `--skip-review` flags from `/rpi:implement`
- 7 commands (`/rpi:research`, `/rpi:plan`, `/rpi:implement`, `/rpi:test`, `/rpi:simplify`, `/rpi:review`, `/rpi:docs`) now resolve model via the Model Resolution Algorithm and pass `model` parameter to Agent tool invocations
- `skills/rpi-workflow/SKILL.md` extended with Model Resolution Algorithm section and config schema for `profile`/`models` keys

## 0.2.0

### Added

- **Test-Driven Development (TDD) workflow** -- strict RED -> GREEN -> REFACTOR cycles integrated into the implementation phase
- **Test Engineer agent** (`agents/test-engineer.md`) -- writes one failing test at a time before implementation, follows strict TDD discipline
- **`/rpi:test` command** -- standalone TDD cycles per task (`--task <id>`) or all tasks (`--all`), works independently of `/rpi:implement`
- **`Test:` field in PLAN.md** -- every task now includes a behavior assertion describing what to test (e.g., "returns 404 for missing user")
- **TDD config options** in `.rpi.yaml`: `tdd: true/false` and `test_runner: auto|command`
- **Test coverage checks** in `/rpi:review` -- verifies tests exist, exercise public interfaces, and cover edge cases
- **TDD init questions** in `/rpi:init` -- Batch 4 asks about TDD preference and test runner

### Changed

- `/rpi:implement` now branches per task: TDD mode (RED -> VERIFY -> GREEN -> VERIFY -> REFACTOR) or classic mode based on config
- `/rpi:plan` task format includes `Test:` field and enforces concrete test descriptions
- `/rpi:review` adds test coverage as a review dimension alongside completeness, correctness, and deviations
- Agent count updated from 10 to 11 across all docs
- Comparison table includes TDD row as differentiator

## 0.1.0

### Added

- Initial release
- Research -> Plan -> Implement workflow with validation gates
- 10 specialized agents (requirement-parser, product-manager, ux-designer, senior-engineer, cto-advisor, doc-synthesizer, explore-codebase, plan-executor, code-simplifier, code-reviewer)
- Research tiers (quick, standard, deep) with parallel fan-out
- Adaptive plan artifacts (PLAN.md, eng.md, pm.md, ux.md)
- Smart execution mode (sequential vs parallel waves)
- Code simplification (reuse, quality, efficiency)
- Code review against plan requirements
- Cross-session continuity via markdown files
- Codex compatibility via AGENTS.md and codex.md
