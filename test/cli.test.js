const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const CLI = path.resolve(__dirname, "..", "bin", "cli.js");
const AGENTS_SOURCE = path.resolve(__dirname, "..", "AGENTS.md");

function run(args) {
  return execFileSync("node", [CLI, ...args], {
    encoding: "utf8",
    timeout: 10_000,
  });
}

function runSafe(args) {
  try {
    return { stdout: run(args), exitCode: 0 };
  } catch (err) {
    return { stdout: err.stdout || "", stderr: err.stderr || "", exitCode: err.status };
  }
}

describe("rpi-kit help", () => {
  it("shows help with no arguments", () => {
    const output = run([]);
    assert.match(output, /RPIKit/);
    assert.match(output, /Usage:/);
  });

  it("shows help with --help flag", () => {
    const output = run(["--help"]);
    assert.match(output, /RPIKit/);
    assert.match(output, /rpi-kit install/);
  });

  it("shows help with help command", () => {
    const output = run(["help"]);
    assert.match(output, /rpi-kit onboarding/);
  });

  it("lists all slash commands in help", () => {
    const output = run(["help"]);
    assert.match(output, /\/rpi:init/);
    assert.match(output, /\/rpi:new/);
    assert.match(output, /\/rpi:research/);
    assert.match(output, /\/rpi:plan/);
    assert.match(output, /\/rpi:implement/);
    assert.match(output, /\/rpi:docs/);
    assert.match(output, /\/rpi:status/);
  });
});

describe("rpi-kit install --codex", () => {
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rpi-test-"));
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("copies AGENTS.md to target directory", () => {
    const output = execFileSync("node", [CLI, "install", "--codex"], {
      encoding: "utf8",
      cwd: tmpDir,
    });

    assert.match(output, /Codex: copied AGENTS.md/);

    const dest = path.join(tmpDir, "AGENTS.md");
    assert.ok(fs.existsSync(dest), "AGENTS.md should exist in target dir");

    const content = fs.readFileSync(dest, "utf8");
    assert.match(content, /RPIKit Agents/);
  });

  it("skips if AGENTS.md already has RPI definitions", () => {
    const dest = path.join(tmpDir, "AGENTS.md");
    fs.writeFileSync(dest, "# RPIKit Agents\nExisting content");

    const output = execFileSync("node", [CLI, "install", "--codex"], {
      encoding: "utf8",
      cwd: tmpDir,
    });

    assert.match(output, /already contains RPI definitions/);
  });

  it("appends to existing AGENTS.md without RPI content", () => {
    const dest = path.join(tmpDir, "AGENTS.md");
    fs.writeFileSync(dest, "# My Agents\nSome other agents");

    const output = execFileSync("node", [CLI, "install", "--codex"], {
      encoding: "utf8",
      cwd: tmpDir,
    });

    assert.match(output, /Appending RPI agent definitions/);

    const content = fs.readFileSync(dest, "utf8");
    assert.match(content, /My Agents/);
    assert.match(content, /RPIKit Agents/);
  });
});

describe("rpi-kit --silent", () => {
  it("suppresses install output with --silent flag", () => {
    const { stdout } = runSafe(["install", "--silent"]);
    assert.equal(stdout.trim(), "");
  });
});

describe("rpi-kit unknown command", () => {
  it("shows help for unknown commands", () => {
    const output = run(["unknown-command"]);
    assert.match(output, /Usage:/);
  });
});
