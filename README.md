# BreatheEasy — family air-quality guide

BreatheEasy helps families get through winter smog calmly. It shows live air quality where you are, finds the cleanest hours to go outside, tailors advice to each family member, and explains the direct impact of every choice.

Live app: https://family-airwise-companion.lovable.app

## Features

| Page | What it does |
| --- | --- |
| **Today** (`/`) | Live US AQI, PM2.5, PM10, NO₂, O₃ and weather; colour-coded health level; 36-hour forecast; best "go outside" windows; saved places (Home, School, Office…) compared side by side; share today's air on WhatsApp; clean-air alerts. |
| **Family** (`/family`) | Members (child, elder, runner, asthma, adult) with routines. Each gets a comfort AQI threshold based on who they are and how hard the activity is. |
| **Assistant** (`/assistant`) | AI chat grounded in live air data and your family's routines, with multiple saved conversations. Always quantifies the impact of each suggestion. |
| **Planner** (`/planner`) | Moves flexible routines to cleaner hours, compares car / carpool / metro / bus / cycle / walk, and gives the day a 0–100 clean-air score. |
| **Indoor** (`/indoor`) | Ventilation timing from the forecast, humidity tips, DIY purifier guide and a daily habit checklist. |
| **Impact** (`/impact`) | CO₂ avoided, ₹ saved and fine dust not breathed in, with 14-day charts and a streak. |
| **Diary** (`/diary`) | Log symptoms next to the AQI at the time and see how smoggy days compare with cleaner ones. |

Everything is free: air data comes from [Open-Meteo](https://open-meteo.com) (no key), and all personal data stays in the browser (no sign-in, nothing stored on a server).

## How it works

```text
Browser (React 19 + TanStack Router/Query + Tailwind v4)
  ├─ src/lib/aqi.ts        Open-Meteo fetch, AQI levels, best-window finder
  ├─ src/lib/impact.ts     CO₂ / ₹ / dose / clean-air score / streak rules
  ├─ src/lib/family.ts     comfort thresholds per member and intensity
  ├─ src/lib/planner.ts    routine re-scheduling
  ├─ src/lib/alerts.ts     when to send a clean-air alert
  ├─ src/lib/diary.ts      smoggy-vs-clean symptom comparison
  ├─ src/lib/share.ts      share message
  └─ src/lib/store.ts      localStorage stores (SSR-safe via useSyncExternalStore)

Server (TanStack Start on Cloudflare Workers)
  └─ POST /api/chat → src/lib/chat.server.ts
       validates input (zod) → re-fetches live air → builds grounded instructions
       → streams the answer from the Lovable AI Gateway (key stays server-side)
```

Key formulas (all in `src/lib/impact.ts`):

- Trip savings vs. solo car: car 0.17 kg CO₂ & ₹8/km, metro 0.03 kg & ₹2.5, bus 0.05 kg & ₹1.5; carpool splits the car by riders.
- Dust dose avoided = breathing rate (L/min) × minutes × ΔPM2.5 (µg/m³).
- Clean-air score = 70% exposure (AQI 0 → 100 pts, ≥ 300 → 0) + 30% share of trips not by solo car.

## Testing

```sh
bun install
bun run test            # 120+ unit, component and route tests (Vitest + Testing Library)
bun run test:coverage   # same, with a coverage report and minimum thresholds
bun run check           # lint + type check + tests with coverage (what CI runs)
```

Tests live in `src/test/`, one file per module:

| File | Covers |
| --- | --- |
| `aqi.test.ts` | AQI band boundaries, time labels, best-window search (min length, limits, fallback, midnight/month rollover), Open-Meteo parsing with a mocked API, place search |
| `impact.test.ts` | CO₂ and ₹ per mode, savings, dose, clean-air score, streaks across months |
| `family.test.ts` | Comfort threshold for every member type and intensity |
| `planner.test.ts` | Moving flexible routines, keeping fixed ones, dust avoided, ordering |
| `alerts.test.ts` | Alert only when air turns clean, 3-hour cooldown |
| `diary.test.ts` | Smoggy vs cleaner day averages |
| `store.test.ts` | Saving/reloading, corrupted data, cross-tab sync |
| `threads.test.ts` | Creating, titling, queuing and deleting chat threads |
| `share.test.ts` | Share message and WhatsApp link |
| `chat.server.test.ts` | Chat input validation, error responses, grounded instructions |
| `components.test.tsx` | AQI display, share buttons, alerts card and background alert watcher |
| `app-routing.test.tsx` | Every page URL resolves to its page |

CI (`.github/workflows/ci.yml`) runs lint, type check and tests with coverage on every push and pull request.

## Accessibility

Semantic headings and landmarks, labelled icon buttons, `aria-pressed` on toggle chips, visible focus rings, colour-coded levels always paired with a text label, and a responsive layout down to small phones.

## Development

```sh
bun install
bun run dev
```

Built with [Lovable](https://lovable.dev/projects/83875512-da36-468d-a0ea-13453c1683e1).
