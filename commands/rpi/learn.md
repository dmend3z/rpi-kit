---
name: rpi:learn
description: Manually capture a solution or insight to the knowledge base.
argument-hint: "[description]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

# /rpi:learn — Knowledge Capture

Manually capture a solution, insight, or lesson learned into `rpi/solutions/`. Reads recent context from git and the codebase to enrich the entry.

---

## Step 1: Load config

Read `.rpi.yaml` from the project root. Extract:
- `solutions_dir` (default: `rpi/solutions`)

If `.rpi.yaml` doesn't exist, use defaults silently.

## Step 2: Get description

Parse `$ARGUMENTS` for a description string.

- If provided: use it as `$DESCRIPTION`.
- If not provided: ask the user with AskUserQuestion:
  "What did you learn? (e.g. 'N+1 query in Prisma', 'race condition in session refresh', 'pattern for retry with backoff')"

## Step 3: Ask category

Ask the user with AskUserQuestion:
"Which category fits best?
1. performance
2. security
3. database
4. testing
5. architecture
6. patterns
7. other"

Map the user's response to a category slug. Accept both the number and the name (e.g. "1" or "performance"). Default to "other" if unclear.

Store as `$CATEGORY`.

## Step 4: Derive slug

Convert `$DESCRIPTION` to kebab-case:
- Lowercase
- Replace spaces and underscores with hyphens
- Strip special characters
- Truncate to 60 characters max

Store as `$SLUG`.

## Step 5: Gather context from codebase

1. Run `git diff HEAD~3..HEAD --stat` to get recent changes — store as `$RECENT_CHANGES`.
2. Run `git diff HEAD~3..HEAD` to get the actual diff — store as `$RECENT_DIFF`.
3. Search for files related to the description using Grep and Glob:
   - Extract key terms from `$DESCRIPTION`
   - Search for those terms in the codebase
   - Store relevant file paths as `$RELATED_FILES`

## Step 6: Write solution file

1. Ensure directory exists:
   ```bash
   mkdir -p {solutions_dir}/{$CATEGORY}
   ```
2. Write to `{solutions_dir}/{$CATEGORY}/{$SLUG}.md`:

   ```markdown
   # {Description}

   ## Problem
   {Describe the problem based on the description and recent diff context.
   What symptoms did it cause? How did it manifest?}

   ## Solution
   {What fixed it or what approach works. Include relevant code snippets
   from the recent diff if applicable.}

   ## Prevention
   {How to avoid this in the future. Patterns to follow, checks to add.}

   ## Context
   Date: {YYYY-MM-DD}
   Files: {$RELATED_FILES or "Not identified"}
   ```

3. If the file already exists at that path, append a numeric suffix: `{$SLUG}-2.md`, `{$SLUG}-3.md`, etc.

## Step 7: Commit

Stage and commit the new solutions file:

```bash
git add {solutions_dir}/{$CATEGORY}/{$SLUG}.md
git commit -m "learn({$CATEGORY}): {$DESCRIPTION}"
```

## Step 8: Output summary

```
Solution saved: {solutions_dir}/{$CATEGORY}/{$SLUG}.md

This will be automatically referenced by Scout during future research phases.
```
