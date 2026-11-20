import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { clockLabel } from "@/lib/aqi";
import { INTENSITIES, type Routine } from "@/lib/family";

const DURATIONS = [15, 20, 30, 45, 60, 90, 120];
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Edit one routine: name, usual time, duration, intensity and whether the time can move. */
export function RoutineEditor({
  routine: r,
  onChange,
  onRemove,
}: {
  routine: Routine;
  onChange: (patch: Partial<Routine>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-2 rounded-2xl bg-muted/60 p-3">
      <div className="flex gap-2">
        <Input
          value={r.label}
          aria-label="Routine name"
          maxLength={80}
          onChange={(e) => onChange({ label: e.target.value })}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={`Remove ${r.label}`}
          onClick={onRemove}
        >
          <Trash2 />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <NativeSelect
          aria-label={`Usual time for ${r.label}`}
          value={String(r.hour)}
          onChange={(e) => onChange({ hour: Number(e.target.value) })}
        >
          {HOURS.map((h) => (
            <option key={h} value={String(h)}>
              {clockLabel(h)}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label={`Duration of ${r.label}`}
          value={String(r.minutes)}
          onChange={(e) => onChange({ minutes: Number(e.target.value) })}
        >
          {DURATIONS.map((n) => (
            <option key={n} value={String(n)}>
              {n} min
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label={`Intensity of ${r.label}`}
          value={r.intensity}
          onChange={(e) => {
            const intensity = INTENSITIES.find((x) => x === e.target.value);
            if (intensity) onChange({ intensity });
          }}
        >
          {INTENSITIES.map((x) => (
            <option key={x} value={x}>
              {capitalise(x)}
            </option>
          ))}
        </NativeSelect>
      </div>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <Switch checked={r.flexible} onCheckedChange={(v) => onChange({ flexible: v })} />
        Time is flexible — suggest cleaner hours
      </label>
    </div>
  );
}
