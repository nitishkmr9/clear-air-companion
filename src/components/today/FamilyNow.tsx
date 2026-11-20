import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { windowLabel, type HourPoint } from "@/lib/aqi";
import { KIND_META, memberOutlook, type Member } from "@/lib/family";
import { cn } from "@/lib/utils";

/** Per-person guidance for right now, using each member's own comfort level. */
export function FamilyNow({
  family,
  hours,
  aqiNow,
  now,
}: {
  family: Member[];
  hours: HourPoint[];
  aqiNow: number;
  now: string;
}) {
  return (
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
            const outlook = memberOutlook(m, hours, aqiNow);
            return (
              <li key={m.id} className="flex gap-3 rounded-2xl bg-muted/60 p-4">
                <span className="text-3xl" aria-hidden>
                  {KIND_META[m.kind].emoji}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{m.name}</p>
                  <p
                    className={cn(
                      "text-sm",
                      outlook.okNow ? "text-aqi-good" : "text-accent-foreground",
                    )}
                  >
                    {outlook.okNow
                      ? "Comfortable to be outside now"
                      : "Better to wait for cleaner air"}
                  </p>
                  {outlook.window && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {outlook.relaxed ? "Gentlest" : "Best"}: {windowLabel(outlook.window, now)}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
