import { findWindows, type HourPoint } from "./aqi";

export type MemberKind = "child" | "elderly" | "runner" | "adult" | "asthma";

export interface Routine {
  id: string;
  label: string; // "School walk", "Evening run"
  hour: number; // preferred start hour 0-23
  minutes: number; // duration
  intensity: "light" | "moderate" | "vigorous";
  flexible: boolean; // can be moved to a cleaner slot
}

export interface Member {
  id: string;
  name: string;
  kind: MemberKind;
  age?: number | undefined;
  notes?: string | undefined;
  routines: Routine[];
}

export const KIND_META: Record<
  MemberKind,
  { label: string; emoji: string; threshold: number; description: string }
> = {
  child: {
    label: "Child",
    emoji: "🧒",
    threshold: 100,
    description: "Growing lungs breathe faster — they benefit most from clean windows.",
  },
  elderly: {
    label: "Elder",
    emoji: "👵",
    threshold: 100,
    description: "Heart and lungs appreciate calmer, cleaner air.",
  },
  runner: {
    label: "Runner",
    emoji: "🏃",
    threshold: 75,
    description: "Hard exercise multiplies how much air (and smog) you breathe in.",
  },
  asthma: {
    label: "Asthma / sensitive",
    emoji: "🫁",
    threshold: 75,
    description: "Extra care on hazy days; keep inhalers handy.",
  },
  adult: {
    label: "Adult",
    emoji: "🧑",
    threshold: 150,
    description: "Generally resilient, but still benefits from cleaner hours.",
  },
};

/** Litres of air per minute, used for dose estimates. */
export const BREATHING_LPM: Record<Routine["intensity"], number> = {
  light: 12,
  moderate: 25,
  vigorous: 50,
};

/** Effective AQI threshold for a member doing a routine at a given intensity. */
export function safeThreshold(kind: MemberKind, intensity: Routine["intensity"]) {
  const base = KIND_META[kind].threshold;
  if (intensity === "vigorous") return Math.min(base, kind === "adult" ? 100 : 50);
  if (intensity === "moderate") return Math.min(base, kind === "adult" ? 125 : base);
  return base;
}

export function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

/** Typical starting routines per member type, so a new profile is useful straight away. */
export const ROUTINE_TEMPLATES: Record<MemberKind, Omit<Routine, "id">[]> = {
  child: [
    { label: "School walk", hour: 8, minutes: 20, intensity: "light", flexible: false },
    { label: "Park playtime", hour: 17, minutes: 60, intensity: "moderate", flexible: true },
  ],
  elderly: [{ label: "Morning walk", hour: 7, minutes: 30, intensity: "light", flexible: true }],
  runner: [{ label: "Evening run", hour: 18, minutes: 45, intensity: "vigorous", flexible: true }],
  asthma: [{ label: "Short walk", hour: 16, minutes: 20, intensity: "light", flexible: true }],
  adult: [{ label: "Commute", hour: 9, minutes: 40, intensity: "light", flexible: false }],
};

export const INTENSITIES: Routine["intensity"][] = ["light", "moderate", "vigorous"];

/** Fresh copies of the template routines for a member type, each with its own id. */
export function templateRoutines(kind: MemberKind): Routine[] {
  return ROUTINE_TEMPLATES[kind].map((r) => ({ ...r, id: newId() }));
}

/** A new, unnamed member (defaults to a child with a school walk and playtime). */
export function blankMember(): Member {
  return { id: newId(), name: "", kind: "child", routines: templateRoutines("child") };
}

/** A flexible half-hour of light outdoor time at 4 PM — the "Add routine" default. */
export function blankRoutine(): Routine {
  return {
    id: newId(),
    label: "Outdoor time",
    hour: 16,
    minutes: 30,
    intensity: "light",
    flexible: true,
  };
}

/** Replace the member with the same id, or add it at the end. */
export function upsertMember(family: Member[], member: Member): Member[] {
  return family.some((m) => m.id === member.id)
    ? family.map((m) => (m.id === member.id ? member : m))
    : [...family, member];
}

/** Is it comfortable for this member to be outside now, and when is their next clean hour? */
export function memberOutlook(member: Member, hours: HourPoint[], aqiNow: number) {
  const threshold = safeThreshold(member.kind, "light");
  const best = findWindows(hours, threshold, 1, 1);
  return { okNow: aqiNow <= threshold, window: best.windows[0], relaxed: best.relaxed };
}
