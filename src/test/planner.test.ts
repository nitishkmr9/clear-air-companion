import { describe, expect, it } from "vitest";

import type { Member } from "@/lib/family";
import { planRoutines } from "@/lib/planner";

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
