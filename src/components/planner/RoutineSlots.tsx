import { Link } from "@tanstack/react-router";

import { LevelPill } from "@/components/app/aqi-ui";
import { Button } from "@/components/ui/button";
import { aqiInfo, clockLabel, LEVEL_CLASSES, windowLabel } from "@/lib/aqi";
import { KIND_META } from "@/lib/family";
import type { PlannedRoutine } from "@/lib/planner";
import { cn } from "@/lib/utils";

export function RoutineSlots({
  plan,
  declined,
  now,
  onToggle,
}: {
  plan: PlannedRoutine[];
  declined: Set<string>;
  now: string;
  onToggle: (routineId: string) => void;
}) {
  return (
    <section aria-labelledby="slots-heading" className="surface p-6">
      <p className="eyebrow">Safe outdoor slots</p>
      <h2 id="slots-heading" className="mt-1 font-display text-3xl">
        Today's routines
      </h2>
      {plan.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Add family members and their routines to see personalised time slots.
          <div>
            <Button asChild variant="soft" className="mt-3">
              <Link to="/family">Add family</Link>
            </Button>
          </div>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {plan.map((p) => (
            <RoutineRow
              key={p.routine.id}
              p={p}
              accepted={p.improves && !declined.has(p.routine.id)}
              now={now}
              onToggle={() => onToggle(p.routine.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function RoutineRow({
  p,
  accepted,
  now,
  onToggle,
}: {
  p: PlannedRoutine;
  accepted: boolean;
  now: string;
  onToggle: () => void;
}) {
  const shown = accepted && p.suggestion ? p.suggestion.avgAqi : (p.original?.aqi ?? 0);
  return (
    <li className="rounded-2xl bg-muted/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="text-2xl" aria-hidden="true">
            {KIND_META[p.member.kind].emoji}
          </span>
          <div>
            <p className="font-semibold text-foreground">
              {p.member.name} · {p.routine.label}
            </p>
            <p className="text-xs text-muted-foreground">
              Usually {clockLabel(p.routine.hour)}
              {p.original ? ` (AQI ${p.original.aqi})` : ""} · {p.routine.minutes} min ·{" "}
              {p.routine.intensity}
            </p>
          </div>
        </div>
        <LevelPill aqi={shown} className="shrink-0" />
      </div>
      {p.improves && p.suggestion ? (
        <div
          className={cn(
            "mt-3 rounded-xl p-3 text-sm",
            accepted ? LEVEL_CLASSES[aqiInfo(p.suggestion.avgAqi).level].soft : "bg-card",
          )}
        >
          <p className="text-foreground">
            <strong>Try {windowLabel(p.suggestion, now)}</strong> — avg AQI {p.suggestion.avgAqi}.
          </p>
          <p className="mt-1 text-muted-foreground">
            Impact: about <strong className="text-foreground">{p.pctLess}% less fine dust</strong>{" "}
            breathed ({p.doseUg} µg of PM2.5 avoided).
          </p>
          <Button size="sm" variant={accepted ? "ghost" : "soft"} className="mt-2" onClick={onToggle}>
            {accepted ? "Keep usual time instead" : "Use the cleaner slot"}
          </Button>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          {!p.routine.flexible
            ? (p.original?.aqi ?? 0) > p.threshold
              ? "Fixed time — keep it short and calm, and an N95 helps on the way."
              : "Fixed time, and the air is comfortable then. 🌿"
            : "Your usual time is already one of the cleaner hours. Lovely."}
        </p>
      )}
    </li>
  );
}
