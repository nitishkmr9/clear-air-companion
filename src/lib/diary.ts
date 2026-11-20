import type { DiaryEntry, Symptom } from "./store";

export const SMOGGY_AQI = 150;

export const SYMPTOMS: { id: Symptom; label: string; emoji: string }[] = [
  { id: "cough", label: "Cough", emoji: "😮‍💨" },
  { id: "wheeze", label: "Wheezing", emoji: "🫁" },
  { id: "breathless", label: "Short of breath", emoji: "😣" },
  { id: "sore-throat", label: "Sore throat", emoji: "🤧" },
  { id: "itchy-eyes", label: "Itchy eyes", emoji: "👁️" },
  { id: "headache", label: "Headache", emoji: "🤕" },
  { id: "tired", label: "Tired", emoji: "😴" },
];

export const SEVERITY: { v: DiaryEntry["severity"]; label: string }[] = [
  { v: 1, label: "Mild" },
  { v: 2, label: "Noticeable" },
  { v: 3, label: "Strong" },
];

/** How much an entry "weighs": strength × number of symptoms (at least one). */
export function symptomLoad(e: Pick<DiaryEntry, "severity" | "symptoms">) {
  return e.severity * Math.max(1, e.symptoms.length);
}

/** Strong symptoms or breathlessness get a gentle "contact a doctor" nudge. */
export function needsDoctorNudge(e: Pick<DiaryEntry, "severity" | "symptoms">) {
  return e.severity === 3 || e.symptoms.includes("breathless");
}

const average = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** One chart row per day: total symptom load and average AQI logged (null if none). */
export function diaryChart(entries: DiaryEntry[], days: string[]) {
  return days.map((d) => {
    const day = entries.filter((e) => e.date === d);
    const aqis = day.map((e) => e.aqi).filter((a): a is number => a !== undefined);
    return {
      day: d.slice(8),
      load: day.reduce((sum, e) => sum + symptomLoad(e), 0),
      aqi: aqis.length ? Math.round(average(aqis)) : null,
    };
  });
}

/**
 * Compare average symptom load (sum of severities) on smoggy days (avg AQI > 150) vs cleaner days.
 * Returns null until there is at least one day on each side.
 */
export function diaryInsight(entries: DiaryEntry[]) {
  const byDay = new Map<string, { load: number; aqis: number[] }>();
  for (const e of entries) {
    const d = byDay.get(e.date) ?? { load: 0, aqis: [] };
    d.load += symptomLoad(e);
    if (e.aqi !== undefined) d.aqis.push(e.aqi);
    byDay.set(e.date, d);
  }
  const smoggy: number[] = [];
  const clean: number[] = [];
  for (const d of byDay.values()) {
    if (d.aqis.length === 0) continue;
    (average(d.aqis) > SMOGGY_AQI ? smoggy : clean).push(d.load);
  }
  if (smoggy.length === 0 || clean.length === 0) return null;
  return {
    smoggyAvg: Math.round(average(smoggy) * 10) / 10,
    cleanAvg: Math.round(average(clean) * 10) / 10,
    smoggyDays: smoggy.length,
    cleanDays: clean.length,
  };
}

/** Calm, plain-language summary of the diary pattern. */
export function insightMessage(insight: ReturnType<typeof diaryInsight>) {
  if (!insight)
    return "Log a few days — including at least one smoggy and one cleaner day — and we'll show what we notice.";
  if (insight.smoggyAvg <= insight.cleanAvg)
    return "So far, smoggy days don't seem to bother your family more than cleaner ones. Lovely — keep noting how you feel.";
  const ratio =
    insight.cleanAvg > 0
      ? `${Math.round((insight.smoggyAvg / insight.cleanAvg) * 10) / 10}×`
      : "noticeably";
  return `On smoggy days (AQI above ${SMOGGY_AQI}) symptoms were about ${ratio} stronger than on cleaner days. Moving outdoor time to clean windows could make a real difference.`;
}
