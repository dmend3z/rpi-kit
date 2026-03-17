---
name: rpi:archive
description: Merge delta specs into main specs and clean up the feature directory.
argument-hint: "<feature-name>"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Agent
---

# /rpi:archive — Archive Feature

Merge the feature's delta specs into the main `rpi/specs/` directory, preserve any solutions worth saving, and delete the feature directory. History is preserved in git.

---

## Step 1: Load config and validate

1. Read `.rpi.yaml` for config. Apply defaults if missing:
   - `folder`: `rpi/features`
   - `specs_dir`: `rpi/specs`
   - `solutions_dir`: `rpi/solutions`
2. Parse `$ARGUMENTS` to extract `{slug}`.
3. Validate `rpi/features/{slug}/` exists. If not:
   ```
   Feature '{slug}' not found. Nothing to archive.
   ```
   Stop.

## Step 2: Validate review verdict

1. Read `rpi/features/{slug}/implement/IMPLEMENT.md`.
2. Look for a `## Review` section with a verdict of `PASS` or `PASS with concerns`.
3. If verdict is `FAIL`:
   ```
   Review verdict is FAIL for '{slug}'.
   Fix the issues and re-run: /rpi:review {slug}
   Cannot archive a feature that hasn't passed review.
   ```
   Stop.
4. If no review section or verdict is found:
   ```
   No review verdict found for '{slug}'.
   Run /rpi:review {slug} before archiving.
   ```
   Stop.

## Step 3: Read delta contents

1. Scan `rpi/features/{slug}/delta/ADDED/` for all files — store as `$ADDED_FILES`.
2. Scan `rpi/features/{slug}/delta/MODIFIED/` for all files — store as `$MODIFIED_FILES`.
3. Scan `rpi/features/{slug}/delta/REMOVED/` for all files — store as `$REMOVED_FILES`.
4. Read the contents of each file found.

If all three directories are empty:
```
No delta specs found for '{slug}'. Skipping specs merge.
```
Proceed to Step 5.

## Step 4: Launch Nexus to merge delta into specs

Use the Agent tool to launch Nexus for the merge:

```
You are Nexus. Merge the delta specs for feature '{slug}' into the main specs directory.

## ADDED Files (copy to rpi/specs/)
{for each file in $ADDED_FILES: filename and full contents}

## MODIFIED Files (apply changes to existing rpi/specs/ files)
{for each file in $MODIFIED_FILES: filename, delta contents, and current contents of the target spec file in rpi/specs/}

## REMOVED Files (delete from rpi/specs/)
{for each file in $REMOVED_FILES: filename}

Your task:
1. For each ADDED file: determine the correct path under rpi/specs/ and write the file there.
   - Use the file's content as-is. Preserve the directory structure (e.g. delta/ADDED/auth/oauth.md → rpi/specs/auth/oauth.md).
2. For each MODIFIED file: read the current spec at rpi/specs/{path}, apply the changes from the delta version.
   - The delta file contains the updated version of the spec. Merge it intelligently:
   - Preserve any sections in the original that aren't addressed by the delta
   - Update sections that the delta modifies
   - Add new sections from the delta
3. For each REMOVED file: note the path under rpi/specs/ that should be deleted.

Output format:
## Merge Plan
### Files to Write
- {path}: {action: created | updated} — {brief description}

### Files to Delete
- {path} — {reason}

### Warnings
- {any conflicts or issues detected}
(or "No warnings.")
```

Store the output as `$NEXUS_MERGE`.

After Nexus responds, execute the merge plan:
1. **ADDED**: Write each file to `rpi/specs/{path}` (create directories as needed).
2. **MODIFIED**: Write the merged content to `rpi/specs/{path}`.
3. **REMOVED**: Delete the files from `rpi/specs/`.

## Step 5: Check for solutions worth saving

1. Read `rpi/features/{slug}/implement/IMPLEMENT.md` for the review section.
2. If the review flagged solutions saved to `rpi/solutions/`:
   - Verify each referenced solution file exists in `rpi/solutions/`.
   - If any are missing, warn:
     ```
     Warning: Solution '{path}' referenced in review but not found.
     ```

## Step 6: Delete feature directory

Remove the entire feature directory:

```bash
rm -rf rpi/features/{slug}
```

## Step 7: Commit

Stage all changes and commit:

```bash
git add -A
git commit -m "chore: archive {slug} — delta merged, feature complete"
```

## Step 8: Output summary

```
Archive complete: {slug}

Specs merged:
- Added: {N} files
- Modified: {N} files
- Removed: {N} files

Feature directory deleted: rpi/features/{slug}/
History preserved in git.
```
