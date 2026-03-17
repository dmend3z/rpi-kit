---
name: rpi:update
description: Update RPIKit plugin to the latest version from the remote repository.
argument-hint: ""
allowed-tools:
  - Bash
  - Read
  - Glob
---

# /rpi:update — Update RPIKit

Pull the latest version of RPIKit from the remote repository and clear the plugin cache.

---

## Step 1: Find the installed plugin directory

Search for the RPIKit installation:

```bash
find ~/.claude/plugins -name "plugin.json" -path "*/rpi-kit/*" 2>/dev/null
```

From the results, determine the plugin root directory (the parent of `.claude-plugin/`).

If not found:
```
RPIKit installation not found in ~/.claude/plugins/.
Re-install from the marketplace or run:
  claude plugin add git@github.com:dmend3z/rpi-kit.git
```
Stop.

Store the plugin root path as `$PLUGIN_DIR`.

## Step 2: Show current version

Read `$PLUGIN_DIR/.claude-plugin/plugin.json` and extract the current `version` field.
Store as `$CURRENT_VERSION`.

Also get the current git commit:

```bash
cd $PLUGIN_DIR && git rev-parse --short HEAD
```

Store as `$CURRENT_COMMIT`.

## Step 3: Pull latest changes

Run git pull in the plugin directory:

```bash
cd $PLUGIN_DIR && git pull origin main 2>&1
```

If it fails:
- If "not a git repository": report the error and suggest re-installing.
- If merge conflict: report the error and suggest `cd $PLUGIN_DIR && git reset --hard origin/main` (ask user first — this discards local changes).
- If network error: report "Could not reach remote. Check your connection."
- Stop on any error.

If output says "Already up to date.":
```
RPIKit is already up to date (v{$CURRENT_VERSION}, {$CURRENT_COMMIT}).
```
Stop.

## Step 4: Show what changed

Get the new version:

```bash
cd $PLUGIN_DIR && cat .claude-plugin/plugin.json | grep '"version"'
```

Store as `$NEW_VERSION`.

Get the new commit:

```bash
cd $PLUGIN_DIR && git rev-parse --short HEAD
```

Store as `$NEW_COMMIT`.

Show the changelog between old and new commits:

```bash
cd $PLUGIN_DIR && git log --oneline $CURRENT_COMMIT..$NEW_COMMIT
```

## Step 5: Clear plugin cache

Remove cached versions so Claude Code picks up the new files:

```bash
rm -rf ~/.claude/plugins/cache/rpi-kit 2>/dev/null
```

## Step 6: Output summary

```
RPIKit updated!

{$CURRENT_VERSION} ({$CURRENT_COMMIT}) → {$NEW_VERSION} ({$NEW_COMMIT})

Changes:
{git log output from step 4}

Restart Claude Code to load the new version.
```
