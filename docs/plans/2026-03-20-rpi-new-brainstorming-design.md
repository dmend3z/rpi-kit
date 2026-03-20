# Design: /rpi:new — Brainstorming-Enhanced Feature Kickoff

## Summary

Rewrite `/rpi:new` to merge Luna's requirements interview with Superpowers-style design exploration. The command now interviews the user, proposes 2-3 approaches with tradeoffs, and produces both REQUEST.md (requirements) and DESIGN.md (chosen approach + alternatives). Visual companion via claude-in-chrome for mockups/diagrams when the topic has a visual component.

## Inspiration

- [Superpowers brainstorming skill](https://github.com/obra/superpowers) — design-first gate, one question at a time, approach exploration, spec review loop
- [Skills Best Practices](https://github.com/mgechev/skills-best-practices) — lean prompts, progressive disclosure, third-person imperative, no vague instructions

## Architecture

```
/rpi:new <slug> [--quick]
    |
Step 1: Load config (.rpi.yaml)
    |
Step 2: Determine feature slug (kebab-case)
    |
Step 3: Check for existing feature
    |
Step 4: Scope check
    |    ├── If XL / multiple subsystems → decompose into sub-features
    |    └── Each sub-feature gets its own /rpi:new cycle
    |
Step 5: Luna's adaptive interview (one question at a time)
    |    ├── Standard: max 6-8 individual questions
    |    └── Quick (--quick): max 2 questions
    |
Step 6: Visual Companion offer (optional)
    |    ├── If topic has visual component → offer via AskUserQuestion
    |    ├── If accepted → use claude-in-chrome for mockups/diagrams
    |    └── If declined or backend-only → skip
    |
Step 7: Propose 2-3 approaches
    |    ├── Conceptual: name, 1-line description, ✅ pro, ⚠️ con
    |    ├── Luna recommends one with justification
    |    └── User chooses via AskUserQuestion
    |
Step 8: Create directory structure + write REQUEST.md + DESIGN.md
    |
Step 9: Quality gate (8 criteria) + next steps → /rpi:research
```

## Key Changes vs Current

| Aspect | Current | New |
|--------|---------|-----|
| Interview style | Batches of 2-3 questions | One question at a time |
| Design exploration | None | 2-3 approaches with tradeoffs |
| Scope management | Complexity detection only | XL auto-decomposition |
| Visual support | None | claude-in-chrome companion |
| Output | REQUEST.md only | REQUEST.md + DESIGN.md |
| Quality gate | 5 criteria | 8 criteria |
| Quick mode | Skips design entirely | Design lite (1 approach suggested) |

## New Step Details

### Step 4: Scope Check (NEW)

Before starting the interview, Luna assesses if the feature describes multiple independent subsystems. If so:
1. Flag to user: "This looks like it involves multiple independent pieces"
2. Help decompose into sub-features with clear boundaries
3. Brainstorm the first sub-feature through the normal flow
4. Each sub-feature gets its own `/rpi:new {slug}` cycle

### Step 5: One Question at a Time (CHANGED)

Replace batch-based interview with sequential questions:
- Each question adapts based on the previous answer
- Prefer multiple choice via AskUserQuestion when possible
- Open-ended is fine for exploratory questions
- Max 6-8 questions for standard, max 2 for --quick
- Stop when requirements are concrete enough for downstream agents

Question categories (Luna picks adaptively):
- Core: "What problem does this solve? Who benefits?"
- Scope: "What is explicitly NOT part of this feature?"
- UI/UX: "What does the user see? Any specific interactions?"
- Data: "What data is involved? New tables/models?"
- Integration: "Which services? Rate limits, auth, costs?"
- Decomposition: "Can this be broken into smaller deliverables?"

### Step 6: Visual Companion (NEW)

Offer MUST be its own message (not combined with a question):
> "Some of what we're working on might be easier to explain with visuals in the browser. I can show mockups, diagrams, and comparisons. Want to try it?"

Per-question decision (even after accepting):
- **Use browser** for: wireframes, layout comparisons, architecture diagrams, side-by-side UI
- **Use terminal** for: requirements questions, conceptual choices, tradeoff lists, scope decisions

Implementation: uses `mcp__claude-in-chrome__*` tools. No server, no scripts, no extra files.

### Step 7: Propose Approaches (NEW)

After understanding the problem (post-interview), Luna proposes 2-3 approaches:

```
## Approach A: {Name} (Recommended)
- {1-line description}
- ✅ {main advantage}
- ⚠️ {main risk}

## Approach B: {Name}
- {1-line description}
- ✅ {main advantage}
- ⚠️ {main risk}

Recommendation: A — {1-sentence justification}
```

User chooses via AskUserQuestion. Luna then asks 1-2 clarification questions about the chosen approach (replacing old Batch 3).

### Quick Mode (--quick) Design Lite

- Max 2 interview questions
- Skip visual companion
- 1 approach suggested (no alternatives) — Luna picks the obvious path
- REQUEST.md compact + DESIGN.md minimal (just chosen approach, no alternatives table)

## Output Formats

### REQUEST.md (updated)

Same format as current, no structural changes:

```markdown
# {Feature Title}

## Summary
{1-3 sentences}

## Problem
{What problem, who is affected}

## Target Users
{Who will use this}

## Constraints
- {constraint 1}
- {constraint 2}

## References
- {links, examples, inspiration}

## Unknowns
- {at least 1}

## Complexity Estimate
{S | M | L | XL} — {justification}

## Quick Flow (only if --quick)
This feature was flagged for quick flow.
Suggested approach: {1-2 sentences}.
```

### DESIGN.md (NEW)

```markdown
# {Feature Title} — Design

## Chosen Approach
{Name of chosen approach}
{1-2 sentences describing the approach}

## Why This Approach
- {reason 1}
- {reason 2}

## Alternatives Considered

### {Approach B}
- {what it is}
- ✅ {advantage}
- ⚠️ {risk}
- ❌ Rejected: {reason}

### {Approach C} (if exists)
- {what it is}
- ✅ {advantage}
- ⚠️ {risk}
- ❌ Rejected: {reason}

## Key Decisions
| Decision | Chosen | Why |
|----------|--------|-----|
| {decision 1} | {choice} | {justification} |

## Visual References
- {links to mockups/screenshots if visual companion was used, or "None"}

## Complexity Estimate
{S | M | L | XL} — {justification}
```

## Quality Gate (Expanded)

Luna self-validates before delivering output:

| # | Criterion | Check |
|---|-----------|-------|
| 1 | Concrete requirements | Every requirement can be tested (Given/When/Then possible) |
| 2 | Problem clarity | Problem section names specific users AND specific pain |
| 3 | Unknowns captured | At least 1 unknown listed |
| 4 | Complexity justified | Estimate has 1-sentence justification |
| 5 | No vague language | No "various", "etc.", "and more" in requirements |
| 6 | Approaches explored | 2+ approaches considered with tradeoffs |
| 7 | Tradeoffs documented | Each alternative has pros AND cons |
| 8 | Recommendation justified | Chosen approach has explicit rationale |

Scoring:
- 8/8 → PASS
- 6-7/8 → WEAK (deliver with warning)
- 0-5/8 → FAIL (re-examine, retry once)

Appended to both REQUEST.md and DESIGN.md:
```
Quality: {PASS|WEAK|FAIL} ({N}/8 criteria met)
```

## Downstream Impact

### Commands to update

| Command | Change | Detail |
|---------|--------|--------|
| `commands/rpi/research.md` | Step 3 | Read DESIGN.md after REQUEST.md, pass to agents |
| `commands/rpi/plan.md` | Step 4 | Read DESIGN.md alongside REQUEST.md + RESEARCH.md |
| `commands/rpi/implement.md` | Step 2 | Read DESIGN.md alongside PLAN.md + eng.md |

All agents in these phases receive DESIGN.md as additional context. No agent behavior changes needed — they just get more input.

## Files Affected

### Rewrite
- `commands/rpi/new.md` — full rewrite with 9-step brainstorming flow

### Update
- `agents/luna.md` — expanded persona (brainstorming + interview), quality gate 5→8 criteria

### Edit (minor)
- `commands/rpi/research.md` — add DESIGN.md read in Step 3
- `commands/rpi/plan.md` — add DESIGN.md read in Step 4
- `commands/rpi/implement.md` — add DESIGN.md read in Step 2

### Not Modified
- No new agent files
- No new commands or skills
- `marketplace.json` — unchanged (command name stays)
- `test/commands.test.js` — unchanged (command name stays)

## Decisions

| Decision | Chosen | Why |
|----------|--------|-----|
| Merge vs separate brainstorming | Merge into /rpi:new | Single flow, no friction switching between commands |
| Batch vs one-at-a-time questions | One at a time | Superpowers pattern — more adaptive, better follow-ups |
| REQUEST.md vs DESIGN.md | Both (separate files) | Clear separation: requirements vs design decisions |
| Self-review vs Hawk review | Luna self-review | Consistent with RPIKit quality gate pattern, no sub-agent overhead |
| Visual companion implementation | claude-in-chrome | Already installed, no extra server/scripts needed |
| Quick mode design | Design lite (not skip) | Every feature deserves design, even small ones |
| XL scope handling | Auto-decompose | Prevents wasted design work on too-large features |
| Transition after /rpi:new | /rpi:research (unchanged) | Pipeline order stays the same |

## Complexity Estimate

M — 1 rewrite (new.md), 1 update (luna.md), 3 minor edits (downstream commands). No new files, no new infrastructure. Prompts are the main work.
