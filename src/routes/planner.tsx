import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AirError, AirLoading } from "@/components/app/aqi-ui";
import { PageHeader } from "@/components/app/AppShell";
import { RouteTips } from "@/components/planner/RouteTips";
import { RoutineSlots } from "@/components/planner/RoutineSlots";
import { ScoreCard } from "@/components/planner/ScoreCard";
import { TripList } from "@/components/planner/TripList";
import type { AirSnapshot } from "@/lib/aqi";
import { mergeImpactEntries, planImpactEntries, planRoutines, planSummary } from "@/lib/planner";
import { familyStore, impactStore, todayKey, tripStore, useAir } from "@/lib/store";

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

function PlannerBody({ data }: { data: AirSnapshot }) {
  const family = familyStore.use();
  const trips = tripStore.use();
  const plan = useMemo(() => planRoutines(family, data.hourly), [family, data.hourly]);
  const [declined, setDeclined] = useState<Set<string>>(new Set());
  const summary = planSummary(plan, trips, declined, data.current.aqi);

  const toggleDeclined = (routineId: string) =>
    setDeclined((prev) => {
      const next = new Set(prev);
      if (next.has(routineId)) next.delete(routineId);
      else next.add(routineId);
      return next;
    });

  const commitPlan = () => {
    const entries = planImpactEntries(plan, trips, declined, todayKey());
    if (entries.length === 0) {
      toast("Nothing to log yet — try a cleaner time or a greener trip.");
      return;
    }
    impactStore.set((prev) => mergeImpactEntries(prev, entries));
    toast.success("Today's plan is saved to your impact tracker 🌿");
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <ScoreCard {...summary} onCommit={commitPlan} />
      <div className="space-y-5 lg:order-1 lg:col-span-2">
        <RoutineSlots
          plan={plan}
          declined={declined}
          now={data.current.time}
          onToggle={toggleDeclined}
        />
        <TripList />
        <RouteTips no2={data.current.no2} />
      </div>
    </div>
  );
}
