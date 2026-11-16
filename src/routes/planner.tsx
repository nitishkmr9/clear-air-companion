import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  MapPinned,
  Plus,
  Route as RouteIcon,
  Trash2,
  TreePine,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AirError, AirLoading, LevelPill } from "@/components/app/aqi-ui";
import { PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { aqiInfo, hourLabel, LEVEL_CLASSES, windowLabel, type AirSnapshot } from "@/lib/aqi";
import { KIND_META, newId } from "@/lib/family";
import { cleanAirScore, MODE_META, tripSavings, type TransportMode } from "@/lib/impact";
import { planRoutines } from "@/lib/planner";
import {
  familyStore,
  impactStore,
  todayKey,
  tripStore,
  useAir,
  type ImpactEntry,
} from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "Low-emission day planner — BreatheEasy" },
      {
        name: "description",
        content:
          "Daily plans with safe outdoor slots, cleaner routes, transit and carpool options, and a clean air score.",
      },
      { property: "og:title", content: "Low-emission day planner — BreatheEasy" },
      {
        property: "og:description",
        content: "Plan your family's day around the cleanest air — and pollute less doing it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlannerPage,
});

function PlannerPage() {
  const { data, isPending, isError, refetch } = useAir();
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 md:px-6">
      <PageHeader
        eyebrow="Routine planner"
        title={
          <>
            A gentler day, <em className="text-primary">hour by hour</em>
          </>
        }
        description="We nudge flexible routines into cleaner hours and help you travel with fewer emissions."
      />
      {isPending ? (
        <AirLoading />
      ) : isError || !data ? (
        <AirError onRetry={() => refetch()} />
      ) : (
        <PlannerBody data={data} />
      )}
    </div>
  );
}

const MODES: TransportMode[] = ["car", "carpool", "metro", "bus", "bike", "walk"];

