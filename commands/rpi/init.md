---
name: rpi:init
description: Initialize RPI workflow configuration for this project. Sets up feature folder location, default research tier, and preferences.
argument-hint: ""
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - AskUserQuestion
---

<objective>
Create a `.rpi.yaml` configuration file at the project root with user preferences for the RPI workflow.
</objective>

<process>

## 1. Check for existing config

Use Glob to search for `.rpi.yaml` at the project root. If it exists, read it and ask the user if they want to reconfigure or keep existing settings.

## 2. Interview the user

Use AskUserQuestion to gather preferences. Ask up to 4 questions at a time:

**Batch 1:**
- "Where should feature folders live?" — Options: `rpi/` (Recommended), `.rpi/`, `docs/features/`, custom path
- "What's your default research tier?" — Options: `standard` (Recommended), `quick`, `deep`

**Batch 2:**
- "Should code simplification run automatically before review?" — Options: Yes (Recommended), No
- "What commit message style do you prefer?" — Options: `conventional` (Recommended, e.g., feat(1.1): task name), `descriptive` (plain English)

**Batch 3:**
- "Task count threshold for parallel execution?" — Options: 8 (Recommended), 5, 12, always sequential
- "How do you want to isolate features?" — Options: `none` (Recommended — work on current branch), `branch` (create a git branch per feature), `worktree` (create a git worktree + branch in `.worktrees/`)
- "Session isolation to prevent context drift?" — Options: `auto` (Recommended — adapts to feature complexity), `aggressive` (always checkpoint, maximum isolation), `off` (no session boundaries)

**Batch 4 (TDD):**
- "Enable Test-Driven Development during implementation?" — Options: No (default), Yes
- If yes: "What command runs your tests?" — Options: auto-detect (Recommended), `npm test`, `npx vitest`, `pytest`, custom

**Batch 5 (Model Profiles):**
- "Which model profile do you want for agent execution?" — Options:
  - `balanced` (Recommended — opus for research/plan/review, sonnet for implement)
  - `quality-first` (opus everywhere — maximum quality)
  - `speed-first` (sonnet everywhere — maximum speed)
  - `budget` (haiku + sonnet mix — cost optimized, may reduce research quality)
  - "No profile" (default — all agents inherit parent model)

If reconfiguring and a profile already exists, show: "Current profile: {profile}. Change model profile?" with the same options plus "Keep current ({profile})".

## 3. Create .rpi.yaml

Write the config file at the project root:

```yaml
# RPI Workflow Configuration
# Docs: https://github.com/mndz/rpi-kit

folder: {user_choice}
tier: {user_choice}
auto_simplify: {true|false}
commit_style: {conventional|descriptive}
parallel_threshold: {number}
skip_artifacts: []
review_after_implement: true
isolation: {none|branch|worktree}
tdd: {true|false}
test_runner: {auto|command}
session_isolation: {auto|aggressive|off}
max_tasks_per_session: 5      # tasks before session warning (Tier 2) or forced checkpoint (Tier 3)
profile: {balanced|quality-first|speed-first|budget}  # omit if "No profile" selected
```

## 4. Create feature folder

Create the configured folder directory if it doesn't exist:
```bash
mkdir -p {folder}
```

## 5. Confirm

Output a brief confirmation:

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

</process>
