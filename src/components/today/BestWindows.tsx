import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { aqiInfo, LEVEL_CLASSES, windowLabel, type findWindows } from "@/lib/aqi";
import { cn } from "@/lib/utils";

/** "Best time to go outside": the cleanest stretches of the next day. */
export function BestWindows({ best, now }: { best: ReturnType<typeof findWindows>; now: string }) {
  return (
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
              <p className="text-sm font-semibold text-foreground">{windowLabel(w, now)}</p>
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
  );
}
