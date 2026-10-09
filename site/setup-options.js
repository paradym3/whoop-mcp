/** @typedef {"node" | "rust"} Implementation */
/** @typedef {"claude-desktop" | "claude-code" | "codex" | "copilot"} Client */

const IMPLEMENTATIONS = {
  node: {
    label: "Node.js",
    quickCommand: "npx -y whoop-ai-mcp@latest setup",
    requirement: "Node.js 20+",
    requirementNote: "With npm. Setup runs from the latest tag; no global install is needed.",
  },
  rust: {
    label: "Rust",
    quickCommand: "cargo install whoop-mcp",
    requirement: "whoop-mcp installed",
    requirementNote: "Use the installed native binary. No Node.js runtime is needed.",
  },
};

const CLIENT_DESCRIPTIONS = {
  "claude-desktop":
    "Merges the whoop server into claude_desktop_config.json with a .bak backup. Fully quit and reopen Desktop, then authorize WHOOP in your browser.",
  "claude-code":
    "Prints the matching claude mcp add command. Review it privately before running it, because it includes your credentials.",
  codex:
    "Prints a codex mcp add command that registers the server in ~/.codex/config.toml. Review the generated command privately.",
  copilot: "Prints a code --add-mcp command to run for GitHub Copilot in VS Code.",
};

/**
 * Rust commands: https://github.com/shashankswe2020-ux/whoop-mcp-rs#quickstart
 * @param {Implementation} implementation
 * @param {Client} client
 * @returns {typeof IMPLEMENTATIONS.node & {command: string, description: string}}
 */
export function getSetupOption(implementation, client) {
  if (
    !Object.hasOwn(IMPLEMENTATIONS, implementation) ||
    !Object.hasOwn(CLIENT_DESCRIPTIONS, client)
  ) {
    throw new Error("Unsupported implementation or MCP client");
  }
  const option = IMPLEMENTATIONS[implementation];
  let description = CLIENT_DESCRIPTIONS[client];
  if (implementation === "rust") {
    if (client === "claude-desktop") {
      description =
        "Configures Claude Desktop. Fully quit and reopen Desktop, then authorize WHOOP in your browser.";
    }
    description += " Setup registers the installed whoop-mcp binary by its absolute path.";
  }
  const executable = implementation === "node" ? "npx -y whoop-ai-mcp@latest" : "whoop-mcp";
  return { ...option, command: `${executable} setup --client=${client}`, description };
}
