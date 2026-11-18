import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { newId } from "@/lib/family";
import { MODE_META, tripSavings, type TransportMode } from "@/lib/impact";
import { tripStore, type Trip } from "@/lib/store";
import { cn } from "@/lib/utils";

const MODES: TransportMode[] = ["car", "carpool", "metro", "bus", "bike", "walk"];

const updateTrip = (id: string, patch: Partial<Trip>) =>
  tripStore.set((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

export function TripList() {
  const trips = tripStore.use();
  return (
    <section aria-labelledby="trips-heading" className="surface p-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Transit & carpool</p>
          <h2 id="trips-heading" className="mt-1 font-display text-3xl">
            Today's trips
          </h2>
        </div>
        <Button
          size="sm"
          variant="soft"
          onClick={() =>
            tripStore.set((prev) => [
              ...prev,
              { id: newId(), label: "Errand", km: 4, mode: "walk", riders: 1 },
            ])
          }
        >
          <Plus /> Trip
        </Button>
      </div>
      <ul className="mt-4 space-y-3">
        {trips.map((t) => (
          <TripRow key={t.id} t={t} />
        ))}
      </ul>
    </section>
  );
}

function TripRow({ t }: { t: Trip }) {
  const s = tripSavings(t.mode, t.km, t.riders);
  const metro = tripSavings("metro", t.km);
  return (
    <li className="rounded-2xl bg-muted/60 p-4">
      <div className="flex gap-2">
        <Input
          value={t.label}
          aria-label="Trip name"
          maxLength={60}
          onChange={(e) => updateTrip(t.id, { label: e.target.value })}
          className="bg-card"
        />
        <div className="relative w-28 shrink-0">
          <Input
            type="number"
            min={0.5}
            max={500}
            step={0.5}
            aria-label={`Distance in km for ${t.label}`}
            value={t.km}
            onChange={(e) =>
              updateTrip(t.id, { km: Math.min(500, Math.max(0, Number(e.target.value))) })
            }
            className="bg-card pr-9"
          />
          <span
            aria-hidden="true"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
          >
            km
          </span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          aria-label={`Remove ${t.label}`}
          onClick={() => tripStore.set((prev) => prev.filter((x) => x.id !== t.id))}
        >
          <Trash2 />
        </Button>
      </div>
      <div
        role="group"
        aria-label={`How you'll travel for ${t.label}`}
        className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto"
      >
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={t.mode === m}
            onClick={() =>
              updateTrip(t.id, { mode: m, riders: m === "carpool" ? Math.max(2, t.riders) : 1 })
            }
            className={cn(
              "shrink-0 rounded-full border border-border px-3 py-1.5 text-xs transition-colors",
              t.mode === m
                ? "border-primary bg-primary-soft text-secondary-foreground"
                : "bg-card hover:bg-muted",
            )}
          >
            <span aria-hidden="true">{MODE_META[m].emoji}</span> {MODE_META[m].label}
          </button>
        ))}
      </div>
      {t.mode === "carpool" && (
        <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          Riders
          <Input
            type="number"
            min={2}
            max={8}
            value={t.riders}
            onChange={(e) =>
              updateTrip(t.id, { riders: Math.min(8, Math.max(2, Number(e.target.value))) })
            }
            className="h-8 w-16 bg-card"
          />
        </label>
      )}
      <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
        {t.mode === "car" ? (
          <>
            Driving solo: switching to the metro would save ~{metro.co2Kg} kg CO₂ and ₹
            {Math.round(metro.money)}.
          </>
        ) : (
          <>
            Impact vs driving solo: <strong className="text-foreground">{s.co2Kg} kg CO₂</strong>{" "}
            and <strong className="text-foreground">₹{Math.round(s.money)}</strong> saved.
          </>
        )}
      </p>
    </li>
  );
}
