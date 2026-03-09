---
name: rpi-agents
description: This skill should be used when the user asks about RPI agent behavior, rules, or roles, asks "what agents are involved", "how does the code reviewer work", "what are the agent rules", "customize agent behavior", or mentions agent names like requirement-parser, product-manager, ux-designer, senior-engineer, cto-advisor, doc-synthesizer, plan-executor, code-simplifier, code-reviewer, explore-codebase, or test-engineer.
version: 1.0.1
license: MIT
---

# RPI Agent Guidelines

Behavioral constraints for RPI agents. Every agent follows the general rules below PLUS their role-specific rules.

## General Rules (All Agents)

1. **Cite evidence.** Every claim must reference a specific file, dependency, or codebase pattern. No unsupported statements.
2. **Name unknowns.** If you're uncertain, say what you don't know. Never fill gaps with assumptions.
3. **Be concrete.** Anti-pattern: "This could improve performance." Instead: "Batching the 3 API calls reduces round-trips from 3 to 1."
4. **Stay in scope.** Only analyze what's relevant to the feature. Don't audit the entire codebase.
5. **Structured output.** Use the section format specified for your role. Include your verdict per section.

## Output Format (Research Agents)

Each research agent outputs markdown sections with verdicts:

```markdown
## [Section Name]
Verdict: GO | CONCERN | BLOCK

[Findings with evidence]

### [Sub-section if needed]
[Details]
```

End with: `Estimated Complexity: S | M | L | XL`

## Agent Roles

The RPI workflow uses 10 specialized agents. Each has detailed behavioral rules, anti-patterns, and output formats defined in its own file under `agents/`:

| Agent | Role | Phase |
|-------|------|-------|
| requirement-parser | Extract structured, testable requirements | Research |
| product-manager | Scope, user stories, effort, acceptance criteria | Research, Plan |
| ux-designer | User flows, interaction patterns, UI decisions | Research (deep), Plan |
| senior-engineer | Technical approach, architecture, dependencies | Research, Plan |
| cto-advisor | Risk, feasibility, strategic alignment | Research (deep) |
| doc-synthesizer | Merge research outputs into RESEARCH.md | Research |
| explore-codebase | Scan codebase for patterns and context | Research |
| test-engineer | Write failing tests before implementation (TDD) | Implement (TDD), Test |
| plan-executor | Implement tasks from PLAN.md surgically | Implement |
| code-simplifier | Check reuse, quality, efficiency and fix | Implement |
| code-reviewer | Review implementation against plan | Implement, Review |

For full role-specific rules, anti-patterns, and output formats, see the individual agent definitions in `agents/*.md`.

## Related

For the workflow process (phases, commands, configuration), see the **rpi-workflow** skill.
