const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const COMMANDS_DIR = path.join(__dirname, "..", "commands", "rpi");
const AGENTS_DIR = path.join(__dirname, "..", "agents");
const SKILLS_DIR = path.join(__dirname, "..", "skills");

const EXPECTED_COMMANDS = [
  "new",
  "research",
  "plan",
  "implement",
  "simplify",
  "review",
  "docs",
  "docs-gen",
  "evolve",
  "rpi",
  "init",
  "status",
  "party",
  "learn",
  "archive",
  "onboarding",
  "update",
];

const EXPECTED_AGENTS = [
  "luna",
  "atlas",
  "scout",
  "nexus",
  "mestre",
  "clara",
  "pixel",
  "forge",
  "sage",
  "razor",
  "hawk",
  "shield",
  "quill",
];

const EXPECTED_SKILLS = ["rpi-workflow", "rpi-agents"];

describe("RPIKit v2 — Commands", () => {
  it("all expected command files exist", () => {
    for (const cmd of EXPECTED_COMMANDS) {
      const filePath = path.join(COMMANDS_DIR, `${cmd}.md`);
      assert.ok(fs.existsSync(filePath), `Missing command: ${cmd}.md`);
    }
  });

  it("no unexpected command files exist", () => {
    if (!fs.existsSync(COMMANDS_DIR)) return;
    const files = fs
      .readdirSync(COMMANDS_DIR)
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(".md", ""));
    for (const file of files) {
      assert.ok(
        EXPECTED_COMMANDS.includes(file),
        `Unexpected command: ${file}.md`
      );
    }
  });

  it("all commands have valid frontmatter", () => {
    for (const cmd of EXPECTED_COMMANDS) {
      const filePath = path.join(COMMANDS_DIR, `${cmd}.md`);
      if (!fs.existsSync(filePath)) {
        assert.fail(`${cmd}.md does not exist`);
      }
      const content = fs.readFileSync(filePath, "utf8");
      assert.match(content, /^---\n/, `${cmd}.md must start with ---`);
      assert.match(
        content,
        /name:\s*rpi/,
        `${cmd}.md must have name: rpi*`
      );
      assert.match(
        content,
        /description:/,
        `${cmd}.md must have description`
      );
      assert.match(
        content,
        /allowed-tools:/,
        `${cmd}.md must have allowed-tools`
      );
    }
  });

  it("phase commands reference correct agents", () => {
    const agentMap = {
      new: ["Luna"],
      research: ["Atlas", "Scout", "Nexus"],
      plan: ["Mestre", "Clara", "Nexus"],
      implement: ["Forge"],
      simplify: ["Razor"],
      review: ["Hawk", "Shield", "Sage", "Nexus"],
      docs: ["Quill"],
    };

    for (const [cmd, agents] of Object.entries(agentMap)) {
      const filePath = path.join(COMMANDS_DIR, `${cmd}.md`);
      if (!fs.existsSync(filePath)) {
        assert.fail(`${cmd}.md does not exist`);
      }
      const content = fs.readFileSync(filePath, "utf8");
      for (const agent of agents) {
        assert.match(
          content,
          new RegExp(agent, "i"),
          `${cmd}.md should reference agent ${agent}`
        );
      }
    }
  });

  it("auto-flow command detects all 7 phases", () => {
    const filePath = path.join(COMMANDS_DIR, "rpi.md");
    if (!fs.existsSync(filePath)) {
      assert.fail("rpi.md does not exist");
    }
    const content = fs.readFileSync(filePath, "utf8");
    const phases = [
      "REQUEST",
      "RESEARCH",
      "PLAN",
      "IMPLEMENT",
      "simplify",
      "review",
      "docs",
    ];
    for (const phase of phases) {
      assert.match(
        content,
        new RegExp(phase, "i"),
        `rpi.md should reference ${phase} phase`
      );
    }
  });

  it("party command supports feature context and standalone", () => {
    const filePath = path.join(COMMANDS_DIR, "party.md");
    if (!fs.existsSync(filePath)) {
      assert.fail("party.md does not exist");
    }
    const content = fs.readFileSync(filePath, "utf8");
    assert.match(content, /Nexus/i, "party.md should use Nexus as facilitator");
    assert.match(content, /Agent/i, "party.md should use Agent tool");
  });

  it("learn command writes to solutions directory", () => {
    const filePath = path.join(COMMANDS_DIR, "learn.md");
    if (!fs.existsSync(filePath)) {
      assert.fail("learn.md does not exist");
    }
    const content = fs.readFileSync(filePath, "utf8");
    assert.match(content, /solutions/i, "learn.md should reference solutions");
  });

  it("archive command merges delta specs", () => {
    const filePath = path.join(COMMANDS_DIR, "archive.md");
    if (!fs.existsSync(filePath)) {
      assert.fail("archive.md does not exist");
    }
    const content = fs.readFileSync(filePath, "utf8");
    assert.match(content, /delta/i, "archive.md should reference delta");
    assert.match(content, /specs/i, "archive.md should reference specs");
  });
});

