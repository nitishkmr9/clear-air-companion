import { describe, expect, it } from "vitest";

import {
  cleanAirScore,
  currentStreak,
  doseAvoidedUg,
  tripCo2,
  tripCost,
  tripSavings,
} from "@/lib/impact";

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
