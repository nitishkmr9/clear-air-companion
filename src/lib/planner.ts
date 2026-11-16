import { findWindows, type HourPoint, type Window } from "./aqi";
import { BREATHING_LPM, safeThreshold, type Member, type Routine } from "./family";
import { doseAvoidedUg } from "./impact";

export interface PlannedRoutine {
  member: Member;
  routine: Routine;
  original?: HourPoint | undefined;
  suggestion?: (Window & { pm25: number }) | undefined;
  threshold: number;
  improves: boolean;
  pctLess: number;
  doseUg: number;
  chosenAqi: number;
}

export function planRoutines(family: Member[], hours: HourPoint[]): PlannedRoutine[] {
  const next24 = hours.slice(0, 24);
  const out: PlannedRoutine[] = [];
  for (const member of family) {
    for (const routine of member.routines) {
      const threshold = safeThreshold(member.kind, routine.intensity);
      const original = next24.find((h) => Number(h.time.slice(11, 13)) === routine.hour);
      const need = Math.max(1, Math.ceil(routine.minutes / 60));
      const best = findWindows(next24, threshold, need, 1).windows[0];
      let suggestion: PlannedRoutine["suggestion"];
      if (best) {
        const inWin = next24.filter((h) => h.time >= best.start && h.time < best.end);
        const pm25 = inWin.reduce((s, h) => s + h.pm25, 0) / Math.max(1, inWin.length);
        suggestion = { ...best, pm25: Math.round(pm25 * 10) / 10 };
      }
      const improves = Boolean(
        routine.flexible &&
        original &&
        suggestion &&
        suggestion.avgAqi < original.aqi - 10 &&
        suggestion.start !== original.time,
      );
      const pctLess =
        improves && original && suggestion
          ? Math.round(((original.pm25 - suggestion.pm25) / original.pm25) * 100)
          : 0;
      const doseUg =
        improves && original && suggestion
          ? doseAvoidedUg(
              BREATHING_LPM[routine.intensity],
              routine.minutes,
              original.pm25,
              suggestion.pm25,
            )
          : 0;
      out.push({
        member,
        routine,
        original,
        suggestion,
        threshold,
        improves,
        pctLess: Math.max(0, pctLess),
        doseUg,
        chosenAqi: improves && suggestion ? suggestion.avgAqi : (original?.aqi ?? 0),
      });
    }
  }
  return out.sort((a, b) => a.routine.hour - b.routine.hour);
}
