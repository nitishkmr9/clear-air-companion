import { Check, MapPinned, Route as RouteIcon, TreePine } from "lucide-react";
import type { ReactNode } from "react";

export function RouteTips({ no2 }: { no2: number }) {
  return (
    <section aria-labelledby="routes-heading" className="surface p-6">
      <p className="eyebrow">Pollution-avoiding routes</p>
      <h2 id="routes-heading" className="mt-1 font-display text-3xl">
        Small detours, big differences
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        <Tip icon={<TreePine />} title="Go through green lanes">
          Park paths and quiet residential streets can mean 20–50% less exposure than main roads.
        </Tip>
        <Tip icon={<RouteIcon />} title="Step back from traffic">
          Walking a few metres from the kerb, or on the building side, noticeably lowers the fumes
          you breathe.
        </Tip>
        <Tip icon={<MapPinned />} title="Dodge the rush">
          NO₂ is {no2} µg/m³ now. Traffic fumes peak around 8–10 AM and 6–9 PM — shift trips if you
          can.
        </Tip>
        <Tip icon={<Check />} title="Windows up, recirculate">
          In cars and cabs, set air to recirculate in heavy traffic — it can halve the particles
          inside.
        </Tip>
      </ul>
    </section>
  );
}

function Tip({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3 rounded-2xl bg-muted/60 p-4">
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary [&_svg]:size-4"
      >
        {icon}
      </span>
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{children}</p>
      </div>
    </li>
  );
}
