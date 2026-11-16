import { vi } from "vitest";

import type { AirSnapshot, HourPoint } from "@/lib/aqi";

/** One forecast hour on 2026-11-16 (or a later day via `day`). PM2.5 defaults to AQI / 2. */
export const hour = (h: number, aqi: number, pm25 = aqi / 2, day = "2026-11-16"): HourPoint => ({
  time: `${day}T${String(h).padStart(2, "0")}:00`,
  aqi,
  pm25,
  pm10: aqi,
});

export function snapshot(
  aqi: number,
  hourly: HourPoint[],
  place = "New Delhi, India",
): AirSnapshot {
  return {
    place,
    lat: 28.6,
    lon: 77.2,
    timezone: "Asia/Kolkata",
    current: {
      time: hourly[0]?.time ?? "2026-11-16T08:00",
      aqi,
      pm25: aqi / 2,
      pm10: aqi,
      no2: 20,
      o3: 30,
      co: 400,
      temp: 18,
      humidity: 60,
      wind: 6,
    },
    hourly,
  };
}

const json = (body: unknown, ok = true) =>
  ({ ok, status: ok ? 200 : 500, json: async () => body }) as Response;

/**
 * Fake Open-Meteo: hourly AQI values start at 2026-11-16T12:00, the "current" reading is at 14:15.
 * Pass `weather: false` to make the weather API fail.
 */
export function openMeteoFetch(opts: {
  currentAqi: number;
  hourlyAqi: (number | null)[];
  airOk?: boolean;
  weather?: boolean;
}) {
  const times = opts.hourlyAqi.map((_, i) => {
    const d = new Date(Date.UTC(2026, 10, 16, 12 + i));
    return d.toISOString().slice(0, 13) + ":00";
  });
  return vi.fn(async (url: string | URL) => {
    const u = String(url);
    if (u.includes("air-quality-api")) {
      if (opts.airOk === false) return json({}, false);
      return json({
        timezone: "Asia/Kolkata",
        current: {
          time: "2026-11-16T14:15",
          us_aqi: opts.currentAqi + 0.4,
          pm2_5: 81.26,
          pm10: 140.04,
          nitrogen_dioxide: 31.11,
          ozone: 12.34,
          carbon_monoxide: 812.6,
        },
        hourly: {
          time: times,
          us_aqi: opts.hourlyAqi,
          pm2_5: opts.hourlyAqi.map((a) => (a == null ? null : a / 2)),
          pm10: opts.hourlyAqi,
        },
      });
    }
    if (u.includes("api.open-meteo.com/v1/forecast")) {
      if (opts.weather === false) return json({}, false);
      return json({
        current: { temperature_2m: 17.26, relative_humidity_2m: 71.4, wind_speed_10m: 5.56 },
        hourly: {
          time: times,
          temperature_2m: times.map(() => 17),
          relative_humidity_2m: times.map(() => 70),
          wind_speed_10m: times.map(() => 5),
        },
      });
    }
    if (u.includes("geocoding-api")) {
      return json({
        results: [
          {
            name: "Pune",
            admin1: "Maharashtra",
            country: "India",
            latitude: 18.52,
            longitude: 73.86,
          },
          { name: "Puno", country: "Peru", latitude: -15.8, longitude: -70.0 },
        ],
      });
    }
    throw new Error(`Unexpected fetch ${u}`);
  });
}
