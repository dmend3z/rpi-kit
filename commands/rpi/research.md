---
name: rpi:research
description: Analyze feasibility with Atlas (codebase) and Scout (external). Nexus synthesizes.
argument-hint: "<feature-name> [--force]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Agent
  - AskUserQuestion
---

# /rpi:research — Research Phase

Run Atlas (codebase analysis) and Scout (external research) in parallel. Nexus synthesizes their outputs into RESEARCH.md with a GO / GO with concerns / NO-GO verdict.

---

## Step 1: Load config and validate

1. Read `.rpi.yaml` for config. Apply defaults if missing:
   - `specs_dir`: `rpi/specs`
   - `solutions_dir`: `rpi/solutions`
   - `context_file`: `rpi/context.md`
2. Parse `$ARGUMENTS` to extract `{slug}` and optional `--force` flag.
3. Validate `rpi/features/{slug}/REQUEST.md` exists. If not:
   ```
   Feature '{slug}' not found. Run /rpi:new {slug} to start.
   ```
   Stop.

## Step 2: Check existing research

1. Check if `rpi/features/{slug}/research/RESEARCH.md` already exists.
2. If it exists and `--force` was NOT passed:
   - Ask the user: "RESEARCH.md already exists for '{slug}'. Overwrite? (yes/no)"
   - If no: stop.
3. If `--force` was passed or user confirms: proceed (will overwrite).

## Step 3: Gather context

1. Read `rpi/features/{slug}/REQUEST.md` — store as `$REQUEST`.
2. Read `rpi/features/{slug}/DESIGN.md` if it exists — store as `$DESIGN`.
3. Read `rpi/context.md` (project context) if it exists — store as `$CONTEXT`.
4. Scan `rpi/specs/` for any specs relevant to the feature described in REQUEST.md — store as `$RELEVANT_SPECS`.
5. Scan `rpi/solutions/` for any past solutions relevant to this feature — store as `$RELEVANT_SOLUTIONS`.

## Step 4: Launch Atlas and Scout in parallel

Use the Agent tool to launch both agents simultaneously.

### Atlas (codebase analysis)

Launch Atlas agent with this prompt:

```
You are Atlas. Analyze the codebase for feature: {slug}

## Request
{$REQUEST}

## Design Context
{$DESIGN}

## Project Context
{$CONTEXT}

## Relevant Specs
{$RELEVANT_SPECS}

## Relevant Past Solutions
{$RELEVANT_SOLUTIONS}

Your task:
1. Analyze the codebase for patterns, conventions, and architecture relevant to this feature
2. Check rpi/specs/ for existing specifications that overlap or relate
3. Check rpi/solutions/ for past solutions that could be reused
4. Identify files likely affected, patterns to follow, and risks
5. Output using your standard format: [Atlas -- Codebase Analysis]

6. After your analysis, append your activity to rpi/features/{slug}/ACTIVITY.md:

### {current_date} — Atlas (Research)
- **Action:** Codebase analysis for {slug}
- **Scope:** {list files you actually read}
- **Key decisions:** {for each <decision> tag you emitted: "summary (rationale)", separated by semicolons. If none: "No decisions in this phase."}
- **Patterns found:** {count and summary}
- **Quality:** {your quality gate result}
```

### Scout (external research)

Launch Scout agent with this prompt:

```
You are Scout. Research technical feasibility for feature: {slug}

## Request
{$REQUEST}

## Design Context
{$DESIGN}

## Project Context
{$CONTEXT}

## Relevant Past Solutions
{$RELEVANT_SOLUTIONS}

Your task:
1. FIRST check rpi/solutions/ for relevant past solutions before any external research
2. Research technical feasibility of the proposed approach
3. Evaluate alternative libraries/tools with trade-off comparison
4. Identify risks: breaking changes, security issues, maintenance status
5. Find relevant benchmarks, examples, or case studies
6. Output using your standard format: [Scout -- Technical Investigation]

7. After your investigation, append your activity to rpi/features/{slug}/ACTIVITY.md:

### {current_date} — Scout (Research)
- **Action:** External research for {slug}
- **Key decisions:** {for each <decision> tag you emitted: "summary (rationale)", separated by semicolons. If none: "No decisions in this phase."}
- **Sources consulted:** {count and list}
- **Recommendations:** {count and summary}
- **Quality:** {your quality gate result}
```

## Step 5: Wait for completion

Wait for both Atlas and Scout agents to complete. Store their outputs:
- `$ATLAS_OUTPUT` — Atlas's codebase analysis
- `$SCOUT_OUTPUT` — Scout's technical investigation

