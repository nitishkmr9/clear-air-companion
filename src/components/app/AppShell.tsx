import { Link, useRouterState } from "@tanstack/react-router";
import { Bot, CalendarClock, HeartHandshake, Home, Sprout, Users } from "lucide-react";
import type { ReactNode } from "react";

import logo from "@/assets/breatheeasy-logo.png";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Today", icon: Home },
  { to: "/family", label: "Family", icon: Users },
  { to: "/assistant", label: "Ask", icon: Bot },
  { to: "/planner", label: "Planner", icon: CalendarClock },
  { to: "/indoor", label: "Indoor", icon: HeartHandshake },
  { to: "/impact", label: "Impact", icon: Sprout },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="" width={36} height={36} className="size-9" />
            <span className="font-display text-2xl text-foreground">BreatheEasy</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isActive(n.to) && "bg-primary-soft text-secondary-foreground",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <nav className="fixed inset-x-3 bottom-3 z-40 rounded-3xl border border-border bg-card/90 px-1 py-1.5 shadow-lift backdrop-blur-xl md:hidden">
        <ul className="grid grid-cols-6">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = isActive(n.to);
            return (
              <li key={n.to}>
                <Link
                  to={n.to}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[0.66rem] font-medium text-muted-foreground",
                    active && "bg-primary-soft text-secondary-foreground",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex animate-rise flex-col gap-4 pb-6 pt-8 md:flex-row md:items-end md:justify-between md:pt-12">
      <div className="max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 font-display text-4xl leading-[1.05] text-foreground md:text-6xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 text-base text-muted-foreground md:text-lg">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
