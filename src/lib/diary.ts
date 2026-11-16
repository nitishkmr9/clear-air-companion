import type { DiaryEntry } from "./store";

export const SMOGGY_AQI = 150;

/**
 * Compare average symptom load (sum of severities) on smoggy days (avg AQI > 150) vs cleaner days.
 * Returns null until there is at least one day on each side.
 */
export function diaryInsight(entries: DiaryEntry[]) {
  const byDay = new Map<string, { load: number; aqis: number[] }>();
  for (const e of entries) {
    const d = byDay.get(e.date) ?? { load: 0, aqis: [] };
    d.load += e.severity * Math.max(1, e.symptoms.length);
    if (e.aqi !== undefined) d.aqis.push(e.aqi);
    byDay.set(e.date, d);
  }
  const smoggy: number[] = [];
  const clean: number[] = [];
  for (const d of byDay.values()) {
    if (d.aqis.length === 0) continue;
    const avg = d.aqis.reduce((a, b) => a + b, 0) / d.aqis.length;
    (avg > SMOGGY_AQI ? smoggy : clean).push(d.load);
  }
  if (smoggy.length === 0 || clean.length === 0) return null;
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  return {
    smoggyAvg: Math.round(mean(smoggy) * 10) / 10,
    cleanAvg: Math.round(mean(clean) * 10) / 10,
    smoggyDays: smoggy.length,
    cleanDays: clean.length,
  };
}
