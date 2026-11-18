import { afterEach, describe, expect, it, vi } from "vitest";

import {
  aqiInfo,
  cleanestIndex,
  clockLabel,
  dayLabel,
  fetchAirSnapshot,
  findWindows,
  hourLabel,
  searchPlaces,
  windowLabel,
} from "@/lib/aqi";

import { hour as h, openMeteoFetch } from "./fixtures";

afterEach(() => vi.unstubAllGlobals());

describe("AQI levels (US AQI bands)", () => {
  it.each([
    [0, "good"],
    [50, "good"],
    [51, "moderate"],
    [100, "moderate"],
    [101, "sensitive"],
    [150, "sensitive"],
    [151, "unhealthy"],
    [200, "unhealthy"],
    [201, "very"],
    [300, "very"],
    [301, "hazardous"],
    [999, "hazardous"],
  ])("AQI %i is %s", (aqi, level) => {
    expect(aqiInfo(aqi).level).toBe(level);
  });
});

describe("time labels", () => {
  it("formats hours on a 12-hour clock", () => {
    expect(hourLabel("2026-11-16T00:00")).toBe("12 AM");
    expect(hourLabel("2026-11-16T09:00")).toBe("9 AM");
    expect(hourLabel("2026-11-16T12:00")).toBe("12 PM");
    expect(hourLabel("2026-11-16T14:00")).toBe("2 PM");
  });

  it("formats an hour of day", () => {
    expect(clockLabel(0)).toBe("12 AM");
    expect(clockLabel(18)).toBe("6 PM");
  });

  it("calls same-date hours Today and later ones Tomorrow", () => {
    expect(dayLabel("2026-11-16T22:00", "2026-11-16T08:15")).toBe("Today");
    expect(dayLabel("2026-11-17T06:00", "2026-11-16T08:15")).toBe("Tomorrow");
  });

  it("builds a readable window label", () => {
    const { windows } = findWindows([h(14, 60), h(15, 70)], 100);
    expect(windowLabel(windows[0]!, "2026-11-16T08:00")).toBe("Today · 2 PM – 4 PM");
  });
});

describe("outdoor windows", () => {
  it("finds the cleanest contiguous window under the threshold", () => {
    const hours = [h(8, 180), h(9, 90), h(10, 80), h(11, 160), h(14, 60)];
    const { windows, relaxed } = findWindows(hours, 100, 1, 3);
    expect(relaxed).toBe(false);
    expect(windows[0]!.start).toBe("2026-11-16T14:00");
    expect(windows[1]).toMatchObject({
      start: "2026-11-16T09:00",
      end: "2026-11-16T11:00",
      hours: 2,
      avgAqi: 85,
      maxAqi: 90,
    });
  });

  it("ignores clean stretches shorter than the minimum length", () => {
    const hours = [h(8, 40), h(9, 180), h(10, 60), h(11, 70), h(12, 80)];
    const { windows } = findWindows(hours, 100, 2, 3);
    expect(windows).toHaveLength(1);
    expect(windows[0]).toMatchObject({ start: "2026-11-16T10:00", hours: 3 });
  });

  it("returns at most `limit` windows", () => {
    const hours = [h(8, 40), h(9, 180), h(10, 60), h(11, 180), h(12, 80)];
    expect(findWindows(hours, 100, 1, 2).windows).toHaveLength(2);
  });

  it("falls back to the least smoggy hours when nothing is under the threshold", () => {
    const { windows, relaxed } = findWindows([h(8, 250), h(9, 180), h(10, 220)], 100, 1, 1);
    expect(relaxed).toBe(true);
    expect(windows[0]!.avgAqi).toBe(180);
  });

  it("fallback windows never overlap", () => {
    const hours = [h(8, 250), h(9, 180), h(10, 190), h(11, 260), h(12, 200)];
    const { windows } = findWindows(hours, 100, 2, 3);
    for (let i = 0; i < windows.length; i++)
      for (let j = i + 1; j < windows.length; j++) {
        const a = windows[i]!;
        const b = windows[j]!;
        expect(a.end <= b.start || a.start >= b.end).toBe(true);
      }
  });

  it("rolls the end hour over midnight and month end", () => {
    expect(findWindows([h(23, 40)], 100).windows[0]!.end).toBe("2026-11-17T00:00");
    expect(findWindows([h(23, 40, 20, "2026-11-30")], 100).windows[0]!.end).toBe(
      "2026-12-01T00:00",
    );
  });

  it("handles an empty forecast", () => {
    expect(findWindows([], 100)).toEqual({ windows: [], relaxed: true });
  });
});

