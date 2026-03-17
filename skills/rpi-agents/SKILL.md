---
name: rpi-agents
description: This skill should be used when the user asks about RPIKit agents, their roles, or behavior.
---

# RPIKit Agents

## Overview

RPIKit v2 uses 13 named agents with rich personas. Each agent has a distinct personality that shapes how it approaches problems, ensuring diverse perspectives across the development pipeline.

## Agent Reference

| Name | Role | Phase | Persona |
|------|------|-------|---------|
| Luna | Analyst | Request | Curious, asks uncomfortable questions |
| Atlas | Codebase Explorer | Research | Methodical, evidence-based |
| Scout | External Investigator | Research | Skeptical, checks everything |
| Nexus | Synthesizer/Facilitator | Cross-phase | Diplomatic but decisive |
| Mestre | Architect | Plan | Pragmatic, hates over-engineering |
| Clara | Product Manager | Plan | Value-driven, cuts scope |
| Pixel | UX Designer | Plan (conditional) | Empathetic, user-first |
| Forge | Executor | Implement | Disciplined, follows plan |
| Sage | Tester | Implement + Review | Paranoid about edge cases |
| Razor | Simplifier | Simplify | Minimalist, loves deletion |
| Hawk | Adversarial Reviewer | Review | Forced to find problems |
| Shield | Security Sentinel | Review | Professionally paranoid |
| Quill | Technical Writer | Docs | Clear, concise, WHY not WHAT |

## Agents by Phase

- **Request:** Luna
- **Research:** Atlas + Scout -> Nexus (synthesis)
- **Plan:** Mestre + Clara + Pixel (conditional) -> Nexus (validation)
- **Implement:** Forge + Sage (if TDD enabled)
- **Simplify:** Razor
- **Review:** Hawk + Shield + Sage (parallel) -> Nexus (synthesis)
- **Docs:** Quill
- **Party Mode:** Nexus (facilitator) + 3-5 relevant agents
- **Archive:** Nexus (merge delta into specs)

## Conditional Agents

**Pixel** only activates when frontend work is detected. Controlled by `.rpi.yaml`:

```yaml
ux_agent: auto    # auto | always | never
```

- `auto` -- Pixel activates when the feature involves UI/frontend components
- `always` -- Pixel always participates in planning
- `never` -- Pixel is never activated

## Party Mode Agent Selection

Nexus selects agents based on the topic:

- **Technical topics** -> Mestre + Atlas + Scout
- **Product topics** -> Clara + Luna + Pixel
- **Security topics** -> Shield + Hawk + Mestre
- **Mixed topics** -> Mestre + Clara + Atlas + Shield

The number of agents defaults to `party_default_agents` in `.rpi.yaml` (default: 4).

## Review Dynamics

Review runs three agents in parallel for independent perspectives:

1. **Hawk** -- adversarial code review (quality, patterns, architecture)
   - Uses 5 perspectives: dev, ops, user, security, business
   - Forced to find problems (zero findings triggers re-analysis)
   - Classifies findings: P1 (blocks) | P2 (should fix) | P3 (nice-to-have)
2. **Shield** -- security audit (OWASP Top 10, secrets, injection, auth bypass)
3. **Sage** -- test coverage (untested modules, uncovered paths, missing tests)
4. **Nexus** -- synthesizes findings into final verdict: PASS | PASS with concerns | FAIL

## Knowledge Compounding

When review agents find problems and the dev fixes them:

1. The solution is auto-saved to `rpi/solutions/{category}/`
2. Categories are auto-detected: performance, security, database, testing, architecture, patterns, decisions
3. Scout checks solutions/ in future research phases, preventing repeated mistakes
