import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { captionOpacity } from "../site/story-motion.js";

describe("scroll-story caption transitions", () => {
  it.each([0.245, 0.32, 0.395])(
    "never displays adjacent captions together at the %s handoff, in either direction",
    (boundary) => {
      const progress = Array.from({ length: 161 }, (_, index) => boundary - 0.04 + index * 0.0005);
      for (const positions of [progress, progress.toReversed()]) {
        for (const position of positions) {
          const outgoing = captionOpacity(boundary - 0.065, boundary, position);
          const incoming = captionOpacity(boundary, boundary + 0.065, position);
          expect(outgoing * incoming).toBe(0);
        }
      }
    }
  );

  it("fades within each interval and hides captions outside it", () => {
    expect(captionOpacity(0.245, 0.32, 0.24)).toBe(0);
    expect(captionOpacity(0.245, 0.32, 0.245)).toBe(0);
    expect(captionOpacity(0.245, 0.32, 0.2525)).toBeCloseTo(0.5);
    expect(captionOpacity(0.245, 0.32, 0.28)).toBe(1);
    expect(captionOpacity(0.245, 0.32, 0.3125)).toBeCloseTo(0.5);
    expect(captionOpacity(0.245, 0.32, 0.32)).toBe(0);
    expect(captionOpacity(0.245, 0.32, 0.33)).toBe(0);
    expect(captionOpacity(-1, 0.085, 0)).toBe(1);
    expect(captionOpacity(0.87, 9, 1)).toBe(1);
  });

  it("uses the tested opacity calculation for the actual page captions", async () => {
    const html = await readFile(new URL("../site/index.html", import.meta.url), "utf8");
    expect(html).toContain('import { captionOpacity } from "./story-motion.js"');
    expect(html).toContain("captionOpacity(a,b,p)");
    const intervals = [...html.matchAll(/data-in="([^"]+)" data-out="([^"]+)"/g)]
      .map((match) => ({ start: Number(match[1]), end: Number(match[2]) }))
      .filter(({ start }) => start >= 0);
    expect(intervals.length).toBeGreaterThanOrEqual(6);
    for (let step = 0; step <= 2000; step++) {
      const visible = intervals.filter(
        ({ start, end }) => captionOpacity(start, end, step / 2000) > 0
      );
      expect(visible.length).toBeLessThanOrEqual(1);
    }
  });
});
