import { describe, expect, it } from "vitest";

import {
  diaryChart,
  diaryInsight,
  insightMessage,
  needsDoctorNudge,
  SEVERITY,
  SMOGGY_AQI,
  symptomLoad,
  SYMPTOMS,
} from "@/lib/diary";
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

describe("symptom load and doctor nudge", () => {
  it("load is severity × number of symptoms, at least one", () => {
    expect(symptomLoad({ severity: 3, symptoms: ["cough", "wheeze"] })).toBe(6);
    expect(symptomLoad({ severity: 2, symptoms: [] })).toBe(2);
  });
  it("strong symptoms or breathlessness suggest contacting a doctor", () => {
    expect(needsDoctorNudge({ severity: 3, symptoms: ["cough"] })).toBe(true);
    expect(needsDoctorNudge({ severity: 1, symptoms: ["breathless"] })).toBe(true);
    expect(needsDoctorNudge({ severity: 2, symptoms: ["cough"] })).toBe(false);
  });
  it("offers 7 symptoms and 3 strength levels", () => {
    expect(SYMPTOMS).toHaveLength(7);
    expect(SEVERITY.map((s) => s.v)).toEqual([1, 2, 3]);
  });
});

describe("diary chart", () => {
  it("one row per day with total load and average AQI, null AQI when none logged", () => {
    const rows = diaryChart(
      [
        entry("2026-11-10", 200, 3, 2),
        entry("2026-11-10", 100, 1),
        entry("2026-11-11", undefined, 2),
      ],
      ["2026-11-10", "2026-11-11", "2026-11-12"],
    );
    expect(rows).toEqual([
      { day: "10", load: 7, aqi: 150 },
      { day: "11", load: 2, aqi: null },
      { day: "12", load: 0, aqi: null },
    ]);
  });
});

describe("diary insight message", () => {
  it("asks for more days until there is a comparison", () => {
    expect(insightMessage(null)).toMatch(/^Log a few days/);
  });
  it("is reassuring when smoggy days are no worse", () => {
    expect(insightMessage({ smoggyAvg: 1, cleanAvg: 2, smoggyDays: 1, cleanDays: 1 })).toMatch(
      /don't seem to bother/,
    );
  });
  it("states how many times stronger symptoms were on smoggy days", () => {
    expect(insightMessage({ smoggyAvg: 5, cleanAvg: 2, smoggyDays: 1, cleanDays: 1 })).toContain(
      "about 2.5× stronger",
    );
  });
  it("says 'noticeably' when clean days had no symptoms", () => {
    expect(insightMessage({ smoggyAvg: 3, cleanAvg: 0, smoggyDays: 1, cleanDays: 1 })).toContain(
      "about noticeably stronger",
    );
  });
});
