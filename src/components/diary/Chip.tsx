import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Toggle chip used to pick a person, symptom or strength. */
export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border border-border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-primary bg-primary-soft text-secondary-foreground"
          : "bg-card hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
