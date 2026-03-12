---
name: rpi:test
description: Run TDD (Red-Green-Refactor) on a specific task or set of tasks from the plan. Writes one failing test, verifies failure, implements minimal code, verifies pass, refactors.
argument-hint: "<feature-slug> [--task <id>] [--all]"
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
Execute strict TDD cycles (RED → GREEN → REFACTOR) for tasks in a feature's PLAN.md. One test at a time, verify fail, implement, verify pass.
</objective>

<process>

## 1. Load config and parse arguments

Read `.rpi.yaml` for configuration (folder, test_runner). Also read `profile` and `models` keys.
Parse `$ARGUMENTS`:
- First argument: `{feature-slug}` (required)
- `--task <id>`: run TDD for a specific task (e.g., `1.2`)
- `--all`: run TDD for all uncompleted tasks sequentially

If no `--task` or `--all`, ask the user which task to work on.

## 1b. Resolve model

Resolve the model for the `implement` phase following the Model Resolution Algorithm in the rpi-workflow skill. Store as `{resolved_model}`. If a model is resolved, output the status message before agent spawns.

## 2. Validate prerequisites

Read `{folder}/{feature-slug}/plan/PLAN.md`. If missing:
```
Plan not found. Run /rpi:plan {feature-slug} first.
```

Read `{folder}/{feature-slug}/plan/eng.md` for technical context (especially Testing Strategy section).

## 3. Detect test infrastructure

Scan the project for existing test setup:
- Look for test config files: `jest.config.*`, `vitest.config.*`, `pytest.ini`, `pyproject.toml [tool.pytest]`, `*.test.*`, `*.spec.*`
- Identify the test runner command (from config `test_runner` or auto-detect)
- Identify test file naming convention (`*.test.ts`, `*.spec.ts`, `*_test.py`, etc.)
- Identify assertion style (`expect`, `assert`, etc.)

If no test infrastructure found, ask the user:
"No test setup detected. What test framework and runner should I use?"

## 4. For each target task, run TDD cycle

### Phase RED: Write failing test

Launch test-engineer agent. If a model was resolved in Step 1b, include `model: "{resolved_model}"` in the Agent tool call.
```
You are the test-engineer agent for the RPI workflow.

Read these files:
- {folder}/{feature-slug}/plan/PLAN.md
- {folder}/{feature-slug}/plan/eng.md

Current task:
**{task_id}** {task_description}
Files: {files}

Test infrastructure:
- Framework: {detected_framework}
- File convention: {convention}
- Assertion style: {style}

Write ONE failing test for this task:
1. Create or edit the appropriate test file following project conventions
2. Write a single test that describes the expected behavior
3. The test must exercise real code through the public interface
4. Use clear, behavior-describing test name
5. Minimal assertions — one logical check

Do NOT write any implementation code. Only the test.

Follow test-engineer rules from RPI agent guidelines.
```

### Phase VERIFY RED: Confirm correct failure

Run the test:
```bash
{test_runner} {test_file}
```

Check the output:
- **Test fails with expected reason** (function/module not found, assertion fails) → proceed to GREEN
- **Test errors** (syntax error, import error, typo) → fix the test, re-run
- **Test passes** → the behavior already exists. Either the test is wrong or the task is already done. Ask the user.

Report to user:
```
RED: Test fails correctly.
  Test: {test_name}
  Failure: {failure_reason}
```

### Phase GREEN: Minimal implementation

Launch plan-executor agent. If a model was resolved, include `model: "{resolved_model}"` in the Agent tool call.
```
You are implementing a single task using TDD.

The following test is currently FAILING:
{test_file}:{test_name}
Failure reason: {failure_reason}

Write the MINIMAL code to make this test pass.
- Only touch files listed for this task
- Do NOT add features beyond what the test requires
- Do NOT write additional tests
- Match existing code style

Task context:
**{task_id}** {task_description}
Files: {files}
```

### Phase VERIFY GREEN: Confirm pass

Run the test again:
```bash
{test_runner} {test_file}
```

Also run the full test suite to check for regressions:
```bash
{test_runner}
```

Check:
- **Target test passes** → proceed to REFACTOR
- **Target test fails** → fix implementation, re-run (do NOT change the test)
- **Other tests break** → fix regressions before proceeding

Report to user:
```
GREEN: Test passes.
  Test: {test_name}
  All tests: {pass_count}/{total_count} passing
```

### Phase REFACTOR: Clean up

Review the implementation just written:
- Remove duplication
- Improve names
- Extract helpers if warranted (3+ uses)
- Do NOT add new behavior

After refactoring, re-run tests to confirm still green:
```bash
{test_runner}
```

### Commit

If all tests pass:
```bash
git add {changed_files}
git commit -m "{type}({task_id}): {task_description}"
```

## 5. Check for additional tests needed

After the first TDD cycle for a task, check eng.md for additional test scenarios:
- Edge cases mentioned in the plan
- Error handling paths
- Boundary conditions

If more tests are needed, ask the user:
"Task {task_id} has additional test scenarios. Continue with next test cycle?"

If yes, repeat the TDD cycle (RED → GREEN → REFACTOR) for each additional test.

## 6. Report results

```
TDD complete for task {task_id}:
- Tests written: {N}
- All passing: {pass_count}/{total_count}
- Files changed: {list}

{If --all: proceed to next task}
{If single task: suggest next task or /rpi:implement to continue}
```

</process>
