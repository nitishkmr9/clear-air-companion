import { describe, expect, it } from "vitest";

import {
  blankMember,
  blankRoutine,
  KIND_META,
  memberOutlook,
  newId,
  ROUTINE_TEMPLATES,
  safeThreshold,
  templateRoutines,
  upsertMember,
  type Member,
  type MemberKind,
} from "@/lib/family";

import { hour } from "./fixtures";

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

describe("starting routines", () => {
  it("a child starts with an 8 AM school walk and 5 PM playtime", () => {
    const r = templateRoutines("child");
    expect(r.map((x) => [x.label, x.hour])).toEqual([
      ["School walk", 8],
      ["Park playtime", 17],
    ]);
    expect(new Set(r.map((x) => x.id)).size).toBe(2);
  });
  it("every member type has at least one starting routine", () => {
    for (const kind of Object.keys(KIND_META) as MemberKind[]) {
      expect(ROUTINE_TEMPLATES[kind].length).toBeGreaterThan(0);
    }
  });
  it("a new member is an unnamed child with the child routines", () => {
    const m = blankMember();
    expect(m.name).toBe("");
    expect(m.kind).toBe("child");
    expect(m.routines).toHaveLength(2);
  });
  it("'Add routine' gives 30 flexible light minutes at 4 PM", () => {
    expect(blankRoutine()).toMatchObject({
      label: "Outdoor time",
      hour: 16,
      minutes: 30,
      intensity: "light",
      flexible: true,
    });
  });
});

describe("saving a member", () => {
  const a: Member = { id: "a", name: "Asha", kind: "child", routines: [] };
  const b: Member = { id: "b", name: "Dadi", kind: "elderly", routines: [] };
  it("adds a new member at the end", () => {
    expect(upsertMember([a], b)).toEqual([a, b]);
  });
  it("replaces an existing member in place", () => {
    const renamed = { ...a, name: "Asha R" };
    expect(upsertMember([a, b], renamed)).toEqual([renamed, b]);
  });
});

describe("member outlook", () => {
  const child: Member = { id: "c", name: "Kid", kind: "child", routines: [] };
  const hours = [hour(8, 180), hour(9, 140), hour(14, 90), hour(15, 95)];
  it("a child is fine outside at AQI 100 but not at 101", () => {
    expect(memberOutlook(child, hours, 100).okNow).toBe(true);
    expect(memberOutlook(child, hours, 101).okNow).toBe(false);
  });
  it("points to the next clean hour", () => {
    const o = memberOutlook(child, hours, 180);
    expect(o.relaxed).toBe(false);
    expect(o.window?.start).toBe("2026-11-16T14:00");
  });
});
