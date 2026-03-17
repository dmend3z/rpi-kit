#!/usr/bin/env node

const { execFileSync, spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const PLUGIN_DIR = path.resolve(__dirname, "..");
const AGENTS_FILE = path.join(PLUGIN_DIR, "AGENTS.md");

const command = process.argv[2];
const flags = process.argv.slice(3);
const silent = flags.includes("--silent");

function log(msg) {
  if (!silent) console.log(msg);
}

function hasClaude() {
  const result = spawnSync("claude", ["--version"], { stdio: "pipe" });
  return result.status === 0;
}

function hasCodex() {
  const result = spawnSync("codex", ["--version"], { stdio: "pipe" });
  return result.status === 0;
}

function hasGeminiCLI() {
  const result = spawnSync("gemini", ["--version"], { stdio: "pipe" });
  return result.status === 0;
}

function installClaude() {
  log("Installing RPIKit for Claude Code...");
  try {
    execFileSync("claude", ["plugin", "install", PLUGIN_DIR], {
      stdio: silent ? "pipe" : "inherit",
    });
    log("Claude Code: installed.");
    return true;
  } catch {
    log("Claude Code: could not register plugin automatically.");
    log("  Manual install: claude plugin install " + PLUGIN_DIR);
    return false;
  }
}

function installCodex() {
  const cwd = process.cwd();
  const dest = path.join(cwd, "AGENTS.md");

  if (fs.existsSync(dest)) {
    const existing = fs.readFileSync(dest, "utf8");
    if (existing.includes("RPI Agent Definitions")) {
      log("Codex: AGENTS.md already contains RPI definitions.");
      return true;
    }
    log("Codex: AGENTS.md already exists. Appending RPI agent definitions...");
    const rpiAgents = fs.readFileSync(AGENTS_FILE, "utf8");
    fs.appendFileSync(dest, "\n\n" + rpiAgents);
    log("Codex: appended to AGENTS.md.");
    return true;
  }

  fs.copyFileSync(AGENTS_FILE, dest);
  log("Codex: copied AGENTS.md to project root.");
  return true;
}

function installGeminiCLI() {
  log("Installing RPIKit for Gemini CLI...");
  log("Gemini CLI: coming soon. Please see documentation for manual setup.");
  return true;
}

function uninstallClaude() {
  log("Removing RPIKit from Claude Code...");
  try {
    execFileSync("claude", ["plugin", "remove", "rpi-kit"], {
      stdio: silent ? "pipe" : "inherit",
    });
    log("Claude Code: removed.");
    return true;
  } catch {
    log("Claude Code: could not remove plugin.");
    return false;
  }
}

function printHelp() {
  console.log(`
RPIKit v2 — Research → Plan → Implement

  7-phase workflow with 13 named agents, delta specs,
  and knowledge compounding for AI-assisted feature development.

Usage:
  rpi-kit install            Interactive setup for AI tools
  rpi-kit install --claude   Install for Claude Code only
  rpi-kit install --codex    Install for Codex only (copies AGENTS.md to cwd)
  rpi-kit install --gemini   Install for Gemini CLI only
  rpi-kit uninstall          Remove from Claude Code
  rpi-kit onboarding         Interactive walkthrough of the workflow
  rpi-kit help               Show this help

Commands (14):
  /rpi:new <feature>         Describe your feature → REQUEST.md
  /rpi:research <feature>    Parallel agent analysis → RESEARCH.md
  /rpi:plan <feature>        Generate specs + tasks → PLAN.md
  /rpi:implement <feature>   Execute tasks with tracking → IMPLEMENT.md
  /rpi:simplify <feature>    Code quality checks → auto-fix issues
  /rpi:review <feature>      Review against plan → PASS / FAIL
  /rpi:docs <feature>        Document the code → DOCS.md + changelog

  /rpi:init                  Configure RPIKit for your project
  /rpi:status                Show all features and their phases
  /rpi <feature>             Auto-progress to next phase
  /rpi:onboarding            Guided first-time setup
  /rpi:learn [description]   Capture a solution to knowledge base
  /rpi:archive <feature>     Archive a completed feature
  /rpi:party                 Multi-agent debate on any topic

Agents (13):
  Luna (Analyst) · Atlas (Explorer) · Scout (Researcher) · Nexus (Synthesizer)
  Mestre (Architect) · Clara (PM) · Pixel (UX) · Forge (Builder)
  Sage (Tester) · Razor (Simplifier) · Hawk (Reviewer) · Shield (Security)
  Quill (Doc Writer)
`);
}

async function run() {
  switch (command) {
    case "install": {
      const claudeOnly = flags.includes("--claude");
      const codexOnly = flags.includes("--codex");
      const geminiOnly = flags.includes("--gemini");

      if (claudeOnly) {
        installClaude();
        break;
      }
      if (codexOnly) {
        installCodex();
        break;
      }
      if (geminiOnly) {
        installGeminiCLI();
        break;
      }

      // If silent, use the original auto-install behavior
      if (silent) {
        let installed = false;
        if (hasClaude()) installed = installClaude() || installed;
        if (hasCodex()) installed = installCodex() || installed;
        if (hasGeminiCLI()) installed = installGeminiCLI() || installed;
        if (!installed) {
          const result = installClaude();
          if (!result) {
            log("\nNo supported tool detected (claude, codex, gemini).");
            log("Run manually after installing Claude Code, Codex, or Gemini CLI:");
            log("  rpi-kit install --claude");
            log("  rpi-kit install --codex");
            log("  rpi-kit install --gemini");
          }
        }
        break;
      }

      // Interactive prompt
      let p;
      let color;
      try {
        p = await import("@clack/prompts");
        color = (await import("picocolors")).default;
      } catch (e) {
        console.error("Failed to load interactive prompt dependencies. Falling back to default install.");
        let installed = false;
        if (hasClaude()) installed = installClaude() || installed;
        if (hasCodex()) installed = installCodex() || installed;
        if (!installed) installClaude();
        break;
      }

      console.clear();
      p.intro(color.bgCyan(color.black(" RPIKit Setup ")));

      p.log.message(color.dim("RPIKit configured: Claude Code, Codex, Gemini CLI"));

      const options = [
        { value: "claude", label: "Claude Code", hint: hasClaude() ? "detected" : "" },
        { value: "codex", label: "Codex", hint: hasCodex() ? "detected" : "" },
        { value: "gemini", label: "Gemini CLI", hint: hasGeminiCLI() ? "detected" : "" }
      ];

      const initialValues = options.filter(o => o.hint === "detected").map(o => o.value);
      if (initialValues.length === 0) {
        initialValues.push("claude"); // default selection if none detected
      }

      const selectedTools = await p.multiselect({
        message: `Select tools to set up (${options.length} available)`,
        options: options,
        initialValues,
        required: false
      });

      if (p.isCancel(selectedTools)) {
        p.cancel("Setup cancelled.");
        process.exit(0);
      }

      if (selectedTools.length === 0) {
        p.outro("No tools selected.");
        break;
      }

      console.log(); // Spacing
      
      let installed = false;
      for (const tool of selectedTools) {
        if (tool === "claude") {
          installed = installClaude() || installed;
        } else if (tool === "codex") {
          installed = installCodex() || installed;
        } else if (tool === "gemini") {
          installed = installGeminiCLI() || installed;
        }
      }

      if (installed) {
        console.log();
        p.outro(color.green("Setup complete! New to RPIKit? Run: rpi-kit onboarding"));
      } else {
        p.outro(color.yellow("Setup finished with some issues."));
      }
      
      break;
    }

    case "onboarding": {
      const { run } = require("./onboarding");
      run();
      break;
    }

    case "uninstall":
      uninstallClaude();
      break;

    case "help":
    case "--help":
    case "-h":
      printHelp();
      break;

    default:
      if (!silent) printHelp();
      break;
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
