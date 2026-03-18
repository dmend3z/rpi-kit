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

  // 1. Ensure marketplace is registered
  const listResult = spawnSync("claude", ["plugin", "marketplace", "list"], { encoding: "utf8", stdio: "pipe" });
  const hasMarketplace = (listResult.stdout || "").includes("rpi-kit");

  if (!hasMarketplace) {
    log("Adding rpi-kit marketplace...");
    try {
      execFileSync("claude", ["plugin", "marketplace", "add", "dmend3z/rpi-kit"], {
        stdio: silent ? "pipe" : "inherit",
      });
    } catch {
      log("Could not add marketplace. Add manually:");
      log("  claude plugin marketplace add dmend3z/rpi-kit");
      return false;
    }
  }

  // 2. Install plugin from marketplace
  try {
    execFileSync("claude", ["plugin", "install", "rpi-kit"], {
      stdio: silent ? "pipe" : "inherit",
    });
    log("Claude Code: installed.");
    return true;
  } catch {
    log("Claude Code: could not install plugin.");
    log("  Manual install:");
    log("    claude plugin marketplace add dmend3z/rpi-kit");
    log("    claude plugin install rpi-kit");
    return false;
  }
}

function installCodex() {
  const cwd = process.cwd();
  const dest = path.join(cwd, "AGENTS.md");

  if (fs.existsSync(dest)) {
    const existing = fs.readFileSync(dest, "utf8");
    if (existing.includes("RPIKit Agents")) {
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
  if (!hasGeminiCLI()) {
    log("Gemini CLI not found. Skipping.");
    return false;
  }

  try {
    // PLUGIN_DIR is the root of the npm package
    execFileSync("gemini", ["extensions", "link", PLUGIN_DIR], {
      stdio: silent ? "pipe" : "inherit",
    });
    log("Gemini CLI: extension linked.");
    return true;
  } catch (e) {
    log("Gemini CLI: could not link extension.");
    log("  Manual link:");
    log(`    gemini extensions link ${PLUGIN_DIR}`);
    return false;
  }
}

function findInstalledPlugin() {
  const home = process.env.HOME || process.env.USERPROFILE;
  const searchDirs = [
    path.join(home, ".claude", "plugins", "marketplaces", "rpi-kit"),
    path.join(home, ".claude", "plugins", "installed", "rpi-kit"),
  ];
  for (const dir of searchDirs) {
    if (fs.existsSync(path.join(dir, ".claude-plugin", "plugin.json"))) {
      return { dir, type: "git" };
    }
  }
  // Check npm cache: ~/.claude/plugins/cache/rpi-kit/rpi-kit/{version}/
  const cacheBase = path.join(home, ".claude", "plugins", "cache", "rpi-kit", "rpi-kit");
  if (fs.existsSync(cacheBase)) {
    try {
      const versions = fs.readdirSync(cacheBase).filter(f => !f.startsWith("."));
      if (versions.length > 0) {
        // Pick the latest version directory
        const latest = versions.sort().pop();
        const dir = path.join(cacheBase, latest);
        if (fs.existsSync(path.join(dir, ".claude-plugin", "plugin.json"))) {
          return { dir, type: "npm" };
        }
      }
    } catch {}
  }
  // Glob fallback
  const pluginsRoot = path.join(home, ".claude", "plugins");
  if (fs.existsSync(pluginsRoot)) {
    try {
      const result = execFileSync("find", [pluginsRoot, "-path", "*/rpi-kit/.claude-plugin/plugin.json", "-maxdepth", 6], { encoding: "utf8" }).trim();
      if (result) {
        const pluginJson = result.split("\n")[0];
        const dir = path.resolve(pluginJson, "..", "..");
        const isNpm = dir.includes(path.join("cache", "rpi-kit"));
        return { dir, type: isNpm ? "npm" : "git" };
      }
    } catch {}
  }
  return null;
}

function updatePlugin() {
  log("Updating RPIKit for all detected tools...\n");

  let updated = false;

  // 1. Claude Code
  if (hasClaude()) {
    log("── Claude Code ──");
    const result = findInstalledPlugin();
    if (result) {
      const { dir: pluginDir, type: installType } = result;
      let currentVersion = "unknown";
      try {
        const pj = JSON.parse(fs.readFileSync(path.join(pluginDir, ".claude-plugin", "plugin.json"), "utf8"));
        currentVersion = pj.version || "unknown";
      } catch {}
      if (installType === "npm") {
        updated = updateNpmPlugin(pluginDir, currentVersion) || updated;
      } else {
        updated = updateGitPlugin(pluginDir, currentVersion) || updated;
      }
    } else {
      log("Not installed. Run: rpi-kit install --claude");
    }
    log("");
  }

  // 2. Codex
  if (hasCodex()) {
    log("── Codex ──");
    updated = installCodex() || updated;
    log("");
  }

  // 3. Gemini CLI
  if (hasGeminiCLI()) {
    log("── Gemini CLI ──");
    updated = installGeminiCLI() || updated;
    log("");
  }

  if (!updated) {
    log("No tools detected. Install first: rpi-kit install");
  }

  return updated;
}

function updateNpmPlugin(pluginDir, currentVersion) {
  log(`Current: v${currentVersion} (npm)`);
  log("Checking for updates...");

  // Check latest version on npm
  const npmView = spawnSync("npm", ["view", "rpi-kit", "version"], { encoding: "utf8", stdio: "pipe" });
  const latestVersion = (npmView.stdout || "").trim();

  if (!latestVersion) {
    log("Could not check npm for latest version.");
    log("Update manually:");
    log("  claude plugin remove rpi-kit && claude plugin install rpi-kit");
    return false;
  }

  if (latestVersion === currentVersion) {
    log(`Already up to date (v${currentVersion}).`);
    return true;
  }

  log(`Update available: v${currentVersion} → v${latestVersion}`);
  log("Updating...");

  // Remove old version
  const remove = spawnSync("claude", ["plugin", "remove", "rpi-kit"], { encoding: "utf8", stdio: "pipe" });
  if (remove.status !== 0) {
    log("Could not remove current version. Update manually:");
    log("  claude plugin remove rpi-kit && claude plugin install rpi-kit");
    return false;
  }

  // Install new version
  const install = spawnSync("claude", ["plugin", "install", "rpi-kit"], { encoding: "utf8", stdio: "pipe" });
  if (install.status !== 0) {
    log("Could not install new version. Install manually:");
    log("  claude plugin install rpi-kit");
    return false;
  }

  log(`\nv${currentVersion} → v${latestVersion}\n`);
  log("Restart Claude Code to load the new version.");
  return true;
}

function updateGitPlugin(pluginDir, currentVersion) {
  const gitDir = path.join(pluginDir, ".git");
  if (!fs.existsSync(gitDir)) {
    log("Installed plugin has no .git directory — cannot update via git pull.");
    log("Re-install to enable updates:");
    log("  claude plugin remove rpi-kit");
    log("  claude plugin install rpi-kit");
    return false;
  }

  const currentCommit = spawnSync("git", ["-C", pluginDir, "rev-parse", "--short", "HEAD"], { encoding: "utf8" });
  const oldCommit = (currentCommit.stdout || "").trim();

  log(`Current: v${currentVersion} (${oldCommit})`);
  log("Pulling latest...");

  const pull = spawnSync("git", ["-C", pluginDir, "pull", "origin", "main"], { encoding: "utf8", stdio: "pipe" });

  if (pull.status !== 0) {
    log("Git pull failed:");
    log(pull.stderr || pull.stdout || "Unknown error");
    return false;
  }

  if ((pull.stdout || "").includes("Already up to date")) {
    log("Already up to date.");
    return true;
  }

  // New version
  let newVersion = "unknown";
  try {
    const pj = JSON.parse(fs.readFileSync(path.join(pluginDir, ".claude-plugin", "plugin.json"), "utf8"));
    newVersion = pj.version || "unknown";
  } catch {}

  const newCommit = spawnSync("git", ["-C", pluginDir, "rev-parse", "--short", "HEAD"], { encoding: "utf8" });
  const newHash = (newCommit.stdout || "").trim();

  // Changelog
  if (oldCommit) {
    const changelog = spawnSync("git", ["-C", pluginDir, "log", "--oneline", `${oldCommit}..${newHash}`], { encoding: "utf8" });
    if (changelog.stdout) {
      log(`\nv${currentVersion} (${oldCommit}) → v${newVersion} (${newHash})\n`);
      log("Changes:");
      log(changelog.stdout.trim());
    }
  }

  // Clear cache
  const home = process.env.HOME || process.env.USERPROFILE;
  const cacheDir = path.join(home, ".claude", "plugins", "cache", "rpi-kit");
  if (fs.existsSync(cacheDir)) {
    fs.rmSync(cacheDir, { recursive: true, force: true });
    log("\nPlugin cache cleared.");
  }

  log("\nRestart Claude Code to load the new version.");
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
  rpi-kit update             Update installed plugin to latest version
  rpi-kit uninstall          Remove from Claude Code
  rpi-kit onboarding         Interactive walkthrough of the workflow
  rpi-kit help               Show this help

Commands (18):
  /rpi:new <feature>         Describe your feature → REQUEST.md
  /rpi:fix <bug>             Quick bugfix — interview, plan, implement in one step
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
  /rpi:update                Update plugin to latest version
  /rpi:learn [description]   Capture a solution to knowledge base
  /rpi:archive <feature>     Archive a completed feature
  /rpi:party                 Multi-agent debate on any topic
  /rpi:docs-gen              Generate CLAUDE.md from codebase analysis
  /rpi:evolve [--quick]      Product evolution analysis with health score

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

    case "update":
      updatePlugin();
      break;

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
