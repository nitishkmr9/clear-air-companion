import { describe, expect, it } from "vitest";

import { KIND_META, newId, safeThreshold, type MemberKind } from "@/lib/family";

describe("comfort thresholds per family member", () => {
  it.each<[MemberKind, "light" | "moderate" | "vigorous", number]>([
    ["child", "light", 100],
    ["child", "vigorous", 50],
    ["elderly", "moderate", 100],
    ["runner", "light", 75],
    ["runner", "vigorous", 50],
    ["asthma", "vigorous", 50],
    ["adult", "light", 150],
    ["adult", "moderate", 125],
    ["adult", "vigorous", 100],
  ])("%s doing %s activity is comfortable up to AQI %i", (kind, intensity, expected) => {
    expect(safeThreshold(kind, intensity)).toBe(expected);
  });

  it("harder activity never raises the threshold", () => {
    for (const kind of Object.keys(KIND_META) as MemberKind[]) {
      expect(safeThreshold(kind, "moderate")).toBeLessThanOrEqual(safeThreshold(kind, "light"));
      expect(safeThreshold(kind, "vigorous")).toBeLessThanOrEqual(safeThreshold(kind, "moderate"));
    }
  });
});

describe("newId", () => {
  it("returns unique, non-empty ids", () => {
    const ids = new Set(Array.from({ length: 50 }, () => newId()));
    expect(ids.size).toBe(50);
    for (const id of ids) expect(id.length).toBeGreaterThan(5);
  });
});
