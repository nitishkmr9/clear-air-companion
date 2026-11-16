import { beforeEach, describe, expect, it, vi } from "vitest";

// Each test gets fresh store modules so the in-memory cache starts empty.
async function freshStore() {
  vi.resetModules();
  return import("@/lib/store");
}

beforeEach(() => localStorage.clear());

describe("browser-saved stores", () => {
  it("starts with defaults: New Delhi, no family, alerts off at AQI 100", async () => {
    const { placeStore, familyStore, alertsStore } = await freshStore();
    expect(placeStore.get().name).toBe("New Delhi, India");
    expect(familyStore.get()).toEqual([]);
    expect(alertsStore.get()).toEqual({ enabled: false, threshold: 100 });
  });

  it("saves changes to localStorage and reads them back after a reload", async () => {
    const first = await freshStore();
    first.placeStore.set({ name: "Mumbai, India", lat: 19.07, lon: 72.87 });
    expect(JSON.parse(localStorage.getItem("be.place")!)).toMatchObject({ name: "Mumbai, India" });

    const reloaded = await freshStore();
    expect(reloaded.placeStore.get().name).toBe("Mumbai, India");
  });

  it("supports updater functions", async () => {
    const { alertsStore } = await freshStore();
    alertsStore.set((prev) => ({ ...prev, enabled: true }));
    alertsStore.set((prev) => ({ ...prev, threshold: 50 }));
    expect(alertsStore.get()).toEqual({ enabled: true, threshold: 50 });
  });

  it("falls back to defaults when saved data is corrupted", async () => {
    localStorage.setItem("be.family", "{not json");
    const { familyStore } = await freshStore();
    expect(familyStore.get()).toEqual([]);
  });

  it("notifies subscribers and picks up changes made in another tab", async () => {
    const { placeStore } = await freshStore();
    const { renderHook, act } = await import("@testing-library/react");
    const { result } = renderHook(() => placeStore.use());
    expect(result.current.name).toBe("New Delhi, India");

    act(() => placeStore.set({ name: "Pune, India", lat: 18.5, lon: 73.8 }));
    expect(result.current.name).toBe("Pune, India");

    localStorage.setItem(
      "be.place",
      JSON.stringify({ name: "Kolkata, India", lat: 22.5, lon: 88.3 }),
    );
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "be.place" }));
    });
    expect(result.current.name).toBe("Kolkata, India");
  });

  it("todayKey is the local date as YYYY-MM-DD", async () => {
    const { todayKey } = await freshStore();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 5, 9, 30));
    expect(todayKey()).toBe("2026-01-05");
    vi.useRealTimers();
  });
});
