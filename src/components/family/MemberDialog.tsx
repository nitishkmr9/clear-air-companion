import { Plus } from "lucide-react";
import { useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import {
  blankRoutine,
  KIND_META,
  templateRoutines,
  type Member,
  type MemberKind,
  type Routine,
} from "@/lib/family";
import { cn } from "@/lib/utils";

import { RoutineEditor } from "./RoutineEditor";

const KINDS = Object.keys(KIND_META) as MemberKind[];

/** Add or edit a family member. New members get template routines for their type. */
export function MemberDialog({
  member,
  isNew,
  onClose,
  onSave,
}: {
  member: Member;
  isNew: boolean;
  onClose: () => void;
  onSave: (m: Member) => void;
}) {
  const [m, setM] = useState<Member>(member);

  const setKind = (kind: MemberKind) =>
    setM((prev) => ({ ...prev, kind, routines: isNew ? templateRoutines(kind) : prev.routines }));

  const setRoutines = (update: (routines: Routine[]) => Routine[]) =>
    setM((prev) => ({ ...prev, routines: update(prev.routines) }));

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

          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium leading-none">Who are they?</legend>
            <div className="grid grid-cols-3 gap-2 pt-1.5 sm:grid-cols-5">
              {KINDS.map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => setKind(k)}
                  aria-pressed={m.kind === k}
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
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="sr-only">Daily routines</legend>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none" aria-hidden>
                Daily routines
              </p>
              <Button
                type="button"
                size="sm"
                variant="soft"
                onClick={() => setRoutines((rs) => [...rs, blankRoutine()])}
              >
                <Plus /> Add
              </Button>
            </div>
            {m.routines.map((r) => (
              <RoutineEditor
                key={r.id}
                routine={r}
                onChange={(patch) =>
                  setRoutines((rs) => rs.map((x) => (x.id === r.id ? { ...x, ...patch } : x)))
                }
                onRemove={() => setRoutines((rs) => rs.filter((x) => x.id !== r.id))}
              />
            ))}
          </fieldset>

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
