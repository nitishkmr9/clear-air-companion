import { findWindows, type HourPoint, type Window } from "./aqi";
import { BREATHING_LPM, safeThreshold, type Member, type Routine } from "./family";
import { doseAvoidedUg, MODE_META, tripSavings } from "./impact";
import type { ImpactEntry, Trip } from "./store";

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

/**
 * Impact entries for committing today's plan: one per accepted cleaner-time shift
 * and one per trip not made by solo car. Ids are per day, so re-saving replaces rather than doubles.
 */
export function planImpactEntries(
  plan: PlannedRoutine[],
  trips: Trip[],
  declined: Set<string>,
  date: string,
): ImpactEntry[] {
  const shifts: ImpactEntry[] = plan
    .filter((p) => p.improves && !declined.has(p.routine.id))
    .map((p) => ({
      id: `${date}-shift-${p.routine.id}`,
      date,
      kind: "shift",
      label: `${p.member.name}: ${p.routine.label} moved to cleaner air`,
      co2Kg: 0,
      money: 0,
      doseUg: p.doseUg,
    }));
  const greener: ImpactEntry[] = trips
    .filter((t) => t.mode !== "car")
    .map((t) => {
      const s = tripSavings(t.mode, t.km, t.riders);
      return {
        id: `${date}-trip-${t.id}`,
        date,
        kind: "trip",
        label: `${t.label} by ${MODE_META[t.mode].label.toLowerCase()}`,
        mode: t.mode,
        co2Kg: s.co2Kg,
        money: s.money,
        doseUg: 0,
      };
    });
  return [...shifts, ...greener];
}

/** Replace entries with the same id, keep everything else. */
export function mergeImpactEntries(existing: ImpactEntry[], next: ImpactEntry[]) {
  const ids = new Set(next.map((e) => e.id));
  return [...existing.filter((e) => !ids.has(e.id)), ...next];
}
