import { describe, expect, it } from "vitest";

import { canVentilate, humidityTip, withIndoorHabit } from "@/lib/indoor";
import type { ImpactEntry } from "@/lib/store";

describe("humidity advice", () => {
  it.each([
    [20, "A little dry"],
    [34, "A little dry"],
    [35, "Comfortable"],
    [65, "Comfortable"],
    [66, "Quite humid"],
    [95, "Quite humid"],
  ])("%i%% humidity is %s", (h, label) => {
    expect(humidityTip(h).label).toBe(label);
  });
});

describe("indoor habit checklist → impact tracker", () => {
  const habit = { date: "2026-11-16", id: "purifier", title: "Ran the purifier", doseUg: 120 };

  it("ticking a habit adds one impact entry with its dust avoided", () => {
    const out = withIndoorHabit([], { ...habit, on: true });
    expect(out).toEqual([
      {
        id: "2026-11-16-indoor-purifier",
        date: "2026-11-16",
        kind: "indoor",
        label: "Ran the purifier",
        co2Kg: 0,
        money: 0,
        doseUg: 120,
      },
    ]);
  });

  it("ticking twice on the same day never doubles it", () => {
    const once = withIndoorHabit([], { ...habit, on: true });
    expect(withIndoorHabit(once, { ...habit, on: true })).toHaveLength(1);
  });

  it("unticking removes only that habit's entry for that day", () => {
    const other: ImpactEntry = { ...withIndoorHabit([], { ...habit, on: true })[0]!, id: "x" };
    const both = [...withIndoorHabit([], { ...habit, on: true }), other];
    expect(withIndoorHabit(both, { ...habit, on: false })).toEqual([other]);
  });
});

describe("ventilation", () => {
  it("windows can open up to AQI 100, not above", () => {
    expect(canVentilate(100)).toBe(true);
    expect(canVentilate(101)).toBe(false);
  });
});
