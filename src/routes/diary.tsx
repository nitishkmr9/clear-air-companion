import { createFileRoute, useHydrated } from "@tanstack/react-router";
import { useMemo } from "react";

import { PageHeader } from "@/components/app/AppShell";
import { EntryForm } from "@/components/diary/EntryForm";
import { PatternChart } from "@/components/diary/PatternChart";
import { RecentEntries } from "@/components/diary/RecentEntries";
import { lastDays } from "@/lib/dates";
import { diaryChart, diaryInsight, insightMessage } from "@/lib/diary";
import { diaryStore, familyStore, useAir } from "@/lib/store";

const CHART_DAYS = 14;

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

function DiaryPage() {
  const entries = diaryStore.use();
  const family = familyStore.use();
  const hydrated = useHydrated();
  const { data, place } = useAir();
  const people = ["Me", ...family.map((m) => m.name)];

  // Dates depend on the visitor's clock, so the chart is only built in the browser.
  const chart = useMemo(
    () => (hydrated ? diaryChart(entries, lastDays(CHART_DAYS)) : []),
    [entries, hydrated],
  );
  const message = useMemo(() => insightMessage(diaryInsight(entries)), [entries]);
  const remove = (id: string) => diaryStore.set((prev) => prev.filter((x) => x.id !== id));

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

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <EntryForm people={people} air={data?.current} placeName={place.name} />
        <div className="space-y-5 lg:col-span-3">
          <PatternChart rows={chart} message={message} />
          <RecentEntries entries={entries} onDelete={remove} />
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Your diary stays private in this browser. It's a gentle record, not a diagnosis.
      </p>
    </div>
  );
}
