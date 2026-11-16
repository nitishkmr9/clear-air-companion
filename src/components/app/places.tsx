import { useQueries } from "@tanstack/react-query";
import { Check, MapPin, Plus, X } from "lucide-react";
import { useState } from "react";

import { LevelPill } from "@/components/app/aqi-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cleanestIndex, fetchAirSnapshot, findWindows, windowLabel } from "@/lib/aqi";
import { newId } from "@/lib/family";
import { placeStore, savedPlacesStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const LABELS = ["Home", "School", "Office", "Grandparents"];

export function SavedPlaces() {
  const places = savedPlacesStore.use();
  const active = placeStore.use();
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("Home");

  const queries = useQueries({
    queries: places.map((p) => ({
      queryKey: ["air", p.lat, p.lon],
      queryFn: () => fetchAirSnapshot(p),
      staleTime: 10 * 60 * 1000,
    })),
  });

  const alreadySaved = places.some((p) => p.lat === active.lat && p.lon === active.lon);
  const save = () => {
    const name = label.trim() || "Saved place";
    savedPlacesStore.set((prev) => [...prev, { ...active, id: newId(), label: name }]);
    setAdding(false);
  };

  const cleanest = cleanestIndex(queries.map((q) => q.data?.current.aqi));

  return (
    <section className="surface p-6 md:col-span-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Your places</p>
          <h3 className="mt-1 font-display text-3xl">Compare home, school & office</h3>
        </div>
        {!alreadySaved && !adding && (
          <Button size="sm" variant="soft" onClick={() => setAdding(true)}>
            <Plus /> Save current place
          </Button>
        )}
      </div>

      {adding && (
        <div className="mt-4 rounded-2xl bg-muted/60 p-4">
          <p className="text-sm text-foreground">
            Save <strong>{active.name}</strong> as…
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {LABELS.map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={label === l}
                onClick={() => setLabel(l)}
                className={cn(
                  "rounded-full border border-border px-3 py-1.5 text-xs",
                  label === l
                    ? "border-primary bg-primary-soft text-secondary-foreground"
                    : "bg-card hover:bg-muted",
                )}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <Input
              value={label}
              maxLength={30}
              onChange={(e) => setLabel(e.target.value)}
              aria-label="Place name"
              className="bg-card"
            />
            <Button onClick={save}>
              <Check /> Save
            </Button>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {places.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
          Save the places your family spends time in. We'll show which has the kindest air right now
          — handy for deciding where to play or walk.
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {places.map((p, i) => {
            const q = queries[i];
            const d = q?.data;
            const isActive = p.lat === active.lat && p.lon === active.lon;
            const best = d ? findWindows(d.hourly.slice(0, 24), 100, 1, 1) : null;
            return (
              <li key={p.id} className="relative">
                <button
                  type="button"
                  onClick={() => placeStore.set({ name: p.name, lat: p.lat, lon: p.lon })}
                  className={cn(
                    "w-full rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/60",
                    isActive && "border-primary",
                  )}
                >
                  <div className="flex items-start justify-between gap-2 pr-6">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 font-semibold text-foreground">
                        <MapPin className="size-4 text-primary" /> {p.label}
                        {cleanest === i && places.length > 1 && (
                          <span className="rounded-full bg-aqi-good-soft px-2 py-0.5 text-[0.65rem] font-semibold text-foreground">
                            Cleanest
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{p.name}</p>
                    </div>
                    <span className="font-display text-3xl leading-none text-foreground">
                      {d ? d.current.aqi : "…"}
                    </span>
                  </div>
                  {d && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <LevelPill aqi={d.current.aqi} />
                      {best?.windows[0] && (
                        <span className="text-xs text-muted-foreground">
                          {best.relaxed ? "Gentlest" : "Best"}:{" "}
                          {windowLabel(best.windows[0], d.current.time)}
                        </span>
                      )}
                    </div>
                  )}
                  {isActive && (
                    <p className="mt-2 text-[0.7rem] font-semibold text-primary">
                      Showing on dashboard
                    </p>
                  )}
                </button>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label={`Remove ${p.label}`}
                  className="absolute right-2 top-2"
                  onClick={() => savedPlacesStore.set((prev) => prev.filter((x) => x.id !== p.id))}
                >
                  <X />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
