import { useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import type { UIMessage } from "ai";

import { DEFAULT_PLACE, fetchAirSnapshot, type Place } from "./aqi";
import type { Member } from "./family";
import type { TransportMode } from "./impact";

/** Tiny localStorage-backed store; SSR renders the initial value, the client swaps in saved data after hydration. */
function createStore<T>(key: string, initial: T) {
  let cache: T | undefined;
  const listeners = new Set<() => void>();

  const read = (): T => {
    if (cache !== undefined) return cache;
    try {
      const raw = window.localStorage.getItem(key);
      cache = raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      cache = initial;
    }
    return cache;
  };

  const set = (next: T | ((prev: T) => T)) => {
    const value = typeof next === "function" ? (next as (p: T) => T)(read()) : next;
    cache = value;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or unavailable */
    }
    listeners.forEach((l) => l());
  };

  const subscribe = (l: () => void) => {
    listeners.add(l);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        cache = undefined;
        l();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(l);
      window.removeEventListener("storage", onStorage);
    };
  };

  const use = () => useSyncExternalStore(subscribe, read, () => initial);
  return { use, set, get: read };
}

export const placeStore = createStore<Place>("be.place", DEFAULT_PLACE);
export const familyStore = createStore<Member[]>("be.family", []);

export interface ImpactEntry {
  id: string;
  date: string; // YYYY-MM-DD
  kind: "trip" | "shift" | "indoor";
  label: string;
  mode?: TransportMode;
  co2Kg: number;
  money: number;
  doseUg: number;
}
export const impactStore = createStore<ImpactEntry[]>("be.impact", []);

export interface Thread {
  id: string;
  title: string;
  updatedAt: number;
  messages: UIMessage[];
}
export const threadStore = createStore<Thread[]>("be.threads", []);

export const indoorChecksStore = createStore<Record<string, boolean>>("be.indoor", {});

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useAir() {
  const place = placeStore.use();
  const query = useQuery({
    queryKey: ["air", place.lat, place.lon],
    queryFn: () => fetchAirSnapshot(place),
    staleTime: 10 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
    retry: 1,
  });
  return { place, ...query };
}

export interface Trip {
  id: string;
  label: string;
  km: number;
  mode: import("./impact").TransportMode;
  riders: number;
}
export const tripStore = createStore<Trip[]>("be.trips", [
  { id: "t-school", label: "School drop-off", km: 6, mode: "carpool", riders: 3 },
  { id: "t-work", label: "Office commute", km: 12, mode: "metro", riders: 1 },
]);

export interface SavedPlace extends Place {
  id: string;
  label: string; // "Home", "School"…
}
export const savedPlacesStore = createStore<SavedPlace[]>("be.places", []);

export interface AlertSettings {
  enabled: boolean;
  threshold: number;
  lastAqi?: number | undefined;
  lastNotifiedAt?: number | undefined;
}
export const alertsStore = createStore<AlertSettings>("be.alerts", {
  enabled: false,
  threshold: 100,
});

export type Symptom =
  "cough" | "wheeze" | "breathless" | "sore-throat" | "itchy-eyes" | "headache" | "tired";
export interface DiaryEntry {
  id: string;
  at: number; // epoch ms
  date: string; // YYYY-MM-DD local
  who: string; // member name or "Me"
  symptoms: Symptom[];
  severity: 1 | 2 | 3;
  note?: string | undefined;
  aqi?: number | undefined;
  pm25?: number | undefined;
  place?: string | undefined;
}
export const diaryStore = createStore<DiaryEntry[]>("be.diary", []);
