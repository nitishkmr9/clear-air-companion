import { describe, expect, it } from "vitest";

import type { Member } from "@/lib/family";
import { mergeImpactEntries, planImpactEntries, planRoutines, planSummary } from "@/lib/planner";
import type { Trip } from "@/lib/store";

import { hour } from "./fixtures";

// A smoggy day (AQI 180) with a clean 2 PM (AQI 60, PM2.5 20) and a worse 6 PM (AQI 200, PM2.5 100).
const day = Array.from({ length: 24 }, (_, i) =>
  i === 14 ? hour(14, 60, 20) : i === 18 ? hour(18, 200, 100) : hour(i, 180),
);

const child = (flexible: boolean, routineHour = 18): Member => ({
  id: "kid",
  name: "Aarav",
  kind: "child",
  routines: [
    {
      id: "play",
      label: "Park play",
      hour: routineHour,
      minutes: 60,
      intensity: "light",
      flexible,
    },
  ],
});

describe("routine planner", () => {
  it("moves a flexible routine to the cleanest slot and reports the dust avoided", () => {
    const [p] = planRoutines([child(true)], day);
    expect(p).toMatchObject({ threshold: 100, improves: true, pctLess: 80, chosenAqi: 60 });
    expect(p!.suggestion).toMatchObject({ start: "2026-11-16T14:00", avgAqi: 60, pm25: 20 });
    // 12 L/min × 60 min = 0.72 m³ × (100 − 20) µg/m³ = 57.6 → 58 µg
    expect(p!.doseUg).toBe(58);
  });

  it("keeps a fixed-time routine where it is", () => {
    const [p] = planRoutines([child(false)], day);
    expect(p).toMatchObject({ improves: false, pctLess: 0, doseUg: 0, chosenAqi: 200 });
  });

  it("does not suggest a move that is barely cleaner (within 10 AQI)", () => {
    const flat = Array.from({ length: 24 }, (_, i) => hour(i, i === 18 ? 65 : 60));
    expect(planRoutines([child(true)], flat)[0]!.improves).toBe(false);
  });

  it("sorts every member's routines by time of day", () => {
    const gran: Member = {
      id: "g",
      name: "Nani",
      kind: "elderly",
      routines: [
        {
          id: "walk",
          label: "Morning walk",
          hour: 7,
          minutes: 30,
          intensity: "light",
          flexible: true,
        },
      ],
    };
    const plan = planRoutines([child(true), gran], day);
    expect(plan.map((p) => p.routine.label)).toEqual(["Morning walk", "Park play"]);
  });

  it("returns nothing for a family without routines", () => {
    expect(planRoutines([], day)).toEqual([]);
  });
});

describe("saving today's plan to the impact tracker", () => {
  const trips: Trip[] = [
    { id: "school", label: "School drop-off", km: 6, mode: "carpool", riders: 3 },
    { id: "work", label: "Office commute", km: 10, mode: "metro", riders: 1 },
    { id: "shop", label: "Groceries", km: 4, mode: "car", riders: 1 },
  ];

  it("logs accepted time shifts and every trip not by solo car", () => {
    const plan = planRoutines([child(true)], day);
    const entries = planImpactEntries(plan, trips, new Set(), "2026-11-16");
    expect(entries.map((e) => e.id)).toEqual([
      "2026-11-16-shift-play",
      "2026-11-16-trip-school",
      "2026-11-16-trip-work",
    ]);
    expect(entries[0]).toMatchObject({
      kind: "shift",
      doseUg: 58,
      label: "Aarav: Park play moved to cleaner air",
    });
    expect(entries[2]).toMatchObject({
      kind: "trip",
      co2Kg: 1.4,
      money: 55,
      label: "Office commute by metro",
    });
  });

  it("skips shifts the family declined", () => {
    const plan = planRoutines([child(true)], day);
    const entries = planImpactEntries(plan, [], new Set(["play"]), "2026-11-16");
    expect(entries).toEqual([]);
  });

  it("saving again the same day replaces entries instead of doubling savings", () => {
    const first = planImpactEntries([], trips, new Set(), "2026-11-16");
    const merged = mergeImpactEntries(mergeImpactEntries([], first), first);
    expect(merged).toHaveLength(2);
    const yesterday = planImpactEntries([], trips, new Set(), "2026-11-15");
    expect(mergeImpactEntries(yesterday, first)).toHaveLength(4);
  });
});

describe("planner headline numbers", () => {
  const trips: Trip[] = [
    { id: "work", label: "Office commute", km: 10, mode: "metro", riders: 1 },
    { id: "shop", label: "Groceries", km: 4, mode: "car", riders: 1 },
  ];

  it("scores the cleaner slot the family accepted and adds up trip savings", () => {
    const plan = planRoutines([child(true)], day);
    const s = planSummary(plan, trips, new Set(), 180);
    // slot AQI 60 -> 80 exposure pts × 0.7 = 56; half the trips green -> 15
    expect(s).toEqual({ score: 71, co2Kg: 1.4, money: 55, doseUg: 58 });
  });

  it("uses the usual time when the cleaner slot is declined", () => {
    const plan = planRoutines([child(true)], day);
    const s = planSummary(plan, trips, new Set(["play"]), 180);
    // usual AQI 200 -> 33.3 pts × 0.7 = 23.3; + 15 = 38
    expect(s).toMatchObject({ score: 38, doseUg: 0 });
  });

  it("falls back to the current AQI when there are no routines", () => {
    expect(planSummary([], [], new Set(), 150).score).toBe(65);
  });
});
