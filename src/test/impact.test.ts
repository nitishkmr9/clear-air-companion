import { describe, expect, it } from "vitest";

import { findWindows, type HourPoint } from "@/lib/aqi";
import { safeThreshold } from "@/lib/family";
import { cleanAirScore, currentStreak, doseAvoidedUg, tripSavings } from "@/lib/impact";

const h = (hour: number, aqi: number): HourPoint => ({
  time: `2026-11-16T${String(hour).padStart(2, "0")}:00`,
  aqi,
  pm25: aqi / 2,
  pm10: aqi,
});

describe("impact rules", () => {
  it("metro instead of solo car for 10 km saves 1.4 kg CO2 and ₹55", () => {
    expect(tripSavings("metro", 10)).toEqual({ co2Kg: 1.4, money: 55 });
  });

  it("carpool with 3 riders splits car emissions and cost", () => {
    const s = tripSavings("carpool", 6, 3);
    expect(s.co2Kg).toBeCloseTo(0.68, 2);
    expect(s.money).toBeCloseTo(32, 2);
  });

  it("dose avoided = L/min × minutes × ΔPM2.5", () => {
    // 25 L/min for 60 min = 1.5 m³; Δ 100 µg/m³ -> 150 µg
    expect(doseAvoidedUg(25, 60, 150, 50)).toBe(150);
    expect(doseAvoidedUg(25, 60, 50, 150)).toBe(0);
  });

  it("clean air score: AQI 0 and no car trips is 100; AQI 300 all solo car is 0", () => {
    expect(cleanAirScore([0], ["metro"])).toBe(100);
    expect(cleanAirScore([300], ["car"])).toBe(0);
  });

  it("streak counts consecutive days and tolerates no entry yet today", () => {
    expect(currentStreak(["2026-11-14", "2026-11-15", "2026-11-16"], "2026-11-16")).toBe(3);
    expect(currentStreak(["2026-11-14", "2026-11-15"], "2026-11-16")).toBe(2);
    expect(currentStreak(["2026-11-13"], "2026-11-16")).toBe(0);
  });
});

describe("outdoor windows", () => {
  it("finds the cleanest contiguous window under the threshold", () => {
    const hours = [h(8, 180), h(9, 90), h(10, 80), h(11, 160), h(14, 60)];
    const { windows, relaxed } = findWindows(hours, 100, 1, 3);
    expect(relaxed).toBe(false);
    expect(windows[0]!.start).toBe("2026-11-16T14:00");
    expect(windows[1]).toMatchObject({
      start: "2026-11-16T09:00",
      end: "2026-11-16T11:00",
      avgAqi: 85,
    });
  });

  it("falls back to the least smoggy hours when nothing is under the threshold", () => {
    const { windows, relaxed } = findWindows([h(8, 250), h(9, 180), h(10, 220)], 100, 1, 1);
    expect(relaxed).toBe(true);
    expect(windows[0]!.avgAqi).toBe(180);
  });

  it("children are comfortable up to AQI 100; vigorous exercise caps runners at 50", () => {
    expect(safeThreshold("child", "light")).toBe(100);
    expect(safeThreshold("runner", "vigorous")).toBe(50);
  });
});
