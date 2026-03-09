# Onboarding Redesign — Design Document

Date: 2026-03-07
Status: Approved

## Summary

Replace the existing `/rpi:onboarding` command with a new experience that auto-analyzes the user's codebase, generates a persistent project profile, suggests features to build, and guides the user through their first feature interactively.

## Architecture

Single command (`/rpi:onboarding`) with 5 internal phases:

```
Phase 1: Welcome (brief pipeline explanation)
Phase 2: Codebase Analysis (3 parallel agents)
Phase 3: Profile Generation (.rpi-profile.md + /rpi:init if needed)
Phase 4: User Priorities (present suggestions, ask preferences)
Phase 5: Guided First Feature (4 options: build suggestion, describe own, demo, exit)
```

## Phase 2: Analysis Agents

Three parallel agents with focused scopes:

### Agent A: Stack & Conventions Scanner
- Scans project config files (package.json, tsconfig, Cargo.toml, pyproject.toml, etc.)
- Reads 5-10 representative source files for pattern detection
- Outputs: Stack, Conventions, Architecture sections

### Agent B: Code Health Scanner
- Searches for TODO/FIXME/HACK/XXX markers
- Analyzes test coverage gaps (test files vs source files)
- Checks dependency health (npm audit or similar)
- Outputs: Health section, Suggested Features

### Agent C: Git & History Analyzer
- Analyzes git log (30 days), file change frequency, contributor count
- Checks for GitHub Issues via gh CLI (graceful degradation if unavailable)
- Outputs: Git Insights, Risks section, additional feature suggestions

## Persistent Profile: .rpi-profile.md

Saved at project root. Sections:
- Stack (language, framework, DB, testing, styling)
- Conventions (naming, patterns, import style, error handling)
- Architecture (pattern, key directories, entry points)
- Health (test coverage, TODOs, dead code, dependency issues, uncovered paths)
- Risks (security, dependency, architectural)
- Suggested Features (prioritized: HIGH/MEDIUM/LOW with source evidence)
- Git Insights (hotspots, recent focus, contributors)

Re-runnable: running onboarding again overwrites with fresh data.

## Phase 5: User Options

After analysis, the user chooses:
- A) Build a suggested feature (pre-filled /rpi:new with context)
- B) Describe their own feature (guided /rpi:new with annotations)
- C) See a demo (create demo-greeting, show artifacts, clean up)
- D) Exit (summary of next steps)

## Files Changed

- `commands/rpi/onboarding.md` — Complete rewrite
- `agents/` — No new agent files (analysis agents are inline in the command)
- `.rpi-profile.md` — New generated file (gitignored)

## Decisions

1. Profile is markdown (not YAML) because agents are markdown-native
2. Three agents (not one) to avoid context bloat during analysis
3. Merge step is done by the orchestrator command, not a separate agent
4. Demo option reuses existing demo-greeting pattern from current onboarding
5. `.rpi-profile.md` should be added to `.gitignore` (project-specific, not shared)
