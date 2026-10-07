import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { getSetupOption } from "../site/setup-options.js";

const clients = ["claude-desktop", "claude-code", "codex", "copilot"] as const;

describe("website implementation selection", () => {
  it("pairs local decorative icons with visible client names", async () => {
    const html = await readFile(new URL("../site/index.html", import.meta.url), "utf8");
    for (const [asset, label] of [
      ["claude.png", "Claude Desktop"],
      ["claude-code.png", "Claude Code"],
      ["codex.png", "Codex"],
      ["copilot.svg", "GitHub Copilot"],
    ]) {
      const markup = `src="icons/${asset}" width="20" height="20" alt="" aria-hidden="true">${label}`;
      expect(html.split(markup)).toHaveLength(3);
      expect(
        (await readFile(new URL(`../site/icons/${asset}`, import.meta.url))).length
      ).toBeGreaterThan(0);
    }
  });

  it.each(clients)("preserves npm setup for %s", (client) => {
    const option = getSetupOption("node", client);
    expect(option.command).toBe(`npx -y whoop-ai-mcp@latest setup --client=${client}`);
    expect(option.quickCommand).toBe("npx -y whoop-ai-mcp@latest setup");
    expect(option.requirement).toBe("Node.js 20+");
  });

  it.each(clients)("uses the installed Rust binary for %s", (client) => {
    const option = getSetupOption("rust", client);
    expect(option.command).toBe(`whoop-mcp setup --client=${client}`);
    expect(option.quickCommand).toBe("cargo install whoop-mcp");
    expect(option.requirement).toBe("whoop-mcp installed");
    expect(option.requirementNote).toContain("No Node.js");
    expect(option.description).toContain("absolute path");
    expect(option.command).not.toContain("npx");
  });

  it("retains the client when switching languages and back", () => {
    const node = getSetupOption("node", "codex");
    const rust = getSetupOption("rust", "codex");
    expect(rust.command).toContain("--client=codex");
    expect(getSetupOption("node", "codex")).toEqual(node);
  });

  it("offers both implementations in the command section and setup, including without JavaScript", async () => {
    const html = await readFile(new URL("../site/index.html", import.meta.url), "utf8");
    expect(html.match(/data-runtime="node"/g)).toHaveLength(2);
    expect(html.match(/data-runtime="rust"/g)).toHaveLength(2);
    expect(html).toContain('id="quick-command"');
    const setup = html.match(/<section class="section" id="setup">([\s\S]*?)<\/section>/)?.[1];
    expect(setup).toBeDefined();
    expect(setup).not.toContain("cargo install");
    expect(html).not.toContain('id="rust-install"');
    const fallback = html.match(/<noscript>([\s\S]*?)<\/noscript>/)?.[1];
    expect(fallback).toContain("whoop-mcp setup --client=claude-desktop");
    expect(fallback).toContain("installed");
    expect(fallback).toContain("https://github.com/shashankswe2020-ux/whoop-mcp-rs");
  });
});
