import { HeartPulse } from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { diaryChart } from "@/lib/diary";

const axis = {
  tickLine: false,
  axisLine: false,
  fontSize: 10,
  stroke: "var(--muted-foreground)",
} as const;

/** Symptom load bars next to the AQI line for the last two weeks. */
export function PatternChart({
  rows,
  message,
}: {
  rows: ReturnType<typeof diaryChart>;
  message: string;
}) {
  return (
    <section className="surface p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <HeartPulse className="size-5" aria-hidden />
        </span>
        <div>
          <p className="eyebrow">Your pattern</p>
          <h2 className="font-display text-2xl leading-tight">Symptoms next to the air</h2>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ left: -20, right: -10, top: 4 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="day" {...axis} />
            <YAxis yAxisId="l" allowDecimals={false} {...axis} />
            <YAxis yAxisId="r" orientation="right" {...axis} />
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Bar
              yAxisId="l"
              dataKey="load"
              name="Symptom load"
              fill="var(--chart-2)"
              radius={[6, 6, 0, 0]}
            />
            <Line
              yAxisId="r"
              dataKey="aqi"
              name="AQI"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Bars: symptom load (strength × number of symptoms). Line: AQI when logged.
      </p>
    </section>
  );
}
