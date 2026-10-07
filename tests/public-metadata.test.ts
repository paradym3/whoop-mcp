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
      "@id": `${SITE_URL}#software`,
      image: `${SITE_URL}social-preview.png`,
    });
    expect(structuredData).not.toHaveProperty("aggregateRating");
    expect(html).toContain('<meta property="og:site_name" content="WHOOP MCP" />');
    expect(html).toContain('<meta property="og:image:width" content="1200" />');
    expect(html).toContain('<meta property="og:image:height" content="630" />');
    expect(html).toContain('<meta name="twitter:image:alt"');
    expect(socialPreview.subarray(1, 4).toString()).toBe("PNG");
    expect(socialPreview.readUInt32BE(16)).toBe(1200);
    expect(socialPreview.readUInt32BE(20)).toBe(630);
  });

  it("publishes a sitemap with the canonical page", async () => {
    const sitemap = await readFile(new URL("../site/sitemap.xml", import.meta.url), "utf8");

    expect(sitemap).toContain(`<loc>${SITE_URL}</loc>`);
  });

  it("allows crawlers and advertises the HTTPS sitemap", async () => {
    const robots = await readFile(new URL("../site/robots.txt", import.meta.url), "utf8");
    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Allow: /");
    expect(robots).toContain(`Sitemap: ${SITE_URL}sitemap.xml`);
    expect(robots).not.toMatch(/^Disallow:\s*\/\s*$/m);
  });

  it("uses a descriptive search title and consistent website identity", async () => {
    const html = await readFile(new URL("../site/index.html", import.meta.url), "utf8");
    const titles = [...html.matchAll(/<title>(.*?)<\/title>/g)];
    expect(titles).toHaveLength(1);
    expect(titles[0]?.[1]).toBe("WHOOP MCP Server for Claude, Codex &amp; GitHub Copilot");
    expect(html).toContain('content="index, follow, max-image-preview:large"');
    const entities = [
      ...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
    ].map((match) => JSON.parse(match[1]!) as Record<string, unknown>);
    expect(entities.find((entity) => entity["@type"] === "WebSite")).toMatchObject({
      "@id": `${SITE_URL}#website`,
      name: "WHOOP MCP",
      alternateName: "whoop-mcp",
      url: SITE_URL,
      inLanguage: "en",
    });
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
      expect(html).toContain(`--client=${client}`);
    }
    expect(html).toContain("<noscript>");
    expect(html).toContain("prefers-reduced-motion: reduce");
    expect(html).toContain('id="release"');
  });
});
