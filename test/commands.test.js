const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const COMMANDS_DIR = path.resolve(__dirname, "..", "commands", "rpi");
const AGENTS_DIR = path.resolve(__dirname, "..", "agents");

const EXPECTED_COMMANDS = [
  "add-todo",
  "init",
  "new",
  "research",
  "plan",
  "implement",
  "test",
  "simplify",
  "review",
  "docs",
  "status",
  "onboarding",
];

const EXPECTED_AGENTS = [
  "requirement-parser",
  "explore-codebase",
  "product-manager",
  "senior-engineer",
  "cto-advisor",
  "ux-designer",
  "doc-synthesizer",
  "plan-executor",
  "code-simplifier",
  "code-reviewer",
  "test-engineer",
  "doc-writer",
];

describe("command files", () => {
  for (const cmd of EXPECTED_COMMANDS) {
    it(`${cmd}.md exists`, () => {
      const filePath = path.join(COMMANDS_DIR, `${cmd}.md`);
      assert.ok(fs.existsSync(filePath), `Missing command: ${cmd}.md`);
    });
  }

  for (const cmd of EXPECTED_COMMANDS) {
    it(`${cmd}.md has valid frontmatter`, () => {
      const filePath = path.join(COMMANDS_DIR, `${cmd}.md`);
      const content = fs.readFileSync(filePath, "utf8");

      assert.match(content, /^---\n/, `${cmd}.md should start with frontmatter`);
      assert.match(content, /name:\s*rpi:/, `${cmd}.md should have name field`);
      assert.match(content, /description:/, `${cmd}.md should have description`);
      assert.match(content, /allowed-tools:/, `${cmd}.md should list allowed tools`);
    });
  }

  it("no orphan command files", () => {
    const files = fs.readdirSync(COMMANDS_DIR).filter((f) => f.endsWith(".md"));
    const names = files.map((f) => f.replace(".md", ""));
    for (const name of names) {
      assert.ok(
        EXPECTED_COMMANDS.includes(name),
        `Unexpected command file: ${name}.md — add to EXPECTED_COMMANDS or remove`
      );
    }
  });
});

describe("agent files", () => {
  for (const agent of EXPECTED_AGENTS) {
    it(`${agent}.md exists`, () => {
      const filePath = path.join(AGENTS_DIR, `${agent}.md`);
      assert.ok(fs.existsSync(filePath), `Missing agent: ${agent}.md`);
    });
  }

  for (const agent of EXPECTED_AGENTS) {
    it(`${agent}.md has valid frontmatter`, () => {
      const filePath = path.join(AGENTS_DIR, `${agent}.md`);
      const content = fs.readFileSync(filePath, "utf8");

      assert.match(content, /^---\n/, `${agent}.md should start with frontmatter`);
      assert.match(content, /name:/, `${agent}.md should have name field`);
      assert.match(content, /description:/, `${agent}.md should have description`);
    });
  }

  it("no orphan agent files", () => {
    const files = fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith(".md"));
    const names = files.map((f) => f.replace(".md", ""));
    for (const name of names) {
      assert.ok(
        EXPECTED_AGENTS.includes(name),
        `Unexpected agent file: ${name}.md — add to EXPECTED_AGENTS or remove`
      );
    }
  });
});

describe("AGENTS.md consistency", () => {
  it("AGENTS.md includes all agents", () => {
    const agentsMd = fs.readFileSync(
      path.resolve(__dirname, "..", "AGENTS.md"),
      "utf8"
    );

    const agentTitles = {
      "requirement-parser": "Requirement Parser",
      "explore-codebase": "Codebase Explorer",
      "product-manager": "Product Manager",
      "senior-engineer": "Senior Engineer",
      "cto-advisor": "CTO Advisor",
      "ux-designer": "UX Designer",
      "doc-synthesizer": "Doc Synthesizer",
      "plan-executor": "Plan Executor",
      "code-simplifier": "Code Simplifier",
      "code-reviewer": "Code Reviewer",
      "test-engineer": "Test Engineer",
      "doc-writer": "Doc Writer",
    };

    for (const [slug, title] of Object.entries(agentTitles)) {
      assert.ok(
        agentsMd.includes(title),
        `AGENTS.md missing section for: ${title} (${slug})`
      );
    }
  });
});

describe("command cross-references", () => {
  it("research references correct agents", () => {
    const content = fs.readFileSync(
      path.join(COMMANDS_DIR, "research.md"),
      "utf8"
    );
    assert.match(content, /requirement-parser/);
    assert.match(content, /explore-codebase/);
    assert.match(content, /product-manager/);
    assert.match(content, /senior-engineer/);
    assert.match(content, /cto-advisor/);
    assert.match(content, /ux-designer/);
    assert.match(content, /doc-synthesizer/);
  });

  it("implement references plan-executor", () => {
    const content = fs.readFileSync(
      path.join(COMMANDS_DIR, "implement.md"),
      "utf8"
    );
    assert.match(content, /plan-executor/);
  });

  it("new.md supports changes for existing features", () => {
    const content = fs.readFileSync(
      path.join(COMMANDS_DIR, "new.md"),
      "utf8"
    );
    assert.match(content, /changes/, "new.md should reference changes concept");
    assert.match(content, /change-slug/, "new.md should use change-slug");
    assert.match(content, /Parent Feature/, "new.md should have parent feature template");
    assert.match(content, /Breaking Changes/, "new.md should have breaking changes section");
  });

  it("downstream commands have resolve feature path logic", () => {
    const downstreamCommands = ["research", "plan", "implement", "review", "simplify"];

    for (const cmd of downstreamCommands) {
      const content = fs.readFileSync(
        path.join(COMMANDS_DIR, `${cmd}.md`),
        "utf8"
      );
      assert.match(
        content,
        /Resolve feature path|Resolution order/i,
        `${cmd}.md should have resolve feature path logic`
      );
      assert.match(
        content,
        /changes/,
        `${cmd}.md should reference changes`
      );
    }
  });

  it("status.md supports hierarchical change display", () => {
    const content = fs.readFileSync(
      path.join(COMMANDS_DIR, "status.md"),
      "utf8"
    );
    assert.match(content, /└─/, "status.md should use tree characters for changes");
    assert.match(content, /changes/, "status.md should reference changes discovery");
  });

  it("pipeline commands reference next step", () => {
    const pipeline = [
      { cmd: "new", next: "/rpi:research" },
      { cmd: "research", next: "/rpi:plan" },
      { cmd: "plan", next: "/rpi:implement" },
    ];

    for (const { cmd, next } of pipeline) {
      const content = fs.readFileSync(
        path.join(COMMANDS_DIR, `${cmd}.md`),
        "utf8"
      );
      assert.ok(
        content.includes(next),
        `${cmd}.md should reference next step: ${next}`
      );
    }
  });
});
