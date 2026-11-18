import { createFileRoute } from "@tanstack/react-router";
import { Clock, Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { clockLabel } from "@/lib/aqi";
import {
  KIND_META,
  newId,
  safeThreshold,
  type Member,
  type MemberKind,
  type Routine,
} from "@/lib/family";
import { familyStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/family")({
  head: () => ({
    meta: [
      { title: "Family profiles — BreatheEasy" },
      {
        name: "description",
        content:
          "Add children, elders and runners with their daily routines for air advice tailored to each person.",
      },
      { property: "og:title", content: "Family profiles — BreatheEasy" },
      {
        property: "og:description",
        content: "Tailored clean-air advice for every member of your family.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FamilyPage,
});

const TEMPLATES: Record<MemberKind, Omit<Routine, "id">[]> = {
  child: [
    { label: "School walk", hour: 8, minutes: 20, intensity: "light", flexible: false },
    { label: "Park playtime", hour: 17, minutes: 60, intensity: "moderate", flexible: true },
  ],
  elderly: [{ label: "Morning walk", hour: 7, minutes: 30, intensity: "light", flexible: true }],
  runner: [{ label: "Evening run", hour: 18, minutes: 45, intensity: "vigorous", flexible: true }],
  asthma: [{ label: "Short walk", hour: 16, minutes: 20, intensity: "light", flexible: true }],
  adult: [{ label: "Commute", hour: 9, minutes: 40, intensity: "light", flexible: false }],
};

const hourText = clockLabel;

function FamilyPage() {
  const family = familyStore.use();
  const [editing, setEditing] = useState<Member | null>(null);

  const startNew = () =>
    setEditing({
      id: newId(),
      name: "",
      kind: "child",
      routines: TEMPLATES.child.map((r) => ({ ...r, id: newId() })),
    });

  const save = (m: Member) => {
    familyStore.set((prev) =>
      prev.some((p) => p.id === m.id) ? prev.map((p) => (p.id === m.id ? m : p)) : [...prev, m],
    );
    setEditing(null);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 md:px-6">
      <PageHeader
        eyebrow="Family profiles"
        title={
          <>
            Everyone breathes <em className="text-primary">a little differently</em>
          </>
        }
        description="Tell us who's at home and what their days look like. Advice, planning and chat answers adapt to each person."
        action={
          <Button variant="hero" size="lg" onClick={startNew}>
            <UserPlus /> Add a member
          </Button>
        }
      />

      {family.length === 0 ? (
        <div className="surface flex flex-col items-center gap-4 p-10 text-center">
          <div className="flex gap-2 text-4xl" aria-hidden>
            🧒 👵 🏃
          </div>
          <h2 className="font-display text-3xl">Start with someone you care about</h2>
          <p className="max-w-md text-muted-foreground">
            Children, elders, runners and anyone with asthma each get their own comfort threshold
            and clean-air windows.
          </p>
          <Button variant="soft" onClick={startNew}>
            <Plus /> Add first member
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {family.map((m) => {
            const meta = KIND_META[m.kind];
            return (
              <article key={m.id} className="surface flex flex-col p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-3xl"
                      aria-hidden
                    >
                      {meta.emoji}
                    </span>
                    <div>
                      <h2 className="font-display text-2xl leading-tight">{m.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        {meta.label}
                        {m.age ? ` · ${m.age} yrs` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Edit ${m.name}`}
                      onClick={() => setEditing(m)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Remove ${m.name}`}
                      onClick={() => familyStore.set((prev) => prev.filter((p) => p.id !== m.id))}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{meta.description}</p>
                <p className="mt-2 text-xs font-semibold text-foreground">
                  Comfortable outdoors up to AQI {meta.threshold}
                </p>
                <ul className="mt-4 space-y-2">
                  {m.routines.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <Clock className="size-4 text-muted-foreground" />
                        {r.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {hourText(r.hour)} · {r.minutes}m · ≤{safeThreshold(m.kind, r.intensity)}
                      </span>
                    </li>
                  ))}
                  {m.routines.length === 0 && (
                    <li className="text-sm text-muted-foreground">No routines yet.</li>
                  )}
                </ul>
                {m.notes && (
                  <p className="mt-3 text-xs italic text-muted-foreground">“{m.notes}”</p>
                )}
              </article>
            );
          })}
        </div>
      )}

      {editing && <MemberDialog member={editing} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function MemberDialog({
  member,
  onClose,
  onSave,
}: {
  member: Member;
  onClose: () => void;
  onSave: (m: Member) => void;
}) {
  const [m, setM] = useState<Member>(member);
  const isNew = !familyStore.get().some((p) => p.id === member.id);

  const setKind = (kind: MemberKind) =>
    setM((prev) => ({
      ...prev,
      kind,
      routines: isNew ? TEMPLATES[kind].map((r) => ({ ...r, id: newId() })) : prev.routines,
    }));

  const updateRoutine = (id: string, patch: Partial<Routine>) =>
    setM((prev) => ({
      ...prev,
      routines: prev.routines.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-normal">
            {isNew ? "Add a family member" : `Edit ${member.name}`}
          </DialogTitle>
        </DialogHeader>
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!m.name.trim()) return;
            onSave({ ...m, name: m.name.trim() });
          }}
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={m.name}
                required
                maxLength={60}
                placeholder="e.g. Aarav"
                onChange={(e) => setM({ ...m, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                min={0}
                max={120}
                value={m.age ?? ""}
                onChange={(e) =>
                  setM({ ...m, age: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Who are they?</Label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {(Object.keys(KIND_META) as MemberKind[]).map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => setKind(k)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl border border-border p-2 text-xs transition-colors",
                    m.kind === k
                      ? "border-primary bg-primary-soft text-secondary-foreground"
                      : "hover:bg-muted",
                  )}
                >
                  <span className="text-2xl" aria-hidden>
                    {KIND_META[k].emoji}
                  </span>
                  {KIND_META[k].label.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Daily routines</Label>
              <Button
                type="button"
                size="sm"
                variant="soft"
                onClick={() =>
                  setM((prev) => ({
                    ...prev,
                    routines: [
                      ...prev.routines,
                      {
                        id: newId(),
                        label: "Outdoor time",
                        hour: 16,
                        minutes: 30,
                        intensity: "light",
                        flexible: true,
                      },
                    ],
                  }))
                }
              >
                <Plus /> Add
              </Button>
            </div>
            {m.routines.map((r) => (
              <div key={r.id} className="space-y-2 rounded-2xl bg-muted/60 p-3">
                <div className="flex gap-2">
                  <Input
                    value={r.label}
                    aria-label="Routine name"
                    onChange={(e) => updateRoutine(r.id, { label: e.target.value })}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Remove routine"
                    onClick={() =>
                      setM((prev) => ({
                        ...prev,
                        routines: prev.routines.filter((x) => x.id !== r.id),
                      }))
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Select
                    value={String(r.hour)}
                    onValueChange={(v) => updateRoutine(r.id, { hour: Number(v) })}
                  >
                    <SelectTrigger aria-label="Usual time">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, h) => (
                        <SelectItem key={h} value={String(h)}>
                          {hourText(h)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(r.minutes)}
                    onValueChange={(v) => updateRoutine(r.id, { minutes: Number(v) })}
                  >
                    <SelectTrigger aria-label="Duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[15, 20, 30, 45, 60, 90, 120].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} min
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={r.intensity}
                    onValueChange={(v) =>
                      updateRoutine(r.id, { intensity: v as Routine["intensity"] })
                    }
                  >
                    <SelectTrigger aria-label="Intensity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="vigorous">Vigorous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch
                    checked={r.flexible}
                    onCheckedChange={(v) => updateRoutine(r.id, { flexible: v })}
                  />
                  Time is flexible — suggest cleaner hours
                </label>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Anything we should know?</Label>
            <Textarea
              id="notes"
              value={m.notes ?? ""}
              maxLength={400}
              placeholder="e.g. mild asthma, uses inhaler before sports"
              onChange={(e) => setM({ ...m, notes: e.target.value })}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="hero">
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
