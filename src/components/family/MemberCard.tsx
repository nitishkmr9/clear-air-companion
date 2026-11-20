import { Clock, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { clockLabel } from "@/lib/aqi";
import { KIND_META, safeThreshold, type Member } from "@/lib/family";

/** One family member: who they are, their comfort level and their daily routines. */
export function MemberCard({
  member,
  onEdit,
  onRemove,
}: {
  member: Member;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const meta = KIND_META[member.kind];
  return (
    <article className="surface flex flex-col p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-3xl"
            aria-hidden
          >
            {meta.emoji}
          </span>
          <div>
            <h2 className="font-display text-2xl leading-tight">{member.name}</h2>
            <p className="text-sm text-muted-foreground">
              {meta.label}
              {member.age ? ` · ${member.age} yrs` : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Edit ${member.name}`}
            onClick={onEdit}
          >
            <Pencil />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Remove ${member.name}`}
            onClick={onRemove}
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
        {member.routines.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-sm"
          >
            <span className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" aria-hidden />
              {r.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {clockLabel(r.hour)} · {r.minutes}m · ≤{safeThreshold(member.kind, r.intensity)}
            </span>
          </li>
        ))}
        {member.routines.length === 0 && (
          <li className="text-sm text-muted-foreground">No routines yet.</li>
        )}
      </ul>
      {member.notes && (
        <p className="mt-3 text-xs italic text-muted-foreground">“{member.notes}”</p>
      )}
    </article>
  );
}
