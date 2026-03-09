---
name: rpi:docs
description: Generate code documentation from implementation artifacts. Adds inline docs, updates README, generates API docs, and creates changelog entry. Final step in the RPI pipeline.
argument-hint: "<feature-slug> [--skip-inline] [--skip-readme] [--skip-changelog]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
  - AskUserQuestion
---

<objective>
Generate documentation for a completed feature using all RPI artifacts as source. Adds inline code documentation, updates project README if needed, generates API docs for new endpoints, and creates a changelog entry.
</objective>

<process>

## 1. Load config and parse arguments

Read `.rpi.yaml` for folder path.
Parse `$ARGUMENTS`:
- First argument: `{feature-slug}` (required)
- `--skip-inline`: skip adding inline code documentation
- `--skip-readme`: skip README updates
- `--skip-changelog`: skip changelog entry

## 2. Validate prerequisites

Verify the feature has passed review. Read `{folder}/{feature-slug}/implement/IMPLEMENT.md`.

Check for review verdict:
- If verdict is PASS → proceed
- If verdict is FAIL → error:
  ```
  Feature has not passed review. Run /rpi:review {feature-slug} first.
  ```
- If IMPLEMENT.md doesn't exist → error:
  ```
  Implementation not found. Run /rpi:implement {feature-slug} first.
  ```

## 3. Gather all artifacts

Read all feature artifacts for context:
- `{folder}/{feature-slug}/REQUEST.md` — what was requested
- `{folder}/{feature-slug}/research/RESEARCH.md` — decisions and trade-offs
- `{folder}/{feature-slug}/plan/eng.md` — technical spec (APIs, models, architecture)
- `{folder}/{feature-slug}/plan/pm.md` — acceptance criteria (if exists)
- `{folder}/{feature-slug}/plan/PLAN.md` — task list with files
- `{folder}/{feature-slug}/implement/IMPLEMENT.md` — what was actually built, deviations

## 4. Identify documentation targets

From IMPLEMENT.md and PLAN.md, collect:
- All files created or modified
- New public functions, classes, types, and exports
- New API endpoints or routes
- New configuration options or environment variables
- Deviations from the plan (may need extra documentation)

Use Glob and Grep to read the actual implemented files and identify what needs documentation.

## 5. Launch parallel documentation agents

Use the Agent tool to launch applicable agents concurrently.

### Agent 1: Inline Documentation (unless --skip-inline)

```
You are documenting code for a completed feature.

Read these artifacts for context:
- {folder}/{feature-slug}/plan/eng.md
- {folder}/{feature-slug}/implement/IMPLEMENT.md

Then read each implemented file listed in IMPLEMENT.md.

Add inline documentation ONLY where it adds value:
1. Public functions/methods: brief JSDoc/docstring with params and return type
2. Complex logic: short comment explaining WHY, not WHAT
3. Non-obvious design decisions: reference the trade-off from eng.md
4. New types/interfaces: brief description of purpose

Rules:
- Do NOT add obvious comments ("// returns the user" on a getUser function)
- Do NOT document private/internal helpers unless logic is non-trivial
- Match the project's existing documentation style and conventions
- If the project has no inline docs convention, use minimal JSDoc/docstrings only on public APIs
- Do NOT modify any behavior — documentation only
```

### Agent 2: API Documentation (if new endpoints exist)

```
You are generating API documentation for new endpoints.

Read these artifacts:
- {folder}/{feature-slug}/plan/eng.md (API design section)
- {folder}/{feature-slug}/implement/IMPLEMENT.md

Find all new API endpoints/routes in the implemented files using Grep.

For each endpoint, document:
- Method and path
- Request parameters/body with types
- Response format with types
- Error responses
- Authentication requirements
- Example request/response

Check if the project has an existing API docs file or pattern (e.g., docs/api.md, swagger/openapi spec, README API section). If yes, extend it. If no, create `{folder}/{feature-slug}/implement/API.md`.

Use the format that matches existing project conventions.
```

### Agent 3: README & Changelog (unless both skipped)

```
You are updating project documentation for a completed feature.

Read these artifacts:
- {folder}/{feature-slug}/REQUEST.md (feature summary)
- {folder}/{feature-slug}/implement/IMPLEMENT.md (what was built, deviations)
- {folder}/{feature-slug}/plan/eng.md (new dependencies, config)

Tasks:

1. README update (unless --skip-readme):
   - Read the project's existing README.md
   - Determine if the feature needs to be mentioned (new user-facing capability, new config, new dependency)
   - If yes, add a concise entry in the appropriate section
   - If the feature is purely internal/refactor, skip README update
   - Do NOT rewrite the README — only add what's necessary

2. Changelog entry (unless --skip-changelog):
   - Check if CHANGELOG.md exists. If not, create it with Keep a Changelog format
   - Add an entry under [Unreleased]:
     - Added: new features
     - Changed: modifications to existing features
     - Fixed: bug fixes
   - Keep entries concise — one line per change
   - Reference the feature slug for traceability
```

## 6. Write DOCS.md summary

After all agents complete, write `{folder}/{feature-slug}/implement/DOCS.md`:

```markdown
# Documentation: {Feature Title}

Generated: {timestamp}

## Inline Documentation
- Files documented: {N}
- Public APIs documented: {list}
{Or: "Skipped (--skip-inline)"}

## API Documentation
- New endpoints: {N}
- Docs location: {path}
{Or: "No new endpoints"}

## README
- Updated: yes/no
- Changes: {brief description}
{Or: "Skipped (--skip-readme)"}

## Changelog
- Entry added: yes/no
- Section: Added/Changed/Fixed
{Or: "Skipped (--skip-changelog)"}
```

## 7. Present result

Output:
```
Documentation complete for {feature-slug}:
- Inline docs: {N} files documented
- API docs: {endpoint count or "none"}
- README: {updated or skipped}
- Changelog: {entry added or skipped}

Feature {feature-slug} is fully complete.
All artifacts: {folder}/{feature-slug}/
```

</process>