## Step 6: Detect disagreements

Compare Atlas and Scout outputs for contradictions:
- Atlas says feasible but Scout says risky (or vice versa)
- Different recommendations on approach, libraries, or architecture
- Conflicting risk assessments

If disagreements are detected, launch Nexus for a mini-debate:

```
You are Nexus. Atlas and Scout disagree on key points for feature: {slug}

## Atlas Output
{$ATLAS_OUTPUT}

## Scout Output
{$SCOUT_OUTPUT}

Identify the specific disagreements. For each one:
1. State what Atlas argues
2. State what Scout argues
3. Evaluate the evidence for each position
4. Declare the stronger position with reasoning

Output as: [Nexus -- Debate Summary]
```

Store the debate result as `$DEBATE_OUTPUT`.

## Step 7: Nexus synthesis

Launch Nexus agent to produce the final RESEARCH.md:

```
You are Nexus. Synthesize research for feature: {slug}

## Request
{$REQUEST}

## Atlas Output
{$ATLAS_OUTPUT}

## Scout Output
{$SCOUT_OUTPUT}

## Debate Results (if any)
{$DEBATE_OUTPUT or "No disagreements detected."}

Produce a single RESEARCH.md with this structure:

# Research: {Feature Title}

## Summary
5 lines: verdict, complexity, risk, recommendation, key finding.

## Atlas Findings
{Key findings from Atlas's codebase analysis — preserve strongest evidence}

## Scout Findings
{Key findings from Scout's technical investigation — preserve strongest evidence}

## Consensus
{Points where Atlas and Scout agree}

## Resolved Disagreements
{For each disagreement: what Atlas said, what Scout said, resolution with reasoning}
(or "No disagreements detected.")

## Risks and Mitigations
{Combined risk assessment from both agents}

## Relevant Solutions
{Past solutions from rpi/solutions/ that apply — for knowledge reuse}
(or "No relevant past solutions found.")

## Open Questions
{Unresolved items that need user input}

## Verdict
{GO | GO with concerns | NO-GO}
Confidence: {HIGH | MEDIUM | LOW}

Rules for verdict:
- Any BLOCK finding = NO-GO
- No BLOCK + 2 or more CONCERN findings = GO with concerns
- Otherwise = GO
- NO-GO requires an Alternatives section

After synthesis, append your activity to rpi/features/{slug}/ACTIVITY.md:

### {current_date} — Nexus (Research Synthesis)
- **Action:** Synthesized Atlas + Scout findings for {slug}
- **Key decisions:** {for each <decision> tag you emitted: "summary (rationale)", separated by semicolons. If none: "No decisions in this phase."}
- **Consensus points:** {count}
- **Disagreements resolved:** {count}
- **Quality:** {your quality gate result}
```

## Step 8: Write RESEARCH.md and populate delta baselines

1. Ensure directory exists: `rpi/features/{slug}/research/`
2. Write the Nexus output to `rpi/features/{slug}/research/RESEARCH.md`
3. If Nexus identified relevant existing specs in `rpi/specs/`:
   - Ensure `rpi/features/{slug}/delta/` directory structure exists (ADDED/, MODIFIED/, REMOVED/)
   - Copy relevant spec baselines into `delta/MODIFIED/` so the plan phase has reference copies
   - This gives Mestre (plan phase) the current state of specs that will be changed

## Step 9: Consolidate decisions to DECISIONS.md

1. Read `rpi/features/{slug}/ACTIVITY.md`.
2. Extract all `<decision>` tags from entries belonging to the Research phase (Atlas, Scout, Nexus entries from this run).
3. If no decisions found, skip this step.
4. Write `rpi/features/{slug}/DECISIONS.md`:

```markdown
# Decision Log — {slug}

## Research Phase
_Generated: {current_date}_

| # | Type | Decision | Alternatives | Rationale | Impact |
|---|------|----------|-------------|-----------|--------|
| {N} | {type} | {summary} | {alternatives} | {rationale} | {impact} |
```

5. Number decisions sequentially starting from 1.

## Step 10: Output summary

```
Research complete: rpi/features/{slug}/research/RESEARCH.md

Verdict: {GO | GO with concerns | NO-GO}

Next: /rpi {slug}
Or explicitly: /rpi:plan {slug}
```

If NO-GO:
```
Research complete: rpi/features/{slug}/research/RESEARCH.md

Verdict: NO-GO

Review the RESEARCH.md for details and alternatives.
To override: /rpi:plan {slug} --force
```
