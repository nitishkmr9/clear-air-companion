import { createFileRoute, useHydrated } from "@tanstack/react-router";
import { HeartPulse, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { LevelPill } from "@/components/app/aqi-ui";
import { PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { diaryInsight } from "@/lib/diary";
import { newId } from "@/lib/family";
import {
  diaryStore,
  familyStore,
  todayKey,
  useAir,
  type DiaryEntry,
  type Symptom,
} from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/diary")({
  head: () => ({
    meta: [
      { title: "Health diary — BreatheEasy" },
      {
        name: "description",
        content:
          "Log coughs, wheezing or itchy eyes and see them next to the air quality, to spot your family's smog patterns.",
      },
      { property: "og:title", content: "Health diary — BreatheEasy" },
      {
        property: "og:description",
        content: "See how smoggy days really affect your family's breathing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DiaryPage,
});

const SYMPTOMS: { id: Symptom; label: string; emoji: string }[] = [
  { id: "cough", label: "Cough", emoji: "😮‍💨" },
  { id: "wheeze", label: "Wheezing", emoji: "🫁" },
  { id: "breathless", label: "Short of breath", emoji: "😣" },
  { id: "sore-throat", label: "Sore throat", emoji: "🤧" },
  { id: "itchy-eyes", label: "Itchy eyes", emoji: "👁️" },
  { id: "headache", label: "Headache", emoji: "🤕" },
  { id: "tired", label: "Tired", emoji: "😴" },
];
const SEVERITY = [
  { v: 1 as const, label: "Mild" },
  { v: 2 as const, label: "Noticeable" },
  { v: 3 as const, label: "Strong" },
];

function lastDays(n: number) {
  const out: string[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d);
    x.setDate(d.getDate() - i);
    out.push(
      `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`,
    );
  }
  return out;
}

function DiaryPage() {
  const entries = diaryStore.use();
  const family = familyStore.use();
  const hydrated = useHydrated();
  const { data, place } = useAir();
  const people = ["Me", ...family.map((m) => m.name)];

  const [who, setWho] = useState("Me");
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [severity, setSeverity] = useState<1 | 2 | 3>(1);
  const [note, setNote] = useState("");

  const toggle = (s: Symptom) =>
    setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const save = () => {
    if (symptoms.length === 0) {
      toast("Pick at least one symptom — or enjoy a symptom-free day! 🌿");
      return;
    }
    const entry: DiaryEntry = {
      id: newId(),
      at: Date.now(),
      date: todayKey(),
      who,
      symptoms,
      severity,
      note: note.trim() || undefined,
      aqi: data?.current.aqi,
      pm25: data?.current.pm25,
      place: place.name,
    };
    diaryStore.set((prev) => [entry, ...prev]);
    if (severity === 3 || symptoms.includes("breathless")) {
      toast("Saved. If breathing feels hard or doesn't settle, please contact a doctor. 💚", {
        duration: 8000,
      });
    } else {
      toast.success("Saved to your diary.");
    }
    setSymptoms([]);
    setSeverity(1);
    setNote("");
  };

  const chart = useMemo(() => {
    if (!hydrated) return [];
    return lastDays(14).map((d) => {
      const day = entries.filter((e) => e.date === d);
      const aqis = day.map((e) => e.aqi).filter((a): a is number => a !== undefined);
      return {
        day: d.slice(8),
        load: day.reduce((s, e) => s + e.severity * Math.max(1, e.symptoms.length), 0),
        aqi: aqis.length ? Math.round(aqis.reduce((a, b) => a + b, 0) / aqis.length) : null,
      };
    });
  }, [entries, hydrated]);
  const insight = useMemo(() => diaryInsight(entries), [entries]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 md:px-6">
      <PageHeader
        eyebrow="Health diary"
        title={
          <>
            Notice how the air <em className="text-primary">feels</em>
          </>
        }
        description="A quick note when someone coughs or feels wheezy. Over time you'll see how smoggy days affect your family."
      />

      <div className="grid gap-5 lg:grid-cols-5">
        <section className="surface p-6 lg:col-span-2">
          <p className="eyebrow">New entry</p>
          <h2 className="mt-1 font-display text-3xl">How is everyone feeling?</h2>

          <p className="mt-5 text-sm font-semibold text-foreground">Who</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {people.map((p) => (
              <Chip key={p} active={who === p} onClick={() => setWho(p)}>
                {p}
              </Chip>
            ))}
          </div>

          <p className="mt-5 text-sm font-semibold text-foreground">What's bothering them?</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SYMPTOMS.map((s) => (
              <Chip key={s.id} active={symptoms.includes(s.id)} onClick={() => toggle(s.id)}>
                <span aria-hidden>{s.emoji}</span> {s.label}
              </Chip>
            ))}
          </div>

          <p className="mt-5 text-sm font-semibold text-foreground">How strong?</p>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {SEVERITY.map((s) => (
              <Chip key={s.v} active={severity === s.v} onClick={() => setSeverity(s.v)}>
                {s.label}
              </Chip>
            ))}
          </div>

          <Textarea
            value={note}
            maxLength={300}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note — e.g. after playing outside, used inhaler"
            className="mt-5 bg-card"
            aria-label="Note"
          />
          {data && (
            <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              Will be saved with today's air: <LevelPill aqi={data.current.aqi} /> AQI{" "}
              {data.current.aqi}
            </p>
          )}
          <Button variant="hero" className="mt-4 w-full" onClick={save}>
            <Plus /> Save entry
          </Button>
        </section>

        <div className="space-y-5 lg:col-span-3">
          <section className="surface p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <HeartPulse className="size-5" />
              </span>
              <div>
                <p className="eyebrow">Your pattern</p>
                <h2 className="font-display text-2xl leading-tight">Symptoms next to the air</h2>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {insight
                ? insight.smoggyAvg > insight.cleanAvg
                  ? `On smoggy days (AQI above 150) symptoms were about ${insight.cleanAvg > 0 ? `${Math.round((insight.smoggyAvg / insight.cleanAvg) * 10) / 10}×` : "noticeably"} stronger than on cleaner days. Moving outdoor time to clean windows could make a real difference.`
                  : "So far, smoggy days don't seem to bother your family more than cleaner ones. Lovely — keep noting how you feel."
                : "Log a few days — including at least one smoggy and one cleaner day — and we'll show what we notice."}
            </p>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chart} margin={{ left: -20, right: -10, top: 4 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                    stroke="var(--muted-foreground)"
                  />
                  <YAxis
                    yAxisId="l"
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                    stroke="var(--muted-foreground)"
                    allowDecimals={false}
                  />
                  <YAxis
                    yAxisId="r"
                    orientation="right"
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
                  <Bar
                    yAxisId="l"
                    dataKey="load"
                    name="Symptom load"
                    fill="var(--chart-2)"
                    radius={[6, 6, 0, 0]}
                  />
                  <Line
                    yAxisId="r"
                    dataKey="aqi"
                    name="AQI"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Bars: symptom load (strength × number of symptoms). Line: AQI when logged.
            </p>
          </section>

          <section className="surface p-6">
            <p className="eyebrow">Recent entries</p>
            {entries.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No entries yet. Symptom-free days are the best kind. 🌿
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {entries.slice(0, 15).map((e) => (
                  <li key={e.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {e.who} · {SEVERITY.find((s) => s.v === e.severity)?.label}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {e.symptoms.map((s) => SYMPTOMS.find((x) => x.id === s)?.label).join(", ")}
                      </p>
                      {e.note && (
                        <p className="mt-0.5 text-xs italic text-muted-foreground">“{e.note}”</p>
                      )}
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {e.date}
                        {e.aqi !== undefined && ` · AQI ${e.aqi}`}
                        {e.place && ` · ${e.place}`}
                      </p>
                    </div>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Delete entry"
                      onClick={() => diaryStore.set((prev) => prev.filter((x) => x.id !== e.id))}
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Your diary stays private in this browser. It's a gentle record, not a diagnosis.
      </p>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border border-border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-primary bg-primary-soft text-secondary-foreground"
          : "bg-card hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
