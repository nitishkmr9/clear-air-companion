import { describe, expect, it } from "vitest";

import {
  ACTION_LABEL,
  cleanAirScore,
  currentStreak,
  doseAvoidedUg,
  impactChart,
  impactTotals,
  recentActions,
  TREE_KG_PER_YEAR,
  treeDays,
  tripCo2,
  tripCost,
  tripSavings,
} from "@/lib/impact";
import type { ImpactEntry } from "@/lib/store";

describe("trip CO₂ and cost", () => {
  it("solo car is 0.17 kg CO₂ and ₹8 per km", () => {
    expect(tripCo2("car", 10)).toBeCloseTo(1.7);
    expect(tripCost("car", 10)).toBe(80);
  });

  it("cycling and walking emit nothing and cost nothing", () => {
    expect(tripCo2("bike", 10)).toBe(0);
    expect(tripCost("walk", 10)).toBe(0);
  });

  it("a carpool with zero riders is treated as one rider", () => {
    expect(tripCo2("carpool", 10, 0)).toBeCloseTo(1.7);
  });
});

describe("savings vs driving solo", () => {
  it("metro instead of solo car for 10 km saves 1.4 kg CO₂ and ₹55", () => {
    expect(tripSavings("metro", 10)).toEqual({ co2Kg: 1.4, money: 55 });
  });

  it("bus instead of solo car for 10 km saves 1.2 kg CO₂ and ₹65", () => {
    expect(tripSavings("bus", 10)).toEqual({ co2Kg: 1.2, money: 65 });
  });

  it("walking 5 km saves the whole car trip: 0.85 kg CO₂ and ₹40", () => {
    expect(tripSavings("walk", 5)).toEqual({ co2Kg: 0.85, money: 40 });
  });

  it("carpool with 3 riders splits car emissions and cost", () => {
    const s = tripSavings("carpool", 6, 3);
    expect(s.co2Kg).toBeCloseTo(0.68, 2);
    expect(s.money).toBeCloseTo(32, 2);
  });

  it("driving solo saves nothing", () => {
    expect(tripSavings("car", 12)).toEqual({ co2Kg: 0, money: 0 });
  });
});

describe("fine-dust dose avoided", () => {
  it("dose avoided = L/min × minutes × ΔPM2.5", () => {
    // 25 L/min for 60 min = 1.5 m³; Δ 100 µg/m³ -> 150 µg
    expect(doseAvoidedUg(25, 60, 150, 50)).toBe(150);
  });
  it("is never negative when the new slot is dirtier", () => {
    expect(doseAvoidedUg(25, 60, 50, 150)).toBe(0);
  });
  it("rounds to whole micrograms", () => {
    expect(doseAvoidedUg(12, 30, 80, 41)).toBe(14); // 0.36 m³ × 39 = 14.04
  });
});

describe("clean air score", () => {
  it("AQI 0 and no car trips is 100; AQI 300 all solo car is 0", () => {
    expect(cleanAirScore([0], ["metro"])).toBe(100);
    expect(cleanAirScore([300], ["car"])).toBe(0);
  });
  it("is 70% exposure and 30% green trips", () => {
    // AQI 150 -> 50 exposure pts; half the trips green -> 50 green pts
    expect(cleanAirScore([150], ["car", "metro"])).toBe(50);
  });
  it("averages the slots and caps exposure at AQI 300", () => {
    expect(cleanAirScore([100, 200], ["walk"])).toBe(65);
    expect(cleanAirScore([500], ["walk"])).toBe(30);
  });
  it("an empty plan scores 100", () => {
    expect(cleanAirScore([], [])).toBe(100);
  });
});

describe("clean-air streak", () => {
  it("counts consecutive days and tolerates no entry yet today", () => {
    expect(currentStreak(["2026-11-14", "2026-11-15", "2026-11-16"], "2026-11-16")).toBe(3);
    expect(currentStreak(["2026-11-14", "2026-11-15"], "2026-11-16")).toBe(2);
    expect(currentStreak(["2026-11-13"], "2026-11-16")).toBe(0);
  });
  it("continues across a month boundary and ignores duplicate days", () => {
    expect(currentStreak(["2026-10-31", "2026-11-01", "2026-11-01"], "2026-11-01")).toBe(2);
  });
  it("breaks on a missed day", () => {
    expect(currentStreak(["2026-11-13", "2026-11-15", "2026-11-16"], "2026-11-16")).toBe(2);
  });
  it("is 0 with no actions", () => {
    expect(currentStreak([], "2026-11-16")).toBe(0);
  });
});

const action = (date: string, co2Kg: number, money: number, doseUg: number): ImpactEntry => ({
  id: `${date}-${co2Kg}`,
  date,
  kind: "trip",
  label: "Metro",
  co2Kg,
  money,
  doseUg,
});

describe("tree equivalent", () => {
  it("one tree absorbs 21 kg CO₂ a year, so 21 kg is 365 tree-days", () => {
    expect(TREE_KG_PER_YEAR).toBe(21);
    expect(treeDays(21)).toBe(365);
    expect(treeDays(1.4)).toBe(24);
  });
});

describe("impact totals and chart", () => {
  const entries = [
    action("2026-11-15", 1.4, 55, 100),
    action("2026-11-16", 1.234, 40.6, 20),
    action("2026-11-16", 0.5, 10, 30),
  ];
  it("adds CO₂, money and dust dose across all actions", () => {
    const t = impactTotals(entries);
    expect(t.co2).toBeCloseTo(3.134);
    expect(t.money).toBeCloseTo(105.6);
    expect(t.dose).toBe(150);
  });
  it("one chart row per day, CO₂ to 2 decimals and whole rupees", () => {
    expect(impactChart(entries, ["2026-11-15", "2026-11-16", "2026-11-17"])).toEqual([
      { day: "15", co2: 1.4, money: 55, dose: 100 },
      { day: "16", co2: 1.73, money: 51, dose: 50 },
      { day: "17", co2: 0, money: 0, dose: 0 },
    ]);
  });
  it("recent actions are newest first and capped", () => {
    const r = recentActions(entries, 2);
    expect(r).toHaveLength(2);
    expect(r.every((e) => e.date === "2026-11-16")).toBe(true);
    expect(recentActions(entries)).toHaveLength(3);
  });
  it("labels each kind of action", () => {
    expect(ACTION_LABEL).toEqual({
      trip: "Low-emission trip",
      shift: "Cleaner time slot",
      indoor: "Indoor habit",
    });
  });
});
