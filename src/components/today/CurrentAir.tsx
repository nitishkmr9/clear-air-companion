import { Droplets, Sun, Wind } from "lucide-react";
import type { ReactNode } from "react";

import { AqiRing, LevelPill } from "@/components/app/aqi-ui";
import { ShareAir } from "@/components/app/share";
import { aqiInfo, hourLabel, type AirSnapshot } from "@/lib/aqi";

/** The big "right now" card: AQI ring, pollutants, weather and sharing. */
export function CurrentAir({ data }: { data: AirSnapshot }) {
  const c = data.current;
  const info = aqiInfo(c.aqi);
  return (
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
        <Stat label="PM2.5" value={c.pm25} hint="fine dust" />
        <Stat label="PM10" value={c.pm10} hint="coarse dust" />
        <Stat label="NO₂" value={c.no2} hint="traffic fumes" />
        <Stat label="Ozone" value={c.o3} hint="sunlit smog" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
        <Weather icon={<Sun className="size-4" aria-hidden />}>{c.temp}°C</Weather>
        <Weather icon={<Droplets className="size-4" aria-hidden />}>{c.humidity}% humidity</Weather>
        <Weather icon={<Wind className="size-4" aria-hidden />}>{c.wind} km/h wind</Weather>
      </div>
      <div className="mt-5 border-t border-border pt-5">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">
          Let family and neighbours know
        </p>
        <ShareAir data={data} />
      </div>
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-display text-3xl text-foreground">
        {value}
        <span className="ml-1 font-sans text-xs text-muted-foreground">µg/m³</span>
      </p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function Weather({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5">
      {icon}
      {children}
    </span>
  );
}