describe("cleanest saved place", () => {
  it("picks the lowest loaded AQI and skips places still loading", () => {
    expect(cleanestIndex([undefined, 120, 80, 95])).toBe(2);
  });
  it("keeps the first place on a tie", () => {
    expect(cleanestIndex([80, 80])).toBe(0);
  });
  it("is null until something has loaded", () => {
    expect(cleanestIndex([undefined, undefined])).toBeNull();
    expect(cleanestIndex([])).toBeNull();
  });
});

describe("fetchAirSnapshot (Open-Meteo)", () => {
  const place = { name: "New Delhi, India", lat: 28.6, lon: 77.2 };

  it("starts the forecast at the current hour and merges the weather", async () => {
    vi.stubGlobal("fetch", openMeteoFetch({ currentAqi: 180, hourlyAqi: [150, 160, 170, 175] }));
    const s = await fetchAirSnapshot(place);
    expect(s.place).toBe("New Delhi, India");
    expect(s.current).toMatchObject({ aqi: 180, pm25: 81.3, pm10: 140, no2: 31.1, co: 813 });
    expect(s.current).toMatchObject({ temp: 17.3, humidity: 71, wind: 5.6 });
    expect(s.hourly.map((x) => x.time)).toEqual(["2026-11-16T14:00", "2026-11-16T15:00"]);
    expect(s.hourly[0]).toMatchObject({ aqi: 170, pm25: 85, humidity: 70, temp: 17, wind: 5 });
  });

  it("skips hours without an AQI and caps the forecast at 36 hours", async () => {
    const hourlyAqi = Array.from({ length: 60 }, (_, i) => (i === 3 ? null : 100));
    vi.stubGlobal("fetch", openMeteoFetch({ currentAqi: 100, hourlyAqi }));
    const s = await fetchAirSnapshot(place);
    expect(s.hourly).toHaveLength(35);
    expect(s.hourly.some((x) => x.time === "2026-11-16T15:00")).toBe(false);
  });

  it("still works when the weather service is down", async () => {
    vi.stubGlobal(
      "fetch",
      openMeteoFetch({ currentAqi: 90, hourlyAqi: [90, 90, 90], weather: false }),
    );
    const s = await fetchAirSnapshot(place);
    expect(s.current.aqi).toBe(90);
    expect(s.current.temp).toBe(0);
    expect(s.hourly[0]!.humidity).toBeUndefined();
  });

  it("throws a friendly error when the air service is down", async () => {
    vi.stubGlobal("fetch", openMeteoFetch({ currentAqi: 90, hourlyAqi: [90], airOk: false }));
    await expect(fetchAirSnapshot(place)).rejects.toThrow(/unavailable/);
  });
});

describe("searchPlaces", () => {
  it("does not search for fewer than 2 characters", async () => {
    const fetch = openMeteoFetch({ currentAqi: 0, hourlyAqi: [] });
    vi.stubGlobal("fetch", fetch);
    expect(await searchPlaces(" a ")).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("joins city, region and country into one name", async () => {
    vi.stubGlobal("fetch", openMeteoFetch({ currentAqi: 0, hourlyAqi: [] }));
    expect(await searchPlaces("Pun")).toEqual([
      { name: "Pune, Maharashtra, India", lat: 18.52, lon: 73.86 },
      { name: "Puno, Peru", lat: -15.8, lon: -70.0 },
    ]);
  });

  it("returns nothing when the search service fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, json: async () => ({}) })),
    );
    expect(await searchPlaces("Delhi")).toEqual([]);
  });
});
