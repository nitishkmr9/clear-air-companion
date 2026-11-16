import type { ImpactEntry } from "./store";

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
