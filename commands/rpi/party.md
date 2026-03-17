---
name: rpi:party
description: Multi-agent debate on any topic. Nexus facilitates, 3-5 agents discuss.
argument-hint: "[feature-name] \"topic to debate\""
allowed-tools:
  - Read
  - Glob
  - Grep
  - Agent
  - AskUserQuestion
---

# /rpi:party — Party Mode

Multi-agent debate facilitated by Nexus. Select 3-5 agents based on the topic, let them argue their perspectives, then synthesize a recommendation with trade-offs.

---

## Step 1: Load config

Read `.rpi.yaml` from the project root. Extract:
- `folder` (default: `rpi/features`)
- `solutions_dir` (default: `rpi/solutions`)
- `context_file` (default: `rpi/context.md`)
- `party_default_agents` (default: `4`)

If `.rpi.yaml` doesn't exist, use defaults silently.

## Step 2: Parse arguments

Parse `$ARGUMENTS` to extract:
- Optional `{slug}` — a feature name (first word, if it doesn't start with `"`)
- `{topic}` — the debate topic (quoted string, or everything after the slug)

If no topic is provided, ask the user with AskUserQuestion:
"What topic do you want to debate? (e.g. 'GraphQL vs REST for the API?', 'how to handle token refresh?')"

## Step 3: Gather feature context (if slug provided)

If a feature slug was provided:
1. Check if `rpi/features/{slug}/` exists. If not:
   ```
   Feature '{slug}' not found. Proceeding without feature context.
   ```
   Clear the slug and continue.
2. If it exists, read available artifacts — store as `$FEATURE_CONTEXT`:
   - `rpi/features/{slug}/REQUEST.md` if it exists
   - `rpi/features/{slug}/research/RESEARCH.md` if it exists
   - `rpi/features/{slug}/plan/PLAN.md` if it exists

Read `rpi/context.md` (project context) if it exists — store as `$PROJECT_CONTEXT`.

## Step 4: Nexus selects agents

Use the Agent tool to launch Nexus for agent selection:

```
You are Nexus. Analyze the following debate topic and select 3-5 agents to participate.

## Topic
{topic}

## Feature Context
{$FEATURE_CONTEXT or "No feature context."}

## Project Context
{$PROJECT_CONTEXT or "No project context."}

Select agents based on the topic category:

- Technical topics (architecture, implementation, patterns, performance) → Mestre + Atlas + Scout
- Product topics (UX, requirements, scope, user experience) → Clara + Luna + Pixel
- Security topics (auth, data protection, vulnerabilities, compliance) → Shield + Hawk + Mestre
- Mixed topics (trade-offs, strategy, cross-cutting concerns) → Mestre + Clara + Atlas + Shield

You may adjust the selection if the topic warrants it. Always pick 3-5 agents. For each selected agent, provide a one-line reason why they're relevant.

Output format:
## Selected Agents
1. {AgentName} — {reason}
2. {AgentName} — {reason}
...

## Category
{Technical | Product | Security | Mixed}
```

Store the output as `$NEXUS_SELECTION`. Parse the selected agent names from it.

## Step 5: Launch debate agents in parallel

Use the Agent tool to launch all selected agents simultaneously. Each agent receives this prompt (adapted to their persona):

```
You are {AgentName}. You've been called into a Party Mode debate.

## Topic
{topic}

## Feature Context
{$FEATURE_CONTEXT or "No feature context."}

## Project Context
{$PROJECT_CONTEXT or "No project context."}

Share your perspective on this topic IN CHARACTER. Be opinionated and specific:
1. State your position clearly — what do you recommend and why?
2. Identify trade-offs and risks from your area of expertise
3. If you disagree with an obvious counter-argument, preemptively address it
4. Provide concrete examples or references where possible

Keep your response focused and under 500 words.

Output format:
## {AgentName}'s Perspective
{your position and arguments}

### Trade-offs
- {trade-off 1}
- {trade-off 2}

### Recommendation
{your specific recommendation in 1-2 sentences}
```

Store each agent's output as `$AGENT_{NAME}_OUTPUT`.

## Step 6: Nexus synthesizes debate

Launch Nexus agent to produce the final synthesis:

```
You are Nexus. Synthesize the Party Mode debate on: {topic}

## Agent Perspectives
{all $AGENT_{NAME}_OUTPUT concatenated}

## Feature Context
{$FEATURE_CONTEXT or "No feature context."}

Your task:
1. Identify points of CONSENSUS — where agents agree
2. Identify points of DISAGREEMENT — where agents conflict
3. For each disagreement, evaluate the strength of each position
4. Produce a clear recommendation with trade-offs
5. Note any open questions that the team should resolve

Output format:
# Party Mode: {topic}

## Participants
{list of agents and their roles}

## Consensus
{points where agents agree}

## Disagreements
{for each: what each side argues, strength of evidence, resolution}

## Recommendation
{clear recommendation with reasoning}

## Trade-offs
{key trade-offs to be aware of}

## Open Questions
{unresolved items, if any}
```

Store the output as `$NEXUS_SYNTHESIS`.

## Step 7: Present results

Output the full `$NEXUS_SYNTHESIS` to the user.

## Step 8: Offer to save decision

Ask the user with AskUserQuestion:
"Save this decision to rpi/solutions/decisions/? (y/n)"

### If yes:

1. Derive a slug from the topic (kebab-case, max 50 chars).
2. Ensure directory exists: `rpi/solutions/decisions/`
3. Write to `rpi/solutions/decisions/{topic-slug}.md`:
   ```markdown
   # {Topic}

   ## Decision
   {recommendation from Nexus synthesis}

   ## Context
   {summary of the debate — consensus, disagreements, trade-offs}

   ## Participants
   {list of agents involved}

   ## Date
   {YYYY-MM-DD}
   ```

4. Output:
   ```
   Decision saved: rpi/solutions/decisions/{topic-slug}.md
   ```

### If no:

Output:
```
Decision not saved. You can revisit this topic anytime with /rpi:party.
```
