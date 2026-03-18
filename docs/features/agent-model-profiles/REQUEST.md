# Agent Model Profiles

## Summary
Allow users to configure which AI model (opus, sonnet, haiku) each RPI agent uses per workflow phase (research, plan, implement, review). Provides pre-defined profiles (e.g., "quality-first", "balanced", "speed-first") with full customization via `.rpi.yaml` overrides. Activated via a dedicated `/rpi:set-profile` command.

## Problem
Currently, all RPI agents inherit the parent model with no way to optimize model selection per phase. Users doing research and planning benefit from a more capable model (opus), while implementation can run efficiently on sonnet. Without profiles, users either pay for opus everywhere or sacrifice quality on thinking-heavy phases. This feature lets users balance cost, speed, and quality across the workflow.

## Target Users
- **Plugin users** who want to optimize their Claude Code usage across RPI workflow phases
- **Cost-conscious developers** who want opus-quality thinking for planning/review but faster execution for implementation
- **Power users** who want full control over which model runs each phase

## Requirements

### Pre-defined Profiles
- `quality-first`: opus for all phases (maximum quality)
- `balanced`: opus for research + plan + review, sonnet for implement (recommended default)
- `speed-first`: sonnet for all phases (maximum speed)
- `budget`: haiku for research + implement, sonnet for plan + review (cost optimized)

### Custom Configuration in `.rpi.yaml`
- Users can override any phase's model individually
- Custom overrides take precedence over the active profile
- Example config:
  ```yaml
  profile: balanced
  models:
    research: opus
    plan: opus
    implement: sonnet
    review: opus
  ```

### `/rpi:set-profile` Command
- Dedicated command to switch the active profile
- Persists selection in `.rpi.yaml`
- Shows current profile and per-phase model mapping
- Validates profile name before saving

### Model Propagation
- Each agent/command reads the active profile + overrides
- Passes the resolved model to the `model` parameter of the Agent tool
- Shows which model is being used when spawning agents (status messages)

### Validation & Fallbacks
- Validate model names against supported list (opus, sonnet, haiku)
- Graceful fallback if an invalid model is configured (warn + use default)
- Clear error messages for misconfiguration

## Constraints
- Must work within Claude Code's Agent tool `model` parameter (supports: "opus", "sonnet", "haiku")
- Architecture should be extensible to support non-Claude providers in the future (but only Claude models for v1)
- Must not break existing behavior — if no profile is configured, current behavior is preserved (inherit parent model)
- Profile config lives in `.rpi.yaml` (single source of truth)
- The `/rpi:set-profile` command must be added to the plugin command registry

## References
- Claude Code Agent tool `model` parameter: `"opus" | "sonnet" | "haiku"`
- Current `.rpi.yaml` config structure (already has `folder`, `tier`, etc.)
- Existing `/gsd:set-profile` command as UX reference

## Complexity Estimate
L — Touches agent spawning across all 4 phases (12 agents), requires new command, config schema extension, validation logic, status messaging, and documentation updates.
