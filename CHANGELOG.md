# Changelog

## 0.2.0

### Added

- **Test-Driven Development (TDD) workflow** — strict RED → GREEN → REFACTOR cycles integrated into the implementation phase
- **Test Engineer agent** (`agents/test-engineer.md`) — writes one failing test at a time before implementation, follows strict TDD discipline
- **`/rpi:test` command** — standalone TDD cycles per task (`--task <id>`) or all tasks (`--all`), works independently of `/rpi:implement`
- **`Test:` field in PLAN.md** — every task now includes a behavior assertion describing what to test (e.g., "returns 404 for missing user")
- **TDD config options** in `.rpi.yaml`: `tdd: true/false` and `test_runner: auto|command`
- **Test coverage checks** in `/rpi:review` — verifies tests exist, exercise public interfaces, and cover edge cases
- **TDD init questions** in `/rpi:init` — Batch 4 asks about TDD preference and test runner

### Changed

- `/rpi:implement` now branches per task: TDD mode (RED → VERIFY → GREEN → VERIFY → REFACTOR) or classic mode based on config
- `/rpi:plan` task format includes `Test:` field and enforces concrete test descriptions
- `/rpi:review` adds test coverage as a review dimension alongside completeness, correctness, and deviations
- Agent count updated from 10 to 11 across all docs
- Comparison table includes TDD row as differentiator

## 0.1.0

### Added

- Initial release
- Research → Plan → Implement workflow with validation gates
- 10 specialized agents (requirement-parser, product-manager, ux-designer, senior-engineer, cto-advisor, doc-synthesizer, explore-codebase, plan-executor, code-simplifier, code-reviewer)
- Research tiers (quick, standard, deep) with parallel fan-out
- Adaptive plan artifacts (PLAN.md, eng.md, pm.md, ux.md)
- Smart execution mode (sequential vs parallel waves)
- Code simplification (reuse, quality, efficiency)
- Code review against plan requirements
- Cross-session continuity via markdown files
- Codex compatibility via AGENTS.md and codex.md
