import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { LevelPill } from "@/components/app/aqi-ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { needsDoctorNudge, SEVERITY, SYMPTOMS } from "@/lib/diary";
import { newId } from "@/lib/family";
import { diaryStore, todayKey, type DiaryEntry, type Symptom } from "@/lib/store";

import { Chip } from "./Chip";

type Air = { aqi: number; pm25: number } | undefined;

/** Quick symptom log; each entry is saved with the air at that moment. */
export function EntryForm({
  people,
  air,
  placeName,
}: {
  people: string[];
  air: Air;
  placeName: string;
}) {
  const [who, setWho] = useState(people[0] ?? "Me");
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [severity, setSeverity] = useState<DiaryEntry["severity"]>(1);
  const [note, setNote] = useState("");

  const toggle = (s: Symptom) =>
    setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const save = () => {
    if (symptoms.length === 0) {
      toast("Pick at least one symptom — or enjoy a symptom-free day! 🌿");
      return;
    }
    const entry: DiaryEntry = {
      id: newId(),
      at: Date.now(),
      date: todayKey(),
      who,
      symptoms,
      severity,
      note: note.trim() || undefined,
      aqi: air?.aqi,
      pm25: air?.pm25,
      place: placeName,
    };
    diaryStore.set((prev) => [entry, ...prev]);
    if (needsDoctorNudge(entry)) {
      toast("Saved. If breathing feels hard or doesn't settle, please contact a doctor. 💚", {
        duration: 8000,
      });
    } else {
      toast.success("Saved to your diary.");
    }
    setSymptoms([]);
    setSeverity(1);
    setNote("");
  };

  return (
    <section className="surface p-6 lg:col-span-2">
      <p className="eyebrow">New entry</p>
      <h2 className="mt-1 font-display text-3xl">How is everyone feeling?</h2>

      <p className="mt-5 text-sm font-semibold text-foreground">Who</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {people.map((p) => (
          <Chip key={p} active={who === p} onClick={() => setWho(p)}>
            {p}
          </Chip>
        ))}
      </div>

      <p className="mt-5 text-sm font-semibold text-foreground">What's bothering them?</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {SYMPTOMS.map((s) => (
          <Chip key={s.id} active={symptoms.includes(s.id)} onClick={() => toggle(s.id)}>
            <span aria-hidden>{s.emoji}</span> {s.label}
          </Chip>
        ))}
      </div>

      <p className="mt-5 text-sm font-semibold text-foreground">How strong?</p>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {SEVERITY.map((s) => (
          <Chip key={s.v} active={severity === s.v} onClick={() => setSeverity(s.v)}>
            {s.label}
          </Chip>
        ))}
      </div>

      <Textarea
        value={note}
        maxLength={300}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note — e.g. after playing outside, used inhaler"
        className="mt-5 bg-card"
        aria-label="Note"
      />
      {air && (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          Will be saved with today's air: <LevelPill aqi={air.aqi} /> AQI {air.aqi}
        </p>
      )}
      <Button variant="hero" className="mt-4 w-full" onClick={save}>
        <Plus /> Save entry
      </Button>
    </section>
  );
}
