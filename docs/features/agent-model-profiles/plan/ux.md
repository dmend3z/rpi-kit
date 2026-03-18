# ux.md -- Agent Model Profiles

## 1. User Journey: First-Time Setup (`/rpi:init`)

The existing `/rpi:init` interview uses batched `AskUserQuestion` calls (4 batches today). Profile selection adds Batch 5 after TDD questions -- progressive disclosure: basic config first, advanced optimization last.

### Step-by-step flow

| Step | User sees / does | System response |
|------|-----------------|-----------------|
| 1 | User runs `/rpi:init` | System checks for existing `.rpi.yaml` |
| 2 | Batches 1-4 proceed as today | No change to existing questions |
| 3 | **New Batch 5 -- AskUserQuestion:** | `"Which model profile do you want for agent execution?"` |
| | | Options: |
| | | - `balanced` (Recommended -- opus for research/plan/review, sonnet for implement) |
| | | - `quality-first` (opus for all phases -- maximum quality) |
| | | - `speed-first` (sonnet for all phases -- maximum speed) |
| | | - `budget` (haiku + sonnet -- cost optimized, may reduce research quality) |
| | | - `none` (inherit parent model -- current behavior) |
| 4 | User selects a profile | System writes `profile: {selection}` to `.rpi.yaml` (or omits if `none`) |
| 5 | Confirmation message includes profile | See format below |

### Confirmation message format

With profile:
```
RPI initialized.
Config: .rpi.yaml
Features: {folder}/
Tier: {tier}
Profile: {profile} (research: {model}, plan: {model}, implement: {model}, review: {model})

Next: /rpi:new to start your first feature.
```

Without profile:
```
RPI initialized.
Config: .rpi.yaml
Features: {folder}/
Tier: {tier}
Profile: none (agents inherit parent model)

Next: /rpi:new to start your first feature.
```

### Reconfiguration

When `.rpi.yaml` already exists and user re-runs `/rpi:init`:
```
"Current profile: balanced. Change model profile?"
```
Options: same as above, plus "Keep current ({profile})".

---

## 2. User Journey: Profile Switching (`/rpi:set-profile`)

### Path A: No arguments -- show current state and prompt

| Step | User sees / does | System response |
|------|-----------------|-----------------|
| 1 | `/rpi:set-profile` | System reads `.rpi.yaml` |
| 2 | | Displays current profile card |
| 3 | | AskUserQuestion: "Switch to a different profile?" |
| 4 | User selects or cancels | Update config or "No changes made." |

**Profile card format (no overrides):**
```
Current profile: balanced

  Phase        Model
  ----------   ------
  research     opus
  plan         opus
  implement    sonnet
  review       opus

Overrides: none
```

**Profile card format (with overrides):**
```
Current profile: balanced

  Phase        Model        Source
  ----------   ------       ------
  research     opus         profile
  plan         opus         profile
  implement    opus         override
  review       opus         profile

Overrides: models.implement = opus
```

**AskUserQuestion options:**
- `quality-first` -- opus for all phases
- `balanced` -- opus for thinking, sonnet for doing
- `speed-first` -- sonnet for all phases
- `budget` -- haiku + sonnet (may reduce research quality)
- `none` -- inherit parent model
- `Keep current` (default)

### Path B: Valid profile name as argument

```
> /rpi:set-profile balanced

Profile updated: balanced

  Phase        Model
  ----------   ------
  research     opus
  plan         opus
  implement    sonnet
  review       opus
```

If switching to `budget`, append warning (see Edge Cases section).

### Path C: Invalid profile name

```
> /rpi:set-profile turbo

Unknown profile: "turbo"

Valid profiles: quality-first, balanced, speed-first, budget, none

Usage: /rpi:set-profile [profile-name]
Run /rpi:set-profile with no arguments to see current profile and select interactively.
```

Config unchanged. No fallback.

---

## 3. User Journey: Per-Phase Override (Manual `.rpi.yaml` Editing)

No dedicated command. Users edit `.rpi.yaml` directly.

### Example `.rpi.yaml` with overrides

```yaml
profile: balanced
models:
  implement: opus    # override: use opus instead of profile's sonnet
```

### What user sees on next command

```
> /rpi:research my-feature

Profile: balanced | research phase -> opus
Analyzing your project...
```

```
> /rpi:implement my-feature

Profile: balanced | implement phase -> opus (override)
```

### Invalid override value

```
Warning: Invalid model "gpt-4" for research phase. Valid models: opus, sonnet, haiku.
Falling back to parent model (no model parameter passed to agent).
```

Command continues -- does not abort.

---

## 4. User Journey: Status Visibility

### `/rpi:status` -- Profile in header

```
# RPI Status

Config: .rpi.yaml
Profile: balanced (research: opus, plan: opus, implement: sonnet, review: opus)

## oauth2-auth
Phase: implement (6/9 tasks)
...
```

No profile:
```
Profile: none (inheriting parent model)
```

With overrides:
```
Profile: balanced (research: opus, plan: opus, implement: opus*, review: opus)
  * override from models.implement
```

### Agent spawn status messages

One line per command invocation, shown after config load:

```
Profile: {profile} | {phase} phase -> {model}
```

| Command | Phase | Example Message |
|---------|-------|-----------------|
| `/rpi:research` | research | `Profile: balanced \| research phase -> opus` |
| `/rpi:plan` | plan | `Profile: balanced \| plan phase -> opus` |
| `/rpi:implement` | implement | `Profile: balanced \| implement phase -> sonnet` |
| `/rpi:test` | implement | `Profile: balanced \| implement phase -> sonnet` |
| `/rpi:simplify` | implement | `Profile: balanced \| implement phase -> sonnet` |
| `/rpi:review` | review | `Profile: balanced \| review phase -> opus` |
| `/rpi:docs` | review | `Profile: balanced \| review phase -> opus` |
| `/rpi:onboarding` | (none) | No message |

