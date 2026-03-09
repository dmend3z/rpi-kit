const readline = require("readline");

const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

const steps = [
  {
    title: "Welcome to RPIKit",
    body: `
${BOLD}Research → Plan → Implement${RESET}

RPIKit is a structured feature development workflow for Claude Code and Codex.
It guides you through 3 phases with validation gates, so you research before
you plan, and plan before you code.

${DIM}11 specialized agents simulate a product team:
engineers, PMs, designers, reviewers — all working in parallel.${RESET}`,
  },
  {
    title: "The Pipeline",
    body: `
${DIM}Your feature flows through these phases:${RESET}

  ${CYAN}/rpi:new${RESET}        Describe your feature → ${BOLD}REQUEST.md${RESET}
       │
  ${CYAN}/rpi:research${RESET}   Parallel agent analysis → ${BOLD}RESEARCH.md${RESET} + GO/NO-GO
       │
  ${CYAN}/rpi:plan${RESET}       Generate specs + tasks → ${BOLD}PLAN.md${RESET} + eng/pm/ux.md
       │
  ${CYAN}/rpi:implement${RESET}  Execute tasks with tracking → ${BOLD}IMPLEMENT.md${RESET}
       │
  ${CYAN}/rpi:simplify${RESET}   Code quality checks → auto-fix issues
       │
  ${CYAN}/rpi:review${RESET}     Review against plan → PASS / FAIL
       │
  ${CYAN}/rpi:docs${RESET}       Document the code → inline docs + changelog`,
  },
  {
    title: "Research Tiers",
    body: `
${DIM}Control depth and cost with tier flags:${RESET}

  ${GREEN}--quick${RESET}      2 agents    Fast feasibility check
  ${YELLOW}--standard${RESET}   4 agents    Scope + technical approach ${DIM}(default)${RESET}
  ${CYAN}--deep${RESET}       6 agents    Full strategic analysis

${DIM}Agents run in parallel — deep research doesn't mean slow research.${RESET}`,
  },
  {
    title: "Feature Folder Structure",
    body: `
${DIM}Each feature gets its own folder with all artifacts:${RESET}

  rpi/
  └── ${BOLD}your-feature/${RESET}
      ├── REQUEST.md              ${DIM}What and why${RESET}
      ├── research/
      │   └── RESEARCH.md         ${DIM}GO/NO-GO analysis${RESET}
      ├── plan/
      │   ├── PLAN.md             ${DIM}Task checklist${RESET}
      │   ├── eng.md              ${DIM}Technical spec${RESET}
      │   ├── pm.md               ${DIM}Product requirements${RESET}
      │   └── ux.md               ${DIM}UX design${RESET}
      └── implement/
          ├── IMPLEMENT.md        ${DIM}Execution audit trail${RESET}
          └── DOCS.md             ${DIM}Documentation summary${RESET}`,
  },
  {
    title: "TDD Support",
    body: `
${DIM}RPIKit supports strict Test-Driven Development per task:${RESET}

  ${CYAN}RED${RESET}      → Write one failing test
  ${GREEN}GREEN${RESET}    → Write minimal code to pass
  ${YELLOW}REFACTOR${RESET} → Clean up, re-run tests

${DIM}Enable in .rpi.yaml:${RESET}
  tdd: true
  test_runner: auto

${DIM}Or run standalone:${RESET}  /rpi:test your-feature --task 1.2`,
  },
  {
    title: "Get Started",
    body: `
${BOLD}Step 1:${RESET} Open Claude Code in your project

${BOLD}Step 2:${RESET} Initialize RPIKit
  ${CYAN}/rpi:init${RESET}

${BOLD}Step 3:${RESET} Create your first feature
  ${CYAN}/rpi:new my-feature${RESET}

${BOLD}Step 4:${RESET} Follow the pipeline
  ${CYAN}/rpi:research my-feature${RESET}
  ${CYAN}/rpi:plan my-feature${RESET}
  ${CYAN}/rpi:implement my-feature${RESET}

${DIM}Use /rpi:status anytime to see where you are.${RESET}

${GREEN}Happy building!${RESET}`,
  },
];

function run() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let current = 0;

  function show(index) {
    const step = steps[index];
    const progress = `${DIM}[${index + 1}/${steps.length}]${RESET}`;

    console.clear();
    console.log();
    console.log(`  ${progress} ${BOLD}${step.title}${RESET}`);
    console.log(`  ${"─".repeat(50)}`);
    console.log(step.body);
    console.log();

    if (index < steps.length - 1) {
      rl.question(`  ${DIM}Press Enter to continue (q to quit)${RESET} `, (answer) => {
        if (answer.toLowerCase() === "q") {
          rl.close();
          return;
        }
        current++;
        show(current);
      });
    } else {
      rl.close();
    }
  }

  show(0);
}

module.exports = { run };
