import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Droplets, MessageCircleHeart, Sun, Wind } from "lucide-react";
import { useMemo } from "react";

import heroImg from "@/assets/hero-family.jpg";
import { AirError, AirLoading, AqiRing, HourlyStrip, LevelPill } from "@/components/app/aqi-ui";
import { AlertsCard } from "@/components/app/alerts";
import { LocationPicker } from "@/components/app/LocationPicker";
import { SavedPlaces } from "@/components/app/places";
import { ShareAir } from "@/components/app/share";
import { Button } from "@/components/ui/button";
import {
  aqiInfo,
  findWindows,
  hourLabel,
  LEVEL_CLASSES,
  windowLabel,
  type AirSnapshot,
} from "@/lib/aqi";
import { KIND_META, safeThreshold } from "@/lib/family";
import { familyStore, useAir } from "@/lib/store";
import { createThread, STARTER_QUESTIONS } from "@/lib/threads";
import { cn } from "@/lib/utils";

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

function greeting(localIso?: string) {
  if (!localIso) return "Hello";
  const h = Number(localIso.slice(11, 13));
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

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
  const navigate = useNavigate();
  const c = data.current;
  const info = aqiInfo(c.aqi);
  const next24 = data.hourly.slice(0, 24);
  const best = useMemo(() => findWindows(next24, 100, 1, 3), [next24]);
  const highlight = useMemo(() => {
    const s = new Set<string>();
    best.windows.forEach((w) =>
      next24.forEach((h) => h.time >= w.start && h.time < w.end && s.add(h.time)),
    );
    return s;
  }, [best, next24]);

  const ask = (q: string) => {
    const id = createThread(q);
    navigate({ to: "/assistant/$threadId", params: { threadId: id } });
  };

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {/* Current air */}
      <section className="surface animate-rise p-6 md:col-span-2 md:p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <AqiRing aqi={c.aqi} />
          <div className="flex-1 text-center sm:text-left">
            <LevelPill aqi={c.aqi} />
            <h2 className="mt-3 font-display text-4xl text-foreground">{info.short}</h2>
            <p className="mt-2 text-muted-foreground">{info.advice}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              {data.place} · updated {hourLabel(c.time)} local time
            </p>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="PM2.5" value={c.pm25} unit="µg/m³" hint="fine dust" />
          <Stat label="PM10" value={c.pm10} unit="µg/m³" hint="coarse dust" />
          <Stat label="NO₂" value={c.no2} unit="µg/m³" hint="traffic fumes" />
          <Stat label="Ozone" value={c.o3} unit="µg/m³" hint="sunlit smog" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
          <Chip icon={<Sun className="size-4" />}>{c.temp}°C</Chip>
          <Chip icon={<Droplets className="size-4" />}>{c.humidity}% humidity</Chip>
          <Chip icon={<Wind className="size-4" />}>{c.wind} km/h wind</Chip>
        </div>
        <div className="mt-5 border-t border-border pt-5">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            Let family and neighbours know
          </p>
          <ShareAir data={data} />
        </div>
      </section>

      {/* Best windows */}
      <section className="surface animate-rise p-6 [animation-delay:80ms]">
        <p className="eyebrow">Best time to go outside</p>
        <h3 className="mt-2 font-display text-3xl">
          {best.relaxed ? "The gentlest hours" : "Your clean-air windows"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {best.relaxed
            ? "Air stays hazy all day — these hours are the least smoggy, perfect for short, easy outings."
            : "Hours when air stays Moderate or better for the whole family."}
        </p>
        <ul className="mt-5 space-y-3">
          {best.windows.map((w, i) => (
            <li
              key={w.start}
              className={cn(
                "flex items-center justify-between rounded-2xl px-4 py-3",
                LEVEL_CLASSES[aqiInfo(w.avgAqi).level].soft,
              )}
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{windowLabel(w, c.time)}</p>
                <p className="text-xs text-muted-foreground">
                  {w.hours}h · avg AQI {w.avgAqi}
                  {i === 0 && " · cleanest"}
                </p>
              </div>
              <span className="font-display text-2xl text-foreground">{w.avgAqi}</span>
            </li>
          ))}
        </ul>
        <Button asChild variant="link" className="mt-3 px-0">
          <Link to="/planner">
            Plan my day around these <ArrowRight />
          </Link>
        </Button>
      </section>

      {/* Hourly */}
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

      {/* Family */}
      <section className="surface animate-rise p-6 md:col-span-2 [animation-delay:200ms]">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow">Your family right now</p>
            <h3 className="mt-1 font-display text-3xl">Gentle guidance for each person</h3>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/family">Manage</Link>
          </Button>
        </div>
        {family.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Add your little ones, elders or runners to get advice tailored to their lungs and
              routines.
            </p>
            <Button asChild variant="soft" className="mt-4">
              <Link to="/family">Add family members</Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {family.map((m) => {
              const meta = KIND_META[m.kind];
              const thr = safeThreshold(m.kind, "light");
              const okNow = c.aqi <= thr;
              const w = findWindows(next24, thr, 1, 1);
              return (
                <li key={m.id} className="flex gap-3 rounded-2xl bg-muted/60 p-4">
                  <span className="text-3xl" aria-hidden>
                    {meta.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{m.name}</p>
                    <p
                      className={cn("text-sm", okNow ? "text-aqi-good" : "text-accent-foreground")}
                    >
                      {okNow ? "Comfortable to be outside now" : "Better to wait for cleaner air"}
                    </p>
                    {w.windows[0] && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {w.relaxed ? "Gentlest" : "Best"}: {windowLabel(w.windows[0], c.time)}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Ask */}
      <section className="animate-rise rounded-3xl bg-chat-user p-6 text-chat-user-foreground shadow-lift [animation-delay:260ms]">
        <MessageCircleHeart className="size-7" />
        <h3 className="mt-3 font-display text-3xl">Wondering about something?</h3>
        <p className="mt-1 text-sm opacity-80">
          Ask in plain words — answers use today's live air.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {STARTER_QUESTIONS.slice(0, 3).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => ask(q)}
              className="rounded-2xl border border-chat-user-foreground/20 px-4 py-2.5 text-left text-sm transition-colors hover:bg-chat-user-foreground/10"
            >
              {q}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: number;
  unit: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl bg-muted/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-display text-3xl text-foreground">
        {value}
        <span className="ml-1 font-sans text-xs text-muted-foreground">{unit}</span>
      </p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5">
      {icon}
      {children}
    </span>
  );
}
