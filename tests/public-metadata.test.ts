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

  it("publishes complete search and social metadata", async () => {
    const [html, socialPreview, packageMetadata] = await Promise.all([
      readFile(new URL("../site/index.html", import.meta.url), "utf8"),
      readFile(new URL("../site/social-preview.png", import.meta.url)),
      readJson("../package.json"),
    ]);
    const jsonLdMatch = html.match(
      /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/
    );

    expect(html).toContain(`<link rel="canonical" href="${SITE_URL}" />`);
    expect(html).toContain(`<meta property="og:url" content="${SITE_URL}" />`);
    expect(html).toMatch(
      new RegExp(`<meta\\s+property="og:image"\\s+content="${SITE_URL}social-preview\\.png"\\s+/>`)
    );
    expect(html).toContain(
      'content="WHOOP MCP: read-only recovery, sleep, HRV, strain and workout data for AI assistants"'
    );
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(html).toMatch(
      new RegExp(`<meta\\s+name="twitter:image"\\s+content="${SITE_URL}social-preview\\.png"\\s+/>`)
    );
    expect(jsonLdMatch?.[1]).toBeDefined();

    const structuredData = JSON.parse(jsonLdMatch![1]!) as Record<string, unknown>;
    expect(structuredData).toMatchObject({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "WHOOP MCP",
      url: SITE_URL,
      applicationCategory: "HealthApplication",
      softwareVersion: packageMetadata.version,
    });
    expect(socialPreview.subarray(1, 4).toString()).toBe("PNG");
    expect(socialPreview.readUInt32BE(16)).toBe(1200);
    expect(socialPreview.readUInt32BE(20)).toBe(630);
  });

  it("publishes a sitemap with the canonical page", async () => {
    const sitemap = await readFile(new URL("../site/sitemap.xml", import.meta.url), "utf8");

    expect(sitemap).toContain(`<loc>${SITE_URL}</loc>`);
  });

  it("provides the product story with accessible static and setup fallbacks", async () => {
    const html = await readFile(new URL("../site/index.html", import.meta.url), "utf8");

    expect(html).toContain('id="band-canvas" aria-hidden="true"');
    expect(html).toContain('id="band-fallback"');
    expect(html).toContain('href="#main"');
    expect(html).toContain('<div id="top"></div>');
    expect(html).not.toContain('class="stage" id="top"');
    expect(html).toContain('role="tablist" aria-label="Client"');
    expect(html).toContain('id="copy-status" role="status"');
    expect(html).toContain(
      'id="setup-cmd">npx -y whoop-ai-mcp@latest setup --client=claude-desktop</code>'
    );
    for (const client of ["claude-desktop", "claude-code", "codex", "copilot"]) {
      expect(html).toContain(`npx -y whoop-ai-mcp@latest setup --client=${client}`);
    }
    expect(html).toContain("<noscript>");
    expect(html).toContain("prefers-reduced-motion: reduce");
    expect(html).toContain('id="release"');
  });
});
