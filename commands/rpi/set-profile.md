---
name: rpi:set-profile
description: Switch the active model profile. Controls which AI model runs each workflow phase (research, plan, implement, review).
argument-hint: "[quality-first|balanced|speed-first|budget]"
allowed-tools:
  - Read
  - Write
  - AskUserQuestion
---

<objective>
Display the current model profile and phase-model mapping, or switch to a new profile. Persists the selection in `.rpi.yaml`.
</objective>

<process>

## 1. Load current config

Read `.rpi.yaml` from the project root. If it doesn't exist:
```
No RPI config found. Run /rpi:init first.
```

Extract `profile` and `models` keys (both may be absent).

## 2. Parse arguments

Parse `$ARGUMENTS`:
- If empty: display current profile (step 3), then ask if user wants to switch (step 4)
- If argument provided: validate and switch to that profile (step 5)

## 3. Display current profile

Resolve the effective model for each phase using the Model Resolution Algorithm defined in the rpi-workflow skill.

Output:
```
Current profile: {profile_name or "none (inheriting parent model)"}

Phase mappings:
  research:   {resolved_model or "inherit"}
  plan:       {resolved_model or "inherit"}
  implement:  {resolved_model or "inherit"}
  review:     {resolved_model or "inherit"}
```

If any per-phase overrides exist in `models:` block:
```
Per-phase overrides active: {list overridden phases}
(Overrides take precedence over the profile. Edit .rpi.yaml to change.)
```

## 4. Ask to switch (only if no argument)

Use AskUserQuestion:
"Switch to a different profile?"

Options:
- `quality-first` -- opus for all phases (maximum quality)
- `balanced` -- opus for research/plan/review, sonnet for implement (recommended)
- `speed-first` -- sonnet for all phases (fastest)
- `budget` -- haiku for research/implement, sonnet for plan/review (cheapest, may reduce research quality)
- `none` -- inherit parent model (current behavior)
- "Keep current" -- no change

If "Keep current", output "No changes made." and stop.

If switching to `budget`, display warning:
```
Note: The budget profile uses haiku for research and implement phases.
Haiku may produce lower-quality research outputs for complex features.
RPI research agents have strict requirements (evidence-backed verdicts,
structured analysis). Consider using --deep tier sparingly with this profile.
```

## 5. Validate profile name

Check that the provided profile name is one of: `quality-first`, `balanced`, `speed-first`, `budget`, `none`.

If invalid:
```
Unknown profile: "{input}"

Valid profiles: quality-first, balanced, speed-first, budget, none

Usage: /rpi:set-profile [profile-name]
Run /rpi:set-profile with no arguments to see current profile and select interactively.
```

Stop. Do not modify config.

## 6. Persist to .rpi.yaml

Read the current `.rpi.yaml` content. Update the `profile` key:
- If `profile:` line exists: replace the value
- If `profile:` line does not exist: add it after the last existing config key, before any comments at the end
- If selected profile is `none`: remove the `profile:` line (or set to empty)

Do NOT modify the `models:` block. Per-phase overrides are preserved as-is.

Write the updated `.rpi.yaml`.

## 7. Confirm

Display the new effective mapping:
```
Profile switched to: {profile_name}

Phase mappings:
  research:   {model}
  plan:       {model}
  implement:  {model}
  review:     {model}
```

If `models:` overrides exist:
```
Note: Per-phase overrides in .rpi.yaml take precedence over the profile.
Overridden phases: {list}
```

Tip: Edit .rpi.yaml to customize individual phases.

</process>