One line per command, not per agent spawn within a command. All agents in a command share the same phase model.

No profile configured: `Profile: none (inheriting parent model)`

---

## 5. Interaction Patterns -- Exact Message Formats

### 5a. Profile display

**Compact** (status header, one line):
```
Profile: balanced (research: opus, plan: opus, implement: sonnet, review: opus)
```

**Table** (set-profile with no args):
```
Current profile: balanced

  Phase        Model
  ----------   ------
  research     opus
  plan         opus
  implement    sonnet
  review       opus
```

### 5b. Model status per command

```
Profile: {profile_name} | {phase} phase -> {model}
```

With override:
```
Profile: {profile_name} | {phase} phase -> {model} (override)
```

### 5c. Validation errors

**Invalid profile:**
```
Unknown profile: "{name}"

Valid profiles: quality-first, balanced, speed-first, budget, none

Usage: /rpi:set-profile [profile-name]
Run /rpi:set-profile with no arguments to see current profile and select interactively.
```

**Invalid model:**
```
Warning: Invalid model "{name}" for {phase} phase. Valid models: opus, sonnet, haiku.
Falling back to parent model (no model parameter passed to agent).
```

**Unknown phase key:**
```
Warning: Unknown phase "deploy" in models config. Valid phases: research, plan, implement, review.
Ignoring unknown phase. Recognized overrides applied.
```

### 5d. Budget profile warning

**(1) During `/rpi:init` -- inline with option:**
```
budget (haiku + sonnet -- cost optimized, may reduce research quality)
```

**(2) When switching to budget:**
```
Note: The budget profile uses haiku for research and implement phases.
Haiku may produce lower-quality research outputs for complex features.
RPI research agents have strict requirements (evidence-backed verdicts,
structured analysis). Consider using --deep tier sparingly with this profile.
```

**(3) At runtime -- research phase with haiku:**
```
Profile: budget | research phase -> haiku
Note: Haiku is active for research. For complex features, consider switching to balanced profile.
```

---

## 6. Edge Cases

| Scenario | User Sees |
|----------|-----------|
| No profile set | `Profile: none (inheriting parent model)` |
| Invalid profile name | Error with valid list (5c) |
| Invalid model in override | Warning (5c). Command continues. |
| Unknown phase key | Warning (5c). Valid keys processed. |
| Budget + deep research | Budget warning note (5d) |
| Empty profile value | `Profile: none (inheriting parent model)` |
| `models:` without `profile:` | `Profile: none` + overrides applied |
| All 4 phases overridden | Table shows all as "override" source |
| `.rpi.yaml` missing | Existing error: "Run /rpi:init first" |
| Partial `models:` block | Only specified phases overridden. Rest from profile or parent. |
| Switching to `none` | `Profile updated: none (agents inherit parent model)` |

---

## 7. Existing Components to Reuse

| Component | Reuse For | Location |
|-----------|----------|----------|
| `/rpi:init` interview pattern | Batch 5 profile question | `commands/rpi/init.md` Batches 1-4 |
| `/rpi:status` display pattern | Adding `Profile:` line | `commands/rpi/status.md` Section 5 |
| AskUserQuestion pattern | set-profile interactive selection | All commands with AskUserQuestion |
| "Load config" pattern (Step 1) | Adding model resolution | Step 1 in all 7 commands |
| `.rpi.yaml` config schema | Extending with `profile`/`models` | `skills/rpi-workflow/SKILL.md` |
| Agent tool prompt template | Adding `model` parameter | research.md, plan.md, implement.md |
| Error/warning message pattern | Validation messages | All command validation steps |

---

## 8. Information Architecture

```
                    /rpi:init
                    Batch 5: profile pick
                    -> writes .rpi.yaml
                          |
                    .rpi.yaml
                    profile: balanced
                    models: { ... }
                    (single source of truth)
                          |
         +----------------+----------------+
         |                |                |
   /rpi:set-profile  /rpi:status    7 agent-spawning
   View + switch     Profile line   commands
   Full table        in header      1-line model msg
   Override display                 per invocation
```

### Read points

| File | Reads | Does |
|------|-------|------|
| `init.md` | Nothing (writes) | Adds `profile:` to config |
| `set-profile.md` | `profile`, `models` | Displays, validates, writes `profile` |
| `status.md` | `profile`, `models` | Shows compact profile line |
| `research.md` | `profile`, `models.research` | Resolves model, passes to Agent tool |
| `plan.md` | `profile`, `models.plan` | Resolves model, passes to Agent tool |
| `implement.md` | `profile`, `models.implement` | Resolves model, passes to Agent tool |
| `test.md` | `profile`, `models.implement` | Resolves model (implement phase) |
| `simplify.md` | `profile`, `models.implement` | Resolves model (implement phase) |
| `review.md` | `profile`, `models.review` | Resolves model, passes to Agent tool |
| `docs.md` | `profile`, `models.review` | Resolves model (review phase) |
| `onboarding.md` | Nothing | No profile applied |

---

## Accessibility

All interactions are text-based within Claude Code's terminal interface.

- **Keyboard:** AskUserQuestion is navigable via keyboard (built-in).
- **Screen reader:** All messages use plain text. No visual-only indicators. Table format uses ASCII dashes readable as separators.
- **Contrast:** Inherits terminal settings.
