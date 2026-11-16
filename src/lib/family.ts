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
