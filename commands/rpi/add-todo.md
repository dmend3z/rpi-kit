---
name: rpi:add-todo
description: Add a quick todo so you don't forget what to implement next.
argument-hint: "[todo title]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - AskUserQuestion
---

<objective>
Create a todo file in `{folder}/todos/` to capture an implementation idea before it's forgotten.
</objective>

<process>

## 1. Load config

Read `.rpi.yaml` for folder path. Default to `rpi/` if not found.

## 2. Ensure todos folder exists

```bash
mkdir -p {folder}/todos
```

## 3. Determine todo title

If `$ARGUMENTS` contains a title, use it. Otherwise ask:
"What do you want to remember to implement?"

Convert the title to a kebab-case slug for the filename.

## 4. Check for duplicates

Use Glob to check if `{folder}/todos/{slug}.md` already exists. If yes, warn the user and ask if they want to update the existing one or pick a different name.

## 5. Quick interview

Ask 1-2 focused questions using AskUserQuestion:

- "Brief description — what should this do?" (skip if the title is already descriptive enough)
- "Priority?" — Options: `high`, `medium` (default), `low`

Keep it fast. The point is to capture the idea before it's lost, not to write a full spec.

## 6. Create the todo file

Write `{folder}/todos/{slug}.md`:

```markdown
# {Todo Title}

## What
{Brief description of what to implement}

## Priority
{high | medium | low}

## Notes
- {Any extra context the user mentioned, or leave empty}

---
Added: {YYYY-MM-DD}
Status: pending
```

## 7. Confirm

Output:

```
Todo added: {folder}/todos/{slug}.md
Priority: {priority}

Quick actions:
  /rpi:new {slug}    Promote to a full RPI feature
  /rpi:status        Show all features and their current phase
```

</process>
