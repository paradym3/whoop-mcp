import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { captionOpacity, fitBandAboveCaption } from "../site/story-motion.js";

describe("scroll-story caption transitions", () => {
  it.each([
    { height: 568, captionTop: 150, worldHeight: 5.3 },
    { height: 800, captionTop: 300, worldHeight: 6.6 },
    { height: 1000, captionTop: 600, worldHeight: 3.5 },
  ])(
    "fits the band above the expanded command panel at $height pixels",
    ({ height, captionTop, worldHeight }) => {
      const fit = fitBandAboveCaption(height, captionTop, worldHeight);
      const center = height / 2 - (fit.y * height) / worldHeight;
      const halfHeight = (fit.scale * 1.6 * height) / worldHeight;
      expect(center - halfHeight).toBeGreaterThanOrEqual(44 - 0.001);
      expect(center + halfHeight).toBeLessThanOrEqual(captionTop - 24 + 0.001);
      expect(fit.scale).toBeGreaterThan(0);
      expect(fit.scale).toBeLessThanOrEqual(0.66);
    }
  );
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