function PlannerBody({ data }: { data: AirSnapshot }) {
  const family = familyStore.use();
  const trips = tripStore.use();
  const plan = useMemo(() => planRoutines(family, data.hourly), [family, data.hourly]);
  const [declined, setDeclined] = useState<Set<string>>(new Set());
  const now = data.current.time;

  const chosenAqis = plan.map((p) =>
    p.improves && !declined.has(p.routine.id) ? p.chosenAqi : (p.original?.aqi ?? p.chosenAqi),
  );
  const score = cleanAirScore(
    chosenAqis.length ? chosenAqis : [data.current.aqi],
    trips.map((t) => t.mode),
  );
  const totals = trips.reduce(
    (acc, t) => {
      const s = tripSavings(t.mode, t.km, t.riders);
      return { co2: acc.co2 + s.co2Kg, money: acc.money + s.money };
    },
    { co2: 0, money: 0 },
  );
  const doseTotal = plan
    .filter((p) => p.improves && !declined.has(p.routine.id))
    .reduce((s, p) => s + p.doseUg, 0);

  const updateTrip = (id: string, patch: Partial<(typeof trips)[number]>) =>
    tripStore.set((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const logPlan = () => {
    const date = todayKey();
    const entries: ImpactEntry[] = [
      ...plan
        .filter((p) => p.improves && !declined.has(p.routine.id))
        .map((p) => ({
          id: `${date}-shift-${p.routine.id}`,
          date,
          kind: "shift" as const,
          label: `${p.member.name}: ${p.routine.label} moved to cleaner air`,
          co2Kg: 0,
          money: 0,
          doseUg: p.doseUg,
        })),
      ...trips
        .filter((t) => t.mode !== "car")
        .map((t) => {
          const s = tripSavings(t.mode, t.km, t.riders);
          return {
            id: `${date}-trip-${t.id}`,
            date,
            kind: "trip" as const,
            label: `${t.label} by ${MODE_META[t.mode].label.toLowerCase()}`,
            mode: t.mode,
            co2Kg: s.co2Kg,
            money: s.money,
            doseUg: 0,
          };
        }),
    ];
    if (entries.length === 0) {
      toast("Nothing to log yet — try a cleaner time or a greener trip.");
      return;
    }
    impactStore.set((prev) => [
      ...prev.filter((e) => !entries.some((n) => n.id === e.id)),
      ...entries,
    ]);
    toast.success("Today's plan is saved to your impact tracker 🌿");
  };

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Score */}
      <section className="surface flex flex-col items-center p-6 text-center lg:order-2">
        <p className="eyebrow">Clean air score</p>
        <ScoreRing score={score} />
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          70% from the air in your chosen outdoor slots, 30% from how low-emission your trips are.
        </p>
        <div className="mt-5 grid w-full grid-cols-3 gap-2">
          <Mini label="CO₂ saved" value={`${totals.co2.toFixed(1)} kg`} />
          <Mini label="Saved" value={`₹${Math.round(totals.money)}`} />
          <Mini label="Dust avoided" value={`${doseTotal} µg`} />
        </div>
        <Button variant="hero" className="mt-5 w-full" onClick={logPlan}>
          <Check /> Commit to today's plan
        </Button>
        <Button asChild variant="link" size="sm" className="mt-1">
          <Link to="/impact">
            See my impact <ArrowRight />
          </Link>
        </Button>
      </section>

      <div className="space-y-5 lg:order-1 lg:col-span-2">
        {/* Outdoor slots */}
        <section className="surface p-6">
          <p className="eyebrow">Safe outdoor slots</p>
          <h2 className="mt-1 font-display text-3xl">Today's routines</h2>
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
              {plan.map((p) => {
                const accepted = p.improves && !declined.has(p.routine.id);
                const shown =
                  accepted && p.suggestion ? p.suggestion.avgAqi : (p.original?.aqi ?? 0);
                return (
                  <li key={p.routine.id} className="rounded-2xl bg-muted/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <span className="text-2xl" aria-hidden>
                          {KIND_META[p.member.kind].emoji}
                        </span>
                        <div>
                          <p className="font-semibold text-foreground">
                            {p.member.name} · {p.routine.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Usually{" "}
                            {hourLabel(`2000-01-01T${String(p.routine.hour).padStart(2, "0")}:00`)}
                            {p.original ? ` (AQI ${p.original.aqi})` : ""} · {p.routine.minutes} min
                            · {p.routine.intensity}
                          </p>
                        </div>
                      </div>
                      <LevelPill aqi={shown} className="shrink-0" />
                    </div>
                    {p.improves && p.suggestion ? (
                      <div
                        className={cn(
                          "mt-3 rounded-xl p-3 text-sm",
                          accepted
                            ? LEVEL_CLASSES[aqiInfo(p.suggestion.avgAqi).level].soft
                            : "bg-card",
                        )}
                      >
                        <p className="text-foreground">
                          <strong>Try {windowLabel(p.suggestion, now)}</strong> — avg AQI{" "}
                          {p.suggestion.avgAqi}.
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          Impact: about{" "}
                          <strong className="text-foreground">{p.pctLess}% less fine dust</strong>{" "}
                          breathed ({p.doseUg} µg of PM2.5 avoided).
                        </p>
                        <Button
                          size="sm"
                          variant={accepted ? "ghost" : "soft"}
                          className="mt-2"
                          onClick={() =>
                            setDeclined((prev) => {
                              const n = new Set(prev);
                              if (n.has(p.routine.id)) n.delete(p.routine.id);
                              else n.add(p.routine.id);
                              return n;
                            })
                          }
                        >
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
              })}
            </ul>
          )}
        </section>

        {/* Trips */}
        <section className="surface p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Transit & carpool</p>
              <h2 className="mt-1 font-display text-3xl">Today's trips</h2>
            </div>
            <Button
              size="sm"
              variant="soft"
              onClick={() =>
                tripStore.set((prev) => [
                  ...prev,
                  { id: newId(), label: "Errand", km: 4, mode: "walk", riders: 1 },
                ])
              }
            >
              <Plus /> Trip
            </Button>
          </div>
          <ul className="mt-4 space-y-3">
            {trips.map((t) => {
              const s = tripSavings(t.mode, t.km, t.riders);
              return (
                <li key={t.id} className="rounded-2xl bg-muted/60 p-4">
                  <div className="flex gap-2">
                    <Input
                      value={t.label}
                      aria-label="Trip name"
                      onChange={(e) => updateTrip(t.id, { label: e.target.value })}
                      className="bg-card"
                    />
                    <div className="relative w-28 shrink-0">
                      <Input
                        type="number"
                        min={0.5}
                        step={0.5}
                        aria-label="Distance in km"
                        value={t.km}
                        onChange={(e) =>
                          updateTrip(t.id, { km: Math.max(0, Number(e.target.value)) })
                        }
                        className="bg-card pr-9"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        km
                      </span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Remove trip"
                      onClick={() => tripStore.set((prev) => prev.filter((x) => x.id !== t.id))}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto">
                    {MODES.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() =>
                          updateTrip(t.id, {
                            mode: m,
                            riders: m === "carpool" ? Math.max(2, t.riders) : 1,
                          })
                        }
                        className={cn(
                          "shrink-0 rounded-full border border-border px-3 py-1.5 text-xs transition-colors",
                          t.mode === m
                            ? "border-primary bg-primary-soft text-secondary-foreground"
                            : "bg-card hover:bg-muted",
                        )}
                      >
                        {MODE_META[m].emoji} {MODE_META[m].label}
                      </button>
                    ))}
                  </div>
                  {t.mode === "carpool" && (
                    <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      Riders
                      <Input
                        type="number"
                        min={2}
                        max={8}
                        value={t.riders}
                        onChange={(e) =>
                          updateTrip(t.id, {
                            riders: Math.min(8, Math.max(2, Number(e.target.value))),
                          })
                        }
                        className="h-8 w-16 bg-card"
                      />
                    </label>
                  )}
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t.mode === "car" ? (
                      <>
                        Driving solo: switching to the metro would save ~
                        {tripSavings("metro", t.km).co2Kg} kg CO₂ and ₹
                        {Math.round(tripSavings("metro", t.km).money)}.
                      </>
                    ) : (
                      <>
                        Impact vs driving solo:{" "}
                        <strong className="text-foreground">{s.co2Kg} kg CO₂</strong> and{" "}
                        <strong className="text-foreground">₹{Math.round(s.money)}</strong> saved.
                      </>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Routes */}
        <section className="surface p-6">
          <p className="eyebrow">Pollution-avoiding routes</p>
          <h2 className="mt-1 font-display text-3xl">Small detours, big differences</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            <Tip icon={<TreePine />} title="Go through green lanes">
              Park paths and quiet residential streets can mean 20–50% less exposure than main
              roads.
            </Tip>
            <Tip icon={<RouteIcon />} title="Step back from traffic">
              Walking a few metres from the kerb, or on the building side, noticeably lowers the
              fumes you breathe.
            </Tip>
            <Tip icon={<MapPinned />} title="Dodge the rush">
              NO₂ is {data.current.no2} µg/m³ now. Traffic fumes peak around 8–10 AM and 6–9 PM —
              shift trips if you can.
            </Tip>
            <Tip icon={<Check />} title="Windows up, recirculate">
              In cars and cabs, set air to recirculate in heavy traffic — it can halve the particles
              inside.
            </Tip>
          </ul>
        </section>
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative mt-3 size-44">
      <svg viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8" className="stroke-muted" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - score / 100)}
          className="stroke-primary transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-6xl leading-none">{score}</span>
        <span className="text-xs text-muted-foreground">out of 100</span>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-2.5">
      <p className="font-display text-xl text-foreground">{value}</p>
      <p className="text-[0.65rem] text-muted-foreground">{label}</p>
    </div>
  );
}

function Tip({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3 rounded-2xl bg-muted/60 p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary [&_svg]:size-4">
        {icon}
      </span>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{children}</p>
      </div>
    </li>
  );
}
