// Impact rules: CO2, money and pollution-dose estimates. Values are transparent averages.

export type TransportMode = "car" | "carpool" | "metro" | "bus" | "bike" | "walk";

/** kg CO2 per passenger-km */
export const CO2_PER_KM: Record<TransportMode, number> = {
  car: 0.17,
  carpool: 0.17, // divided by riders
  metro: 0.03,
  bus: 0.05,
  bike: 0,
  walk: 0,
};

/** ₹ per passenger-km */
export const COST_PER_KM: Record<TransportMode, number> = {
  car: 8,
  carpool: 8, // divided by riders
  metro: 2.5,
  bus: 1.5,
  bike: 0,
  walk: 0,
};

export const MODE_META: Record<TransportMode, { label: string; emoji: string }> = {
  car: { label: "Solo car", emoji: "🚗" },
  carpool: { label: "Carpool", emoji: "🚙" },
  metro: { label: "Metro", emoji: "🚇" },
  bus: { label: "Bus", emoji: "🚌" },
  bike: { label: "Cycle", emoji: "🚲" },
  walk: { label: "Walk", emoji: "🚶" },
};

export function tripCo2(mode: TransportMode, km: number, riders = 1) {
  const per = CO2_PER_KM[mode];
  return mode === "carpool" ? (per * km) / Math.max(1, riders) : per * km;
}

export function tripCost(mode: TransportMode, km: number, riders = 1) {
  const per = COST_PER_KM[mode];
  return mode === "carpool" ? (per * km) / Math.max(1, riders) : per * km;
}

/** Savings of choosing `mode` instead of driving solo for the same distance. */
export function tripSavings(mode: TransportMode, km: number, riders = 1) {
  return {
    co2Kg: round2(tripCo2("car", km) - tripCo2(mode, km, riders)),
    money: round2(tripCost("car", km) - tripCost(mode, km, riders)),
  };
}

/**
 * PM2.5 dose avoided (µg) by moving an activity from a smoggier hour to a cleaner one.
 * dose = breathing rate (L/min → m³/min) × minutes × ΔPM2.5 (µg/m³)
 */
export function doseAvoidedUg(
  litresPerMinute: number,
  minutes: number,
  pmFrom: number,
  pmTo: number,
) {
  const delta = Math.max(0, pmFrom - pmTo);
  return Math.round((litresPerMinute / 1000) * minutes * delta);
}

/**
 * Clean air score 0–100 for a day plan.
 * 70% from the average AQI of the chosen outdoor slots (AQI 0 → 100 pts, AQI ≥ 300 → 0 pts),
 * 30% from how low-emission the trips are (share of trips not made by solo car).
 */
export function cleanAirScore(slotAqis: number[], modes: TransportMode[]) {
  const avg = slotAqis.length ? slotAqis.reduce((a, b) => a + b, 0) / slotAqis.length : 0;
  const exposure = Math.max(0, 100 - (avg / 300) * 100);
  const green = modes.length ? (modes.filter((m) => m !== "car").length / modes.length) * 100 : 100;
  return Math.round(exposure * 0.7 + green * 0.3);
}

/** Consecutive days (ending today, or yesterday if today has no entry yet) with at least one action. */
export function currentStreak(dayKeys: string[], todayKey: string) {
  const set = new Set(dayKeys);
  let cursor = new Date(`${todayKey}T00:00:00Z`);
  if (!set.has(todayKey)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor = new Date(cursor);
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
