import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircleHeart } from "lucide-react";
import { useMemo } from "react";

import heroImg from "@/assets/hero-family.jpg";
import { AirError, AirLoading, HourlyStrip } from "@/components/app/aqi-ui";
import { AlertsCard } from "@/components/app/alerts";
import { LocationPicker } from "@/components/app/LocationPicker";
import { SavedPlaces } from "@/components/app/places";
import { AskCard } from "@/components/today/AskCard";
import { BestWindows } from "@/components/today/BestWindows";
import { CurrentAir } from "@/components/today/CurrentAir";
import { FamilyNow } from "@/components/today/FamilyNow";
import { Button } from "@/components/ui/button";
import { CLEAN_AQI, findWindows, hoursInWindows, nextDay, type AirSnapshot } from "@/lib/aqi";
import { greeting } from "@/lib/dates";
import { familyStore, useAir } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today's air — BreatheEasy" },
      {
        name: "description",
        content:
          "Live AQI, PM2.5 and PM10 for your city with gentle health guidance and the best hours to step outside.",
      },
      { property: "og:title", content: "Today's air — BreatheEasy" },
      {
        property: "og:description",
        content:
          "Live air quality and the best time to go outside, for every member of your family.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data, isPending, isError, refetch } = useAir();

  return (
    <div>
      <section className="relative overflow-hidden">
        <img
          src={heroImg}
          alt="A family walking through a misty winter park at sunrise"
          width={1600}
          height={912}
          className="absolute inset-0 h-full w-full object-cover object-[70%_center]"
        />
        <div className="hero-fade absolute inset-0" />
        <div className="relative mx-auto flex min-h-[440px] max-w-6xl flex-col justify-end px-4 pb-10 pt-40 md:min-h-[480px] md:justify-center md:px-6 md:pt-16">
          <div className="max-w-xl animate-rise">
            <p className="eyebrow">{greeting(data?.current.time)} · winter air guide</p>
            <h1 className="mt-3 font-display text-5xl leading-[1.02] text-foreground md:text-7xl">
              Breathe a little <em className="text-primary">easier</em> today.
            </h1>
            <p className="mt-4 max-w-md text-base text-muted-foreground md:text-lg">
              Live air for your neighbourhood, the kindest hours to step outside, and calm advice
              for everyone at home.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <LocationPicker />
              <Button asChild variant="hero">
                <Link to="/assistant">
                  <MessageCircleHeart /> Ask BreatheEasy
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-16 md:px-6">
        {isPending ? (
          <div className="-mt-4">
            <AirLoading />
          </div>
        ) : isError || !data ? (
          <AirError onRetry={() => refetch()} />
        ) : (
          <DashboardBody data={data} />
        )}
      </div>
    </div>
  );
}

function DashboardBody({ data }: { data: AirSnapshot }) {
  const family = familyStore.use();
  const now = data.current.time;
  const next24 = useMemo(() => nextDay(data.hourly), [data.hourly]);
  const best = useMemo(() => findWindows(next24, CLEAN_AQI, 1, 3), [next24]);
  const highlight = useMemo(() => hoursInWindows(next24, best.windows), [best, next24]);

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      <CurrentAir data={data} />
      <BestWindows best={best} now={now} />

      <section className="surface animate-rise p-6 md:col-span-3 [animation-delay:140ms]">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="eyebrow">Next 24 hours</p>
            <h3 className="mt-1 font-display text-3xl">How the air will feel, hour by hour</h3>
          </div>
          <p className="text-xs text-muted-foreground">Outlined bars are your best windows</p>
        </div>
        <HourlyStrip hours={next24} highlight={highlight} />
      </section>

      <SavedPlaces />
      <AlertsCard />
      <FamilyNow family={family} hours={next24} aqiNow={data.current.aqi} now={now} />
      <AskCard />
    </div>
  );
}
