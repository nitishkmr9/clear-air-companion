import { createFileRoute } from "@tanstack/react-router";
import { Check, Droplets, Fan, Wind } from "lucide-react";
import { useMemo } from "react";

import { AirError, AirLoading, LevelPill } from "@/components/app/aqi-ui";
import { PageHeader } from "@/components/app/AppShell";
import { CLEAN_AQI, findWindows, nextDay, windowLabel, type AirSnapshot } from "@/lib/aqi";
import { canVentilate, HABITS, humidityTip as getHumidityTip, withIndoorHabit } from "@/lib/indoor";
import { impactStore, indoorChecksStore, todayKey, useAir } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/indoor")({
  head: () => ({
    meta: [
      { title: "Indoor air hacks — BreatheEasy" },
      {
        name: "description",
        content:
          "When to ventilate, DIY air purifiers, humidity tips and simple ways to cut indoor pollution.",
      },
      { property: "og:title", content: "Indoor air hacks — BreatheEasy" },
      {
        property: "og:description",
        content: "Make home the cleanest air your family breathes all day.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IndoorPage,
});

function IndoorPage() {
  const { data, isPending, isError, refetch } = useAir();
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 md:px-6">
      <PageHeader
        eyebrow="Indoor air"
        title={
          <>
            Make home your <em className="text-primary">clean-air haven</em>
          </>
        }
        description="We spend most winter hours indoors. A few gentle habits make that air noticeably kinder."
      />
      {isPending ? (
        <AirLoading />
      ) : isError || !data ? (
        <AirError onRetry={() => refetch()} />
      ) : (
        <IndoorBody data={data} />
      )}
    </div>
  );
}

function IndoorBody({ data }: { data: AirSnapshot }) {
  const checks = indoorChecksStore.use();
  const date = todayKey();
  const c = data.current;
  const vent = useMemo(() => findWindows(nextDay(data.hourly), CLEAN_AQI, 1, 2), [data.hourly]);
  const openNow = canVentilate(c.aqi);

  const humidity = c.humidity;
  const humidityTip = getHumidityTip(humidity);

  const toggle = (id: string, title: string, dose: number) => {
    const key = `${date}:${id}`;
    const on = !checks[key];
    indoorChecksStore.set((prev) => ({ ...prev, [key]: on }));
    impactStore.set((prev) => withIndoorHabit(prev, { date, id, title, doseUg: dose, on }));
  };

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <section className="surface p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-sky text-sky-foreground">
            <Wind className="size-5" />
          </span>
          <div>
            <p className="eyebrow">Ventilation timing</p>
            <h2 className="font-display text-3xl">
              {openNow ? "Open up for a bit" : "Keep windows closed for now"}
            </h2>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <LevelPill aqi={c.aqi} />
          <span className="text-sm text-muted-foreground">outside now · wind {c.wind} km/h</span>
        </div>
        <p className="mt-4 text-muted-foreground">
          {openNow
            ? "Air outside is fairly fresh. Open two windows on opposite sides for 10–15 minutes to flush out cooking fumes and CO₂."
            : "Fresh air still matters — just time it. Open windows briefly during the cleanest window below, then close them."}
        </p>
        <ul className="mt-4 space-y-2">
          {vent.windows.map((w) => (
            <li
              key={w.start}
              className="flex items-center justify-between rounded-2xl bg-sky/70 px-4 py-3"
            >
              <span className="text-sm font-semibold text-sky-foreground">
                {windowLabel(w, c.time)}
              </span>
              <span className="text-xs text-sky-foreground">avg AQI {w.avgAqi}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Impact: a 10-minute cross-breeze replaces most of a room's air, lowering stuffiness and
          indoor CO₂ without letting much smog settle.
        </p>
      </section>

      <section className="surface p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Droplets className="size-5" />
          </span>
          <div>
            <p className="eyebrow">Humidity</p>
            <h2 className="font-display text-3xl">
              {humidity}% outside · {humidityTip.label}
            </h2>
          </div>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-muted">
          <div className="relative h-full">
            <div className="absolute inset-y-0 left-[40%] w-[20%] bg-primary-soft" />
            <div
              className="absolute inset-y-0 w-1.5 rounded-full bg-primary"
              style={{ left: `calc(${Math.min(100, humidity)}% - 3px)` }}
            />
          </div>
        </div>
        <div className="mt-1 flex justify-between text-[0.65rem] text-muted-foreground">
          <span>Dry</span>
          <span>Ideal 40–60%</span>
          <span>Damp</span>
        </div>
        <p className="mt-4 text-muted-foreground">{humidityTip.tip}</p>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li>• Dry clothes outdoors or in a ventilated spot, not in bedrooms.</li>
          <li>• Houseplants add a touch of moisture but don't purify meaningfully — filters do.</li>
        </ul>
      </section>

      <section className="surface p-6 md:col-span-2">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <Fan className="size-5" />
          </span>
          <div>
            <p className="eyebrow">DIY purifiers</p>
            <h2 className="font-display text-3xl">Clean air for the cost of a dinner out</h2>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <DiyCard
            title="Box-fan filter"
            cost="≈ ₹2,000–3,000"
            impact="Can cut PM2.5 in a closed bedroom by ~50–70% in an hour."
            steps={[
              "Get a 20″ box or pedestal fan.",
              "Tape a MERV-13 / HEPA-grade filter to the back (airflow arrow toward fan).",
              "Run on medium in a closed room, ideally while sleeping.",
            ]}
          />
          <DiyCard
            title="Corsi-Rosenthal cube"
            cost="≈ ₹5,000–7,000"
            impact="Performs close to commercial purifiers for living rooms."
            steps={[
              "Tape 4 MERV-13 filters into a cube, arrows inward.",
              "Add a cardboard base, place a box fan on top blowing out.",
              "Seal the fan corners with card so air only passes through filters.",
            ]}
          />
        </div>
      </section>

      <section className="surface p-6 md:col-span-2">
        <p className="eyebrow">Today's indoor habits</p>
        <h2 className="mt-1 font-display text-3xl">Little choices, cleaner rooms</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tick what you do today — it counts towards your streak.
        </p>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {HABITS.map((h) => {
            const on = Boolean(checks[`${date}:${h.id}`]);
            return (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => toggle(h.id, h.title, h.dose)}
                  aria-pressed={on}
                  className={cn(
                    "flex w-full gap-3 rounded-2xl border border-border p-4 text-left transition-colors",
                    on ? "border-primary bg-primary-soft" : "bg-card hover:bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border",
                      on ? "border-primary bg-primary text-primary-foreground" : "border-input",
                    )}
                  >
                    {on && <Check className="size-4" />}
                  </span>
                  <span>
                    <span className="block font-semibold text-foreground">{h.title}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{h.impact}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function DiyCard({
  title,
  cost,
  impact,
  steps,
}: {
  title: string;
  cost: string;
  impact: string;
  steps: string[];
}) {
  return (
    <div className="rounded-2xl bg-muted/60 p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-display text-2xl">{title}</h3>
        <span className="text-xs text-muted-foreground">{cost}</span>
      </div>
      <ol className="mt-3 space-y-2">
        {steps.map((s, i) => (
          <li key={s} className="flex gap-3 text-sm text-foreground">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-card text-xs font-semibold">
              {i + 1}
            </span>
            {s}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm text-muted-foreground">
        <strong className="text-foreground">Impact:</strong> {impact}
      </p>
    </div>
  );
}