describe("RPIKit v2 — Agents", () => {
  it("all expected agent files exist", () => {
    for (const agent of EXPECTED_AGENTS) {
      const filePath = path.join(AGENTS_DIR, `${agent}.md`);
      assert.ok(fs.existsSync(filePath), `Missing agent: ${agent}.md`);
    }
  });

  it("no unexpected agent files exist", () => {
    if (!fs.existsSync(AGENTS_DIR)) return;
    const files = fs
      .readdirSync(AGENTS_DIR)
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(".md", ""));
    for (const file of files) {
      assert.ok(
        EXPECTED_AGENTS.includes(file),
        `Unexpected agent: ${file}.md`
      );
    }
  });

  it("all agents have valid frontmatter, persona, role, and output_format", () => {
    for (const agent of EXPECTED_AGENTS) {
      const filePath = path.join(AGENTS_DIR, `${agent}.md`);
      if (!fs.existsSync(filePath)) {
        assert.fail(`${agent}.md does not exist`);
      }
      const content = fs.readFileSync(filePath, "utf8");
      assert.match(content, /^---\n/, `${agent}.md must start with ---`);
      assert.match(content, /name:/, `${agent}.md must have name`);
      assert.match(content, /description:/, `${agent}.md must have description`);
      assert.match(content, /tools:/, `${agent}.md must have tools`);
      assert.match(content, /<persona>/i, `${agent}.md must have persona section`);
      assert.match(content, /<role>/i, `${agent}.md must have role section`);
      assert.match(content, /<output_format>/i, `${agent}.md must have output_format section`);
    }
  });
});

describe("RPIKit v2 — Skills", () => {
  it("all expected skill files exist", () => {
    for (const skill of EXPECTED_SKILLS) {
      const filePath = path.join(SKILLS_DIR, skill, "SKILL.md");
      assert.ok(fs.existsSync(filePath), `Missing skill: ${skill}/SKILL.md`);
    }
  });
});

describe("RPIKit v2 — Cross-references", () => {
  it("AGENTS.md lists all 13 agents", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "..", "AGENTS.md"),
      "utf8"
    );
    for (const agent of EXPECTED_AGENTS) {
      assert.match(
        content,
        new RegExp(agent, "i"),
        `AGENTS.md should list ${agent}`
      );
    }
  });

  it("research command references solutions for knowledge reuse", () => {
    const filePath = path.join(COMMANDS_DIR, "research.md");
    if (!fs.existsSync(filePath)) {
      assert.fail("research.md does not exist");
    }
    const content = fs.readFileSync(filePath, "utf8");
    assert.match(
      content,
      /solutions/i,
      "research.md should reference solutions for knowledge reuse"
    );
  });

  it("review command supports auto-learn to solutions", () => {
    const filePath = path.join(COMMANDS_DIR, "review.md");
    if (!fs.existsSync(filePath)) {
      assert.fail("review.md does not exist");
    }
    const content = fs.readFileSync(filePath, "utf8");
    assert.match(
      content,
      /solutions/i,
      "review.md should reference solutions for auto-learn"
    );
  });

  it("plan command generates delta specs", () => {
    const filePath = path.join(COMMANDS_DIR, "plan.md");
    if (!fs.existsSync(filePath)) {
      assert.fail("plan.md does not exist");
    }
    const content = fs.readFileSync(filePath, "utf8");
    assert.match(content, /delta/i, "plan.md should reference delta specs");
    assert.match(content, /ADDED/i, "plan.md should reference ADDED");
    assert.match(content, /MODIFIED/i, "plan.md should reference MODIFIED");
  });

  it("plan command includes interview phase", () => {
    const filePath = path.join(COMMANDS_DIR, "plan.md");
    if (!fs.existsSync(filePath)) {
      assert.fail("plan.md does not exist");
    }
    const content = fs.readFileSync(filePath, "utf8");
    assert.match(
      content,
      /INTERVIEW/i,
      "plan.md should reference INTERVIEW.md"
    );
    assert.match(
      content,
      /AskUserQuestion/i,
      "plan.md should use AskUserQuestion for interview"
    );
    assert.match(
      content,
      /complexity/i,
      "plan.md should assess complexity"
    );
  });

  it("plan command includes adversarial review", () => {
    const filePath = path.join(COMMANDS_DIR, "plan.md");
    if (!fs.existsSync(filePath)) {
      assert.fail("plan.md does not exist");
    }
    const content = fs.readFileSync(filePath, "utf8");
    assert.match(
      content,
      /adversarial/i,
      "plan.md should reference adversarial review"
    );
    assert.match(
      content,
      /contradiction/i,
      "plan.md should check for contradictions"
    );
    assert.match(
      content,
      /CRITICAL|HIGH|MEDIUM|LOW/,
      "plan.md should have severity levels"
    );
  });
});
