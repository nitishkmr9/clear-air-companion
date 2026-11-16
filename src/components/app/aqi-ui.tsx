import { CloudOff, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { aqiInfo, hourLabel, LEVEL_CLASSES, type HourPoint } from "@/lib/aqi";
import { cn } from "@/lib/utils";

export function AqiRing({ aqi, size = 200 }: { aqi: number; size?: number }) {
  const info = aqiInfo(aqi);
  const cls = LEVEL_CLASSES[info.level];
  const r = 44;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, aqi / 300);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className={cn(
          "absolute inset-4 rounded-full opacity-60 blur-2xl animate-breathe",
          cls.soft,
        )}
      />
      <svg viewBox="0 0 100 100" className="relative -rotate-90" width={size} height={size}>
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="7" className="stroke-muted" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          className={cn(cls.ring, "transition-all duration-1000")}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-6xl leading-none text-foreground">{aqi}</span>
        <span className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          US AQI
        </span>
      </div>
    </div>
  );
}

export function LevelPill({ aqi, className }: { aqi: number; className?: string }) {
  const info = aqiInfo(aqi);
  const cls = LEVEL_CLASSES[info.level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-foreground",
        cls.soft,
        className,
      )}
    >
      <span className={cn("size-2 rounded-full", cls.bg)} />
      {info.label}
    </span>
  );
}

export function HourlyStrip({ hours, highlight }: { hours: HourPoint[]; highlight?: Set<string> }) {
  const max = Math.max(150, ...hours.map((h) => h.aqi));
  return (
    <div className="no-scrollbar -mx-1 overflow-x-auto px-1">
      <div className="flex min-w-max items-end gap-1.5 pb-1">
        {hours.map((h, i) => {
          const info = aqiInfo(h.aqi);
          const cls = LEVEL_CLASSES[info.level];
          const isHi = highlight?.has(h.time);
          return (
            <div key={h.time} className="flex w-9 flex-col items-center gap-1.5">
              <span className="text-[0.65rem] font-semibold text-muted-foreground">{h.aqi}</span>
              <div className="flex h-28 w-full items-end">
                <div
                  className={cn(
                    "w-full rounded-lg transition-all",
                    cls.bg,
                    isHi
                      ? "opacity-100 ring-2 ring-primary ring-offset-2 ring-offset-card"
                      : "opacity-70",
                  )}
                  style={{ height: `${Math.max(8, (h.aqi / max) * 100)}%` }}
                  title={`${hourLabel(h.time)} · AQI ${h.aqi} · PM2.5 ${h.pm25}`}
                />
              </div>
              <span
                className={cn(
                  "text-[0.62rem] text-muted-foreground",
                  i === 0 && "font-bold text-foreground",
                )}
              >
                {i === 0 ? "Now" : hourLabel(h.time).replace(" ", "")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AirLoading() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Skeleton className="h-72 rounded-3xl md:col-span-2" />
      <Skeleton className="h-72 rounded-3xl" />
    </div>
  );
}

export function AirError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="surface flex flex-col items-center gap-3 p-10 text-center">
      <CloudOff className="size-8 text-muted-foreground" />
      <p className="font-display text-2xl">We couldn't reach the air sensors</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        This is usually brief. Take a slow breath — we'll try again.
      </p>
      <Button variant="soft" onClick={onRetry}>
        <RefreshCw /> Try again
      </Button>
    </div>
  );
}
