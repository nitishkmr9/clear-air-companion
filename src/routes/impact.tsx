import { createFileRoute, Link, useHydrated } from "@tanstack/react-router";
import { Flame, Leaf, PiggyBank, Wind } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { lastDays } from "@/lib/dates";
import { currentStreak } from "@/lib/impact";
import { impactStore, todayKey } from "@/lib/store";

export const Route = createFileRoute("/impact")({
  head: () => ({
    meta: [
      { title: "Impact tracker — BreatheEasy" },
      {
        name: "description",
        content:
          "See the CO₂ you've avoided, money saved and fine dust you didn't breathe — with charts and streaks.",
      },
      { property: "og:title", content: "Impact tracker — BreatheEasy" },
      {
        property: "og:description",
        content: "Every cleaner choice adds up. Track your family's clean-air streak.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ImpactPage,
});


function ImpactPage() {
  const entries = impactStore.use();
  const hydrated = useHydrated();
  const today = hydrated ? todayKey() : "";

  const totals = useMemo(
    () =>
      entries.reduce(
        (a, e) => ({ co2: a.co2 + e.co2Kg, money: a.money + e.money, dose: a.dose + e.doseUg }),
        { co2: 0, money: 0, dose: 0 },
      ),
    [entries],
  );
  const streak = today
    ? currentStreak(
        entries.map((e) => e.date),
        today,
      )
    : 0;
  const chart = useMemo(() => {
    if (!hydrated) return [];
    return lastDays(14).map((d) => {
      const day = entries.filter((e) => e.date === d);
      return {
        day: d.slice(8),
        co2: Math.round(day.reduce((s, e) => s + e.co2Kg, 0) * 100) / 100,
        money: Math.round(day.reduce((s, e) => s + e.money, 0)),
        dose: day.reduce((s, e) => s + e.doseUg, 0),
      };
    });
  }, [entries, hydrated]);
  const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
  const treeDays = Math.round(totals.co2 / (21 / 365));

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 md:px-6">
      <PageHeader
        eyebrow="Impact tracker"
        title={
          <>
            Every cleaner choice <em className="text-primary">adds up</em>
          </>
        }
        description="Commit to a plan or tick indoor habits — your family's progress gathers here."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          icon={<Leaf />}
          label="CO₂ avoided"
          value={`${totals.co2.toFixed(1)} kg`}
          note={
            treeDays > 0 ? `≈ ${treeDays} tree-days of absorption` : "Start with a greener trip"
          }
        />
        <Kpi
          icon={<PiggyBank />}
          label="Money saved"
          value={`₹${Math.round(totals.money).toLocaleString("en-IN")}`}
          note="vs driving solo"
        />
        <Kpi
          icon={<Wind />}
          label="Fine dust avoided"
          value={`${totals.dose.toLocaleString("en-IN")} µg`}
          note="PM2.5 not breathed in"
        />
        <Kpi
          icon={<Flame />}
          label="Clean-air streak"
          value={`${streak} day${streak === 1 ? "" : "s"}`}
          note={streak > 0 ? "Keep it gently going" : "Log one action today"}
          highlight
        />
      </div>

      {entries.length === 0 ? (
        <div className="surface mt-5 flex flex-col items-center gap-3 p-10 text-center">
          <h2 className="font-display text-3xl">Your story starts today</h2>
          <p className="max-w-md text-muted-foreground">
            Commit to a plan with cleaner slots and greener trips, or tick a few indoor habits.
            We'll show what it changes.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild variant="hero">
              <Link to="/planner">Plan my day</Link>
            </Button>
            <Button asChild variant="soft">
              <Link to="/indoor">Indoor habits</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <ChartCard title="CO₂ avoided (kg)" data={chart} dataKey="co2" color="var(--chart-1)" />
          <ChartCard title="Money saved (₹)" data={chart} dataKey="money" color="var(--chart-2)" />
          <ChartCard
            title="Fine dust avoided (µg)"
            data={chart}
            dataKey="dose"
            color="var(--chart-3)"
          />

          <section className="surface p-6 lg:col-span-3">
            <p className="eyebrow">Recent actions</p>
            <ul className="mt-3 divide-y divide-border">
              {recent.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{e.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.date} ·{" "}
                      {e.kind === "trip"
                        ? "Low-emission trip"
                        : e.kind === "shift"
                          ? "Cleaner time slot"
                          : "Indoor habit"}
                    </p>
                  </div>
                  <p className="shrink-0 text-right text-xs text-muted-foreground">
                    {e.co2Kg > 0 && <span className="block">−{e.co2Kg} kg CO₂</span>}
                    {e.money > 0 && <span className="block">₹{Math.round(e.money)} saved</span>}
                    {e.doseUg > 0 && <span className="block">{e.doseUg} µg dust avoided</span>}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Estimates: solo car 0.17 kg CO₂ & ₹8 per km, metro 0.03 kg & ₹2.5, bus 0.05 kg & ₹1.5. Dust
        dose = breathing rate × time × PM2.5 difference.
      </p>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  note,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-3xl bg-chat-user p-5 text-chat-user-foreground shadow-lift"
          : "surface p-5"
      }
    >
      <span className="[&_svg]:size-5">{icon}</span>
      <p className="mt-3 font-display text-3xl leading-none md:text-4xl">{value}</p>
      <p className="mt-1 text-sm font-semibold">{label}</p>
      <p className={highlight ? "text-xs opacity-80" : "text-xs text-muted-foreground"}>{note}</p>
    </div>
  );
}

function ChartCard({
  title,
  data,
  dataKey,
  color,
}: {
  title: string;
  data: Record<string, number | string>[];
  dataKey: string;
  color: string;
}) {
  return (
    <section className="surface p-5">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">Last 14 days</p>
      <div className="mt-3 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: -24, right: 4, top: 4 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              fontSize={10}
              stroke="var(--muted-foreground)"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={10}
              stroke="var(--muted-foreground)"
            />
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
