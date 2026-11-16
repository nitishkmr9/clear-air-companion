import { describe, expect, it } from "vitest";

import { diaryInsight, SMOGGY_AQI } from "@/lib/diary";
import type { DiaryEntry } from "@/lib/store";

const entry = (date: string, aqi: number | undefined, severity: 1 | 2 | 3, n = 1): DiaryEntry => ({
  id: `${date}-${aqi}-${severity}-${n}`,
  at: 0,
  date,
  who: "Me",
  symptoms: Array.from({ length: n }, () => "cough" as const),
  severity,
  aqi,
});

describe("health diary insight", () => {
  it("smoggy means average AQI above 150", () => {
    expect(SMOGGY_AQI).toBe(150);
  });
  it("needs at least one smoggy (AQI > 150) and one cleaner day", () => {
    expect(diaryInsight([])).toBeNull();
    expect(diaryInsight([entry("2026-11-10", 200, 2)])).toBeNull();
    expect(diaryInsight([entry("2026-11-10", 90, 2)])).toBeNull();
  });
  it("averages symptom load (severity × symptoms) per day on each side", () => {
    const r = diaryInsight([
      entry("2026-11-10", 200, 3, 2), // load 6
      entry("2026-11-11", 180, 2), // load 2
      entry("2026-11-12", 90, 1), // load 1
    ]);
    expect(r).toEqual({ smoggyAvg: 4, cleanAvg: 1, smoggyDays: 2, cleanDays: 1 });
  });
  it("adds up entries on the same day and uses that day's average AQI", () => {
    const r = diaryInsight([
      entry("2026-11-10", 200, 2), // same day: avg AQI 160 -> smoggy, load 2 + 3
      entry("2026-11-10", 120, 3),
      entry("2026-11-11", 150, 1), // exactly 150 is not smoggy
    ]);
    expect(r).toEqual({ smoggyAvg: 5, cleanAvg: 1, smoggyDays: 1, cleanDays: 1 });
  });
  it("ignores days with no AQI reading and counts a no-symptom note as load 1×severity", () => {
    const r = diaryInsight([
      entry("2026-11-09", undefined, 3, 3),
      { ...entry("2026-11-10", 220, 2), symptoms: [] },
      entry("2026-11-11", 60, 1),
    ]);
    expect(r).toEqual({ smoggyAvg: 2, cleanAvg: 1, smoggyDays: 1, cleanDays: 1 });
  });
});
