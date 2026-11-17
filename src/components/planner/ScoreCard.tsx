import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ScoreCard({
  score,
  co2Kg,
  money,
  doseUg,
  onCommit,
}: {
  score: number;
  co2Kg: number;
  money: number;
  doseUg: number;
  onCommit: () => void;
}) {
  return (
    <section
      aria-labelledby="score-heading"
      className="surface flex flex-col items-center p-6 text-center lg:order-2"
    >
      <h2 id="score-heading" className="eyebrow">
        Clean air score
      </h2>
      <ScoreRing score={score} />
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        70% from the air in your chosen outdoor slots, 30% from how low-emission your trips are.
      </p>
      <dl className="mt-5 grid w-full grid-cols-3 gap-2">
        <Mini label="CO₂ saved" value={`${co2Kg.toFixed(1)} kg`} />
        <Mini label="Saved" value={`₹${Math.round(money)}`} />
        <Mini label="Dust avoided" value={`${doseUg} µg`} />
      </dl>
      <Button variant="hero" className="mt-5 w-full" onClick={onCommit}>
        <Check /> Commit to today's plan
      </Button>
      <Button asChild variant="link" size="sm" className="mt-1">
        <Link to="/impact">
          See my impact <ArrowRight />
        </Link>
      </Button>
    </section>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative mt-3 size-44" role="img" aria-label={`Clean air score ${score} out of 100`}>
      <svg viewBox="0 0 100 100" className="-rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8" className="stroke-muted" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - score / 100)}
          className="stroke-primary transition-all duration-700"
        />
      </svg>
      <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-6xl leading-none">{score}</span>
        <span className="text-xs text-muted-foreground">out of 100</span>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col-reverse rounded-2xl bg-muted/60 p-2.5">
      <dt className="text-[0.65rem] text-muted-foreground">{label}</dt>
      <dd className="font-display text-xl text-foreground">{value}</dd>
    </div>
  );
}
