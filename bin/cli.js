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
RPIKit — Research → Plan → Implement

Usage:
  rpi-kit install            Install for detected tools (Claude Code + Codex)
  rpi-kit install --claude   Install for Claude Code only
  rpi-kit install --codex    Install for Codex only (copies AGENTS.md to cwd)
  rpi-kit uninstall          Remove from Claude Code
  rpi-kit onboarding         Interactive walkthrough of the workflow
  rpi-kit help               Show this help

After install, use in Claude Code:
  /rpi:init                  Configure for your project
  /rpi:new <feature>         Start a new feature
  /rpi:research <feature>    Research feasibility
  /rpi:plan <feature>        Generate implementation plan
  /rpi:implement <feature>   Build it
  /rpi:docs <feature>        Document the code
  /rpi:status                Show all features
`);
}

switch (command) {
  case "install": {
    const claudeOnly = flags.includes("--claude");
    const codexOnly = flags.includes("--codex");

    if (claudeOnly) {
      installClaude();
    } else if (codexOnly) {
      installCodex();
    } else {
      let installed = false;

      if (hasClaude()) {
        installed = installClaude() || installed;
      }

      if (hasCodex()) {
        installed = installCodex() || installed;
      }

      if (!installed && !silent) {
        const result = installClaude();
        if (!result) {
          log("\nNo supported tool detected (claude, codex).");
          log("Run manually after installing Claude Code or Codex:");
          log("  rpi-kit install --claude");
          log("  rpi-kit install --codex");
        }
      }

      if (installed && !silent) {
        log("");
        log("New to RPIKit? Run: rpi-kit onboarding");
      }
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
