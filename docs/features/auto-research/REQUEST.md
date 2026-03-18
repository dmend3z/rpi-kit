# Auto-Research Loop

## Summary

Transform `/rpi:research` from a single-pass research pipeline into an iterative, goal-driven research loop. The AI autonomously runs multiple research iterations — planning experiments, executing them (web search, PoC code, agent specialization), evaluating results, and keeping only improvements — until the research meets quality thresholds or the user intervenes. Auto-research becomes the default behavior; `--no-auto` preserves single-pass mode.

## Problem

Current research runs once and delivers whatever it finds. For complex features, a single pass often leaves gaps: unknown risks, untested assumptions, missing benchmarks, or shallow analysis of alternatives. Users must manually re-run research or supplement it themselves. There's no mechanism for the AI to identify its own blind spots and iteratively improve.

## Target Users

- RPIKit users researching complex features (M/L/XL complexity)
- Users who want to "set and forget" research overnight
- Teams that need high-confidence research before committing to implementation

## Detailed Specification

### Loop Mechanics

| Aspect | Decision |
|--------|----------|
| Default behavior | Auto-research is ON by default. `--no-auto` for single-pass |
| Max iterations | 3-5 (configurable), with opt-out after each iteration |
| Evaluation | AI self-evaluation using keep-best strategy |
| Stagnation handling | Pivot strategy once, then fallback to asking the user |
| Cost management | Limit scope per iteration to 1-2 focused gaps |

### Goal System (Composite)

The loop evaluates progress against four combined metrics:

1. **Coverage of risks/unknowns** — % of identified unknowns with concrete answers
2. **Confidence score** — Overall research confidence (1-10 scale)
3. **User-defined criteria** — Specific goals from REQUEST.md (e.g., "benchmark 3 libs", "working PoC")
4. **Checklist completeness** — Key questions checklist, loop runs until all answered

### Experiment Types (Adaptive Mix)

The orchestrator agent decides which type of experiment to run per iteration based on gaps:

- **Web search + synthesis** — Fetch external info, refine RESEARCH.md
- **PoC code + test** — Write mini proof-of-concept, run tests, capture results
- **Agent specialization** — Spawn focused agents for specific gaps (e.g., security review, performance analysis)

### Agent Strategy

- **Iteration 1**: Full research pipeline (all standard agents)
- **Iteration 2-N**: Orchestrator agent analyzes gaps and decides which agents to spawn
- New agent: **research-orchestrator** — analyzes RESEARCH.md after each iteration, identifies gaps, selects strategy for next iteration

### Output Strategy

- Progressively overwrites RESEARCH.md (git history preserves all versions)
- Each iteration commits before overwriting (safety net)
- Keep-best: only replaces if new version is strictly better

### PoC Handling

- PoCs live in `{feature}/research/poc/` directory
- Persist between iterations (user can inspect)
- Results captured in RESEARCH.md regardless of PoC success/failure

### UX Between Iterations

After each iteration, show via AskUserQuestion:
- What improved since last iteration
- What gaps remain
- Current composite score
- Options: "Continue", "Stop (deliver current best)", "Change direction"

### RESEARCH.md Schema Extensions

Extend existing template (don't rewrite) with:
- `## Research Metadata` section: iteration count, composite score, gaps remaining
- `## Iteration Log` section: brief log of what each iteration did and its impact
- `## Open Questions Checklist` section: tracked checklist of key questions

### Web Access

AI decides when web search is needed per iteration. Not forced, not blocked. Useful for external libs, benchmarks, documentation, competitive analysis.

## Constraints

- Must be backwards compatible: `--no-auto` gives exact current behavior
- Must work within Claude Code's agent/tool framework (no external services)
- Keep-best strategy must prevent regression (never deliver worse than previous best)
- PoC code must not pollute the main codebase (contained in research/poc/)
- Cost-conscious: each iteration focuses on 1-2 gaps, not full re-research
- Stagnation detection: 2 iterations without improvement triggers pivot or user intervention

## References

- Current research command: `commands/rpi/research.md`
- Current research agents: `agents/requirement-parser.md`, `agents/explore-codebase.md`, `agents/senior-engineer.md`, `agents/product-manager.md`, `agents/cto-advisor.md`, `agents/ux-designer.md`
- Current doc-synthesizer: `agents/doc-synthesizer.md`
- Inspiration: ML auto-research pattern (hyperparameter tuning loops)
- LinkedIn post concept: "Set a goal. AI runs experiments all night. You wake up to the winners."

## Complexity Estimate

XL — New orchestrator agent, loop mechanics in research command prompt, RESEARCH.md schema changes, PoC infrastructure, composite scoring system, stagnation detection, and backwards-compatible flag system. Touches the core research pipeline (most complex command in RPIKit).
