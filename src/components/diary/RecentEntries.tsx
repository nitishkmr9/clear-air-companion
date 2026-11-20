import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SEVERITY, SYMPTOMS } from "@/lib/diary";
import type { DiaryEntry } from "@/lib/store";

const SHOWN = 15;
const severityLabel = (v: DiaryEntry["severity"]) => SEVERITY.find((s) => s.v === v)?.label;
const symptomLabel = (id: string) => SYMPTOMS.find((s) => s.id === id)?.label;

/** The latest diary entries, newest first, each with a delete button. */
export function RecentEntries({
  entries,
  onDelete,
}: {
  entries: DiaryEntry[];
  onDelete: (id: string) => void;
}) {
  return (
    <section className="surface p-6">
      <h2 className="eyebrow">Recent entries</h2>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No entries yet. Symptom-free days are the best kind. 🌿
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {entries.slice(0, SHOWN).map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {e.who} · {severityLabel(e.severity)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {e.symptoms.map(symptomLabel).join(", ")}
                </p>
                {e.note && (
                  <p className="mt-0.5 text-xs italic text-muted-foreground">“{e.note}”</p>
                )}
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {e.date}
                  {e.aqi !== undefined && ` · AQI ${e.aqi}`}
                  {e.place && ` · ${e.place}`}
                </p>
              </div>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={`Delete ${e.who}'s entry from ${e.date}`}
                onClick={() => onDelete(e.id)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
