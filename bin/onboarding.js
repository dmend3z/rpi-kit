const readline = require("readline");

const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

const steps = [
  {
    title: "Welcome to RPIKit v2",
    body: `
${BOLD}Research → Plan → Implement${RESET}

RPIKit v2 is a structured feature development workflow for Claude Code and Codex.
It guides you through ${CYAN}7 phases${RESET} with validation gates, delta specs, and
knowledge compounding — so you research before you plan, and plan before you code.

${DIM}13 named agents simulate a product team:
Luna (PM), Atlas (Architect), Scout (Researcher), Forge (Builder),
Hawk (Reviewer), Shield (QA), Quill (Doc Writer), and more.${RESET}`,
  },
  {
    title: "The 7-Phase Pipeline",
    body: `
${DIM}Your feature flows through 7 phases:${RESET}

  ${CYAN}/rpi:new${RESET}        Describe your feature → ${BOLD}REQUEST.md${RESET}
       │
  ${CYAN}/rpi:research${RESET}   Parallel agent analysis → ${BOLD}RESEARCH.md${RESET} + GO/NO-GO
       │
  ${CYAN}/rpi:plan${RESET}       Generate delta specs + tasks → ${BOLD}PLAN.md${RESET} + eng/pm/ux.md
       │
  ${CYAN}/rpi:implement${RESET}  Execute tasks with tracking → ${BOLD}IMPLEMENT.md${RESET}
       │
  ${CYAN}/rpi:simplify${RESET}   Code quality checks → auto-fix issues
       │
  ${CYAN}/rpi:review${RESET}     Review against plan → PASS / FAIL
       │
  ${CYAN}/rpi:docs${RESET}       Document the code → ${BOLD}DOCS.md${RESET} + changelog

${DIM}Plus: /rpi:learn for knowledge compounding, /rpi:archive to wrap up.${RESET}`,
  },
  {
    title: "Key v2 Concepts",
    body: `
${BOLD}Delta Specs${RESET}
${DIM}Specs capture system state. Features only record what changes:${RESET}
  rpi/specs/              ${DIM}Source of truth${RESET}
  rpi/features/{slug}/delta/
    ├── ADDED/            ${DIM}New spec files${RESET}
    ├── MODIFIED/         ${DIM}Changes to existing specs${RESET}
    └── REMOVED/          ${DIM}Specs being deleted${RESET}

${BOLD}Knowledge Compounding${RESET}
${DIM}A persistent knowledge base that grows with every feature:${RESET}
  ${CYAN}/rpi:learn${RESET}             ${DIM}Manually capture lessons${RESET}
  ${CYAN}/rpi:archive${RESET}           ${DIM}Merge delta into specs, clean up${RESET}

${DIM}Scout checks past solutions before external research.${RESET}`,
  },
  {
    title: "Feature Folder Structure",
    body: `
${DIM}Each feature gets its own folder with all artifacts:${RESET}

  rpi/features/
  └── ${BOLD}your-feature/${RESET}
      ├── REQUEST.md              ${DIM}What and why${RESET}
      ├── research/
      │   └── RESEARCH.md         ${DIM}GO/NO-GO analysis${RESET}
      ├── plan/
      │   ├── PLAN.md             ${DIM}Task checklist${RESET}
      │   ├── eng.md              ${DIM}Technical spec${RESET}
      │   ├── pm.md               ${DIM}Product requirements${RESET}
      │   └── ux.md               ${DIM}UX design${RESET}
      ├── delta/                  ${DIM}What changes (specs diff)${RESET}
      │   ├── ADDED/
      │   ├── MODIFIED/
      │   └── REMOVED/
      └── implement/
          ├── IMPLEMENT.md        ${DIM}Execution audit trail${RESET}
          └── DOCS.md             ${DIM}Documentation summary${RESET}`,
  },
  {
    title: "Quick Flow & Flags",
    body: `
${BOLD}Quick Flow${RESET} ${DIM}— for small features${RESET}

  ${CYAN}/rpi:new my-feature --quick${RESET}

  Luna asks 1-2 questions → compact REQUEST.md → Forge implements
  directly with a mini-plan (3-5 tasks). Skips research and full plan.

${BOLD}Global Flags${RESET}

  ${GREEN}--quick${RESET}          Skip research + full plan
  ${YELLOW}--force${RESET}          Re-run a phase even if artifacts exist
  ${CYAN}--skip=phase${RESET}     Skip specific phase(s)
  ${CYAN}--from=phase${RESET}     Start from a specific phase

${DIM}TDD is also supported — enable in .rpi.yaml with tdd: true${RESET}`,
  },
  {
    title: "Get Started",
    body: `
${BOLD}Step 1:${RESET} Open Claude Code in your project

${BOLD}Step 2:${RESET} Run the interactive onboarding
  ${CYAN}/rpi:onboarding${RESET}

${DIM}This will analyze your codebase, generate a project profile,
suggest features to build, and guide you through your first feature.${RESET}

${DIM}Or jump straight in:${RESET}
  ${CYAN}/rpi:init${RESET}              Configure RPIKit
  ${CYAN}/rpi:new my-feature${RESET}    Start a feature

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
