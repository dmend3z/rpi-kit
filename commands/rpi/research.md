---
name: rpi:research
description: Run research phase on a feature. Parallel agent analysis produces RESEARCH.md with GO/NO-GO verdict. Supports tiers (--quick, --standard, --deep).
argument-hint: "<feature-slug> [--quick|--standard|--deep] [--force]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Agent
  - AskUserQuestion
---

<objective>
Run parallel research agents on a feature's REQUEST.md, synthesize findings into RESEARCH.md with a GO/NO-GO verdict.
</objective>

<process>

## 1. Load config and parse arguments

Read `.rpi.yaml` for folder path and default tier.
Parse `$ARGUMENTS`:
- First argument: `{feature-slug}` (required)
- Flags: `--quick`, `--standard`, `--deep` (override config tier)
- Flag: `--force` (proceed even if previous research exists)

## 2. Validate feature

Read `{folder}/{feature-slug}/REQUEST.md`. If it doesn't exist, error:
```
Feature not found: {folder}/{feature-slug}/REQUEST.md
Run /rpi:new {feature-slug} first.
```

If `{folder}/{feature-slug}/research/RESEARCH.md` already exists and `--force` not set, ask user:
"Research already exists for this feature. Overwrite?"

## 3. Determine agent composition by tier

**--quick (2 agents):**
- requirement-parser
- explore-codebase

**--standard (4 agents):**
- requirement-parser
- explore-codebase
- product-manager
- senior-engineer

**--deep (6 agents):**
- requirement-parser
- explore-codebase
- product-manager
- senior-engineer
- cto-advisor
- ux-designer (only if REQUEST.md suggests UI involvement)

## 4. Launch research agents in parallel

Use the Agent tool to launch ALL selected agents concurrently in a single message.

Each agent receives this prompt:
```
You are the {role-name} agent for the RPI workflow.

Read the following files before analysis:
- {folder}/{feature-slug}/REQUEST.md

Then analyze the feature from your role's perspective following the RPI agent guidelines.

Your output format:
## [{Your Role Title}]

### {Section Name}
Verdict: GO | CONCERN | BLOCK
{Findings with evidence — cite specific files, deps, patterns}

### {Next Section}
...

Estimated Complexity: S | M | L | XL

Follow your role-specific rules as defined in the rpi-agents skill.
```

For explore-codebase agent, also instruct it to scan the project codebase for relevant files, patterns, and conventions.

## 5. Synthesize into RESEARCH.md

After all agents complete, use the Agent tool to launch the doc-synthesizer agent.

Prompt:
```
You are the doc-synthesizer agent for the RPI workflow.

Merge the following research outputs into a single RESEARCH.md:

{paste all agent outputs}

Follow the RPI agent guidelines for doc-synthesizer:
1. Executive summary first: verdict, complexity, risk in 5 lines
2. No contradictions left unresolved
3. Preserve the strongest finding from each agent
4. If NO-GO, alternatives section is mandatory
5. Section order: Summary → Requirements → Product → Codebase → Technical → Strategic → Alternatives
```

## 6. Write RESEARCH.md

Write the synthesized output to `{folder}/{feature-slug}/research/RESEARCH.md`.

## 7. Present verdict

Display the executive summary to the user.

If **GO**:
```
Verdict: GO
Next: /rpi:plan {feature-slug}
```

If **GO with concerns**:
```
Verdict: GO with concerns
{list concerns}
Next: /rpi:plan {feature-slug}
```

If **NO-GO**:
```
Verdict: NO-GO
{reasons}

Alternatives:
{suggested alternatives from research}

Override: /rpi:plan {feature-slug} --force
```

</process>
