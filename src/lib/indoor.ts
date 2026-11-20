import { CLEAN_AQI } from "./aqi";
import type { ImpactEntry } from "./store";

/** Indoor habits with the PM2.5 dose (µg) each one roughly spares the family per day. */
export const HABITS = [
  {
    id: "no-incense",
    title: "Skip incense & candles today",
    impact: "Burning incense can raise indoor PM2.5 several times over in minutes.",
    dose: 150,
  },
  {
    id: "lid-cook",
    title: "Cook with lids and the exhaust on",
    impact: "Range hoods remove a large share of cooking smoke and gas fumes.",
    dose: 120,
  },
  {
    id: "wet-mop",
    title: "Wet-mop instead of sweeping",
    impact: "Dry sweeping re-launches settled dust; damp cloths trap it.",
    dose: 60,
  },
  {
    id: "shoes-off",
    title: "Shoes off at the door",
    impact: "Keeps road dust and soot from being tracked through the home.",
    dose: 40,
  },
  {
    id: "doors-closed",
    title: "Seal gaps on smoggy hours",
    impact: "A rolled towel at door/window gaps slows outdoor smog creeping in.",
    dose: 80,
  },
  {
    id: "plants",
    title: "Dust plant leaves & filters",
    impact: "Clean purifier/AC filters keep doing their job efficiently.",
    dose: 50,
  },
] as const;

/** Windows can open when outdoor air is Moderate or better. */
export function canVentilate(aqi: number) {
  return aqi <= CLEAN_AQI;
}

/** Humidity advice: below 35% is dry, above 65% is humid, otherwise comfortable. */
export function humidityTip(humidity: number) {
  if (humidity < 35)
    return {
      label: "A little dry",
      tip: "Dry air irritates airways. A bowl of water near a heater or a humidifier helps reach 40–60%.",
    };
  if (humidity > 65)
    return {
      label: "Quite humid",
      tip: "Fog traps smog and damp invites mould. Run exhaust fans after showers and cooking.",
    };
  return {
    label: "Comfortable",
    tip: "Outdoor humidity is in the comfy range. Keep indoor air around 40–60%.",
  };
}

/** Add (on) or remove (off) today's impact entry for an indoor habit; one entry per habit per day. */
export function withIndoorHabit(
  entries: ImpactEntry[],
  habit: { date: string; id: string; title: string; doseUg: number; on: boolean },
): ImpactEntry[] {
  const entryId = `${habit.date}-indoor-${habit.id}`;
  const rest = entries.filter((e) => e.id !== entryId);
  if (!habit.on) return rest;
  return [
    ...rest,
    {
      id: entryId,
      date: habit.date,
      kind: "indoor",
      label: habit.title,
      co2Kg: 0,
      money: 0,
      doseUg: habit.doseUg,
    },
  ];
}
