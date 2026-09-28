import { describe, it, expect } from "vitest";
import { outputSchemas } from "../../src/tools/output-contracts.js";

// ---------------------------------------------------------------------------
// Regression test for the production failure this fix addresses:
//
//   "WHOOP data did not match the expected output contract."
//
// WHOOP's collection endpoints (/v2/recovery, /v2/activity/sleep,
// /v2/activity/workout, /v2/cycle) return `next_token` as an explicit
// `null` — never omitted — whenever a page is the last one. Every
// collection tool's output schema previously declared
// `next_token: z.string().optional()`, which accepts `undefined` but
// rejects `null`, so ANY request whose result fit on a single page
// (the common case for a short date range) failed validation.
// ---------------------------------------------------------------------------

describe("collection output schemas: next_token nullability", () => {
  const collectionToolNames = [
    "get_recovery_collection",
    "get_sleep_collection",
    "get_workout_collection",
    "get_cycle_collection",
  ] as const;

  it.each(collectionToolNames)("%s accepts next_token: null (last/only page)", (name) => {
    const schema = outputSchemas[name];
    const result = schema.safeParse({ records: [], next_token: null });
    expect(result.success).toBe(true);
  });

  it.each(collectionToolNames)("%s accepts next_token omitted entirely", (name) => {
    const schema = outputSchemas[name];
    const result = schema.safeParse({ records: [] });
    expect(result.success).toBe(true);
  });

  it.each(collectionToolNames)("%s accepts a real next_token string (more pages)", (name) => {
    const schema = outputSchemas[name];
    const result = schema.safeParse({ records: [], next_token: "abc123" });
    expect(result.success).toBe(true);
  });

  it.each(collectionToolNames)("%s still rejects a wrong-type next_token", (name) => {
    const schema = outputSchemas[name];
    const result = schema.safeParse({ records: [], next_token: 12345 });
    expect(result.success).toBe(false);
  });
});
