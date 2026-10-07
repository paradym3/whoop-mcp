import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const SITE_URL = "https://whoopconnector.com/";

async function readJson(path: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(new URL(path, import.meta.url), "utf8")) as Record<
    string,
    unknown
  >;
}

describe("public metadata", () => {
  it("keeps package and MCP registry metadata aligned", async () => {
    const packageMetadata = await readJson("../package.json");
    const serverMetadata = await readJson("../server.json");
    const packages = serverMetadata.packages as Array<Record<string, unknown>>;
    const keywords = packageMetadata.keywords as string[];

    expect(serverMetadata.version).toBe(packageMetadata.version);
    expect(packages[0]?.version).toBe(packageMetadata.version);
    expect(packageMetadata.homepage).toBe(SITE_URL);
    expect(keywords).toEqual(
      expect.arrayContaining(["whoop-api", "mcp-server", "health-analytics", "hrv"])
    );
    expect(serverMetadata.description).toMatch(/read-only whoop mcp server/i);
  });
});
