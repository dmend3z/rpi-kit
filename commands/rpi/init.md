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
- "Create a git branch per feature?" — Options: No (Recommended), Yes

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
branch_per_feature: {true|false}
```

## 4. Create feature folder

Create the configured folder directory if it doesn't exist:
```bash
mkdir -p {folder}
```

## 5. Confirm

Output a brief confirmation:
```
RPI initialized.
Config: .rpi.yaml
Features: {folder}/
Tier: {tier}

Next: /rpi:new to start your first feature.
```

</process>
