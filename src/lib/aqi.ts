// Air quality + weather data from Open-Meteo (free, no API key, CORS-enabled).
// Works in the browser and on the server (plain fetch).

export type AqiLevel = "good" | "moderate" | "sensitive" | "unhealthy" | "very" | "hazardous";

export interface HourPoint {
  time: string; // local ISO "2026-11-16T14:00"
  aqi: number;
  pm25: number;
  pm10: number;
  humidity?: number;
  wind?: number;
  temp?: number;
}

export interface AirSnapshot {
  place: string;
  lat: number;
  lon: number;
  timezone: string;
  current: {
    time: string;
    aqi: number;
    pm25: number;
    pm10: number;
    no2: number;
    o3: number;
    co: number;
    temp: number;
    humidity: number;
    wind: number;
  };
  hourly: HourPoint[]; // next ~36 hours starting at the current hour
}

export interface Place {
  name: string;
  lat: number;
  lon: number;
}

export const DEFAULT_PLACE: Place = { name: "New Delhi, India", lat: 28.6139, lon: 77.209 };

export const AQI_LEVELS: {
  level: AqiLevel;
  max: number;
  label: string;
  short: string;
  advice: string;
}[] = [
  {
    level: "good",
    max: 50,
    label: "Good",
    short: "Fresh air",
    advice: "A lovely day to be outside. Open the windows and enjoy.",
  },
  {
    level: "moderate",
    max: 100,
    label: "Moderate",
    short: "Mostly fine",
    advice: "Fine for most people. Very sensitive folks may keep strenuous play shorter.",
  },
  {
    level: "sensitive",
    max: 150,
    label: "Sensitive groups",
    short: "Take it easy",
    advice: "Kids, elders and anyone with asthma do better with shorter, gentler time outside.",
  },
  {
    level: "unhealthy",
    max: 200,
    label: "Unhealthy",
    short: "Limit time out",
    advice: "Keep outdoor time brief and relaxed. Indoor activities are a kind choice today.",
  },
  {
    level: "very",
    max: 300,
    label: "Very unhealthy",
    short: "Stay in mostly",
    advice: "Best to stay indoors with windows closed. Plan errands for the cleanest window.",
  },
  {
    level: "hazardous",
    max: Infinity,
    label: "Hazardous",
    short: "Rest indoors",
    advice: "Stay indoors, run a purifier if you have one, and wear an N95 if you must step out.",
  },
];

export function aqiInfo(aqi: number) {
  return AQI_LEVELS.find((l) => aqi <= l.max) ?? AQI_LEVELS[AQI_LEVELS.length - 1]!;
}

/** Tailwind classes per level, all from design tokens. */
export const LEVEL_CLASSES: Record<
  AqiLevel,
  { text: string; bg: string; soft: string; ring: string }
> = {
  good: {
    text: "text-aqi-good",
    bg: "bg-aqi-good",
    soft: "bg-aqi-good-soft",
    ring: "stroke-aqi-good",
  },
  moderate: {
    text: "text-aqi-moderate",
    bg: "bg-aqi-moderate",
    soft: "bg-aqi-moderate-soft",
    ring: "stroke-aqi-moderate",
  },
  sensitive: {
    text: "text-aqi-sensitive",
    bg: "bg-aqi-sensitive",
    soft: "bg-aqi-sensitive-soft",
    ring: "stroke-aqi-sensitive",
  },
  unhealthy: {
    text: "text-aqi-unhealthy",
    bg: "bg-aqi-unhealthy",
    soft: "bg-aqi-unhealthy-soft",
    ring: "stroke-aqi-unhealthy",
  },
  very: {
    text: "text-aqi-very",
    bg: "bg-aqi-very",
    soft: "bg-aqi-very-soft",
    ring: "stroke-aqi-very",
  },
  hazardous: {
    text: "text-aqi-hazardous",
    bg: "bg-aqi-hazardous",
    soft: "bg-aqi-hazardous-soft",
    ring: "stroke-aqi-hazardous",
  },
};

/** "Moderate or better": the everyday comfort line for general clean-air windows. */
export const CLEAN_AQI = 100;
/** Forecast hours we plan around. */
export const FORECAST_HOURS = 24;

/** The next day of hourly forecast. */
export function nextDay(hours: HourPoint[]) {
  return hours.slice(0, FORECAST_HOURS);
}

export interface Window {
  start: string;
  end: string; // exclusive end hour
  hours: number;
  avgAqi: number;
  maxAqi: number;
}

/**
 * Find contiguous windows (at least `minHours` long) where AQI stays at or under `threshold`.
 * If none exist, return the cleanest `minHours`-long stretches instead (flagged by `relaxed`).
 */
export function findWindows(
  hours: HourPoint[],
  threshold: number,
  minHours = 1,
  limit = 3,
): { windows: Window[]; relaxed: boolean } {
  const windows: Window[] = [];
  let run: HourPoint[] = [];
  const flush = () => {
    if (run.length >= minHours) windows.push(toWindow(run));
    run = [];
  };
  for (const h of hours) {
    if (h.aqi <= threshold) run.push(h);
    else flush();
  }
  flush();
  if (windows.length > 0) {
    return { windows: windows.sort((a, b) => a.avgAqi - b.avgAqi).slice(0, limit), relaxed: false };
  }
  // Fallback: cleanest sliding windows, non-overlapping.
  const candidates: Window[] = [];
  for (let i = 0; i + minHours <= hours.length; i++) {
    candidates.push(toWindow(hours.slice(i, i + minHours)));
  }
  candidates.sort((a, b) => a.avgAqi - b.avgAqi);
  const picked: Window[] = [];
  for (const c of candidates) {
    if (picked.every((p) => c.end <= p.start || c.start >= p.end)) picked.push(c);
    if (picked.length >= limit) break;
  }
  return { windows: picked, relaxed: true };
}

function toWindow(run: HourPoint[]): Window {
  const last = run[run.length - 1]!;
  const end = addHour(last.time);
  const sum = run.reduce((s, h) => s + h.aqi, 0);
  return {
    start: run[0]!.time,
    end,
    hours: run.length,
    avgAqi: Math.round(sum / run.length),
    maxAqi: Math.max(...run.map((h) => h.aqi)),
  };
}

function addHour(localIso: string) {
  const [d = "", t = "00:00"] = localIso.split("T");
  const hour = Number(t.slice(0, 2)) + 1;
  if (hour < 24) return `${d}T${String(hour).padStart(2, "0")}:00`;
  const dt = new Date(`${d}T00:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + 1);
  return `${dt.toISOString().slice(0, 10)}T00:00`;
}

/** "2026-11-16T14:00" -> "2 PM" */
export function hourLabel(localIso: string) {
  const h = Number(localIso.slice(11, 13));
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${suffix}`;
}

/** Hour of day 0–23 -> "6 PM" */
export function clockLabel(hour: number) {
  return hourLabel(`2000-01-01T${String(hour).padStart(2, "0")}:00`);
}

export function dayLabel(localIso: string, todayIso: string) {
  return localIso.slice(0, 10) === todayIso.slice(0, 10) ? "Today" : "Tomorrow";
}

export function windowLabel(w: Window, todayIso: string) {
  return `${dayLabel(w.start, todayIso)} · ${hourLabel(w.start)} – ${hourLabel(w.end)}`;
}

export async function fetchAirSnapshot(place: Place): Promise<AirSnapshot> {
  const aqUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${place.lat}&longitude=${place.lon}` +
    `&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone,carbon_monoxide` +
    `&hourly=us_aqi,pm2_5,pm10&timezone=auto&forecast_days=3`;
  const wxUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m` +
    `&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto&forecast_days=3`;

  const [aqRes, wxRes] = await Promise.all([fetch(aqUrl), fetch(wxUrl)]);
  if (!aqRes.ok) throw new Error("Air quality service is unavailable right now.");
  const aq = await aqRes.json();
  const wx = wxRes.ok ? await wxRes.json() : null;

  const currentTime: string = aq.current.time;
  const currentHour = currentTime.slice(0, 13) + ":00";
  const times: string[] = aq.hourly.time;
  const startIdx = Math.max(0, times.indexOf(currentHour));
  const wxIndex = new Map<string, number>();
  (wx?.hourly?.time ?? []).forEach((t: string, i: number) => wxIndex.set(t, i));

  const hourly: HourPoint[] = [];
  for (let i = startIdx; i < Math.min(times.length, startIdx + 36); i++) {
    const aqi = aq.hourly.us_aqi[i];
    if (aqi == null) continue;
    const time = times[i]!;
    const wi = wxIndex.get(time);
    hourly.push({
      time,
      aqi: Math.round(aqi),
      pm25: round1(aq.hourly.pm2_5[i] ?? 0),
      pm10: round1(aq.hourly.pm10[i] ?? 0),
      humidity: wi != null ? wx.hourly.relative_humidity_2m[wi] : undefined,
      wind: wi != null ? wx.hourly.wind_speed_10m[wi] : undefined,
      temp: wi != null ? wx.hourly.temperature_2m[wi] : undefined,
    });
  }

  return {
    place: place.name,
    lat: place.lat,
    lon: place.lon,
    timezone: aq.timezone,
    current: {
      time: currentTime,
      aqi: Math.round(aq.current.us_aqi ?? hourly[0]?.aqi ?? 0),
      pm25: round1(aq.current.pm2_5 ?? 0),
      pm10: round1(aq.current.pm10 ?? 0),
      no2: round1(aq.current.nitrogen_dioxide ?? 0),
      o3: round1(aq.current.ozone ?? 0),
      co: Math.round(aq.current.carbon_monoxide ?? 0),
      temp: round1(wx?.current?.temperature_2m ?? 0),
      humidity: Math.round(wx?.current?.relative_humidity_2m ?? 0),
      wind: round1(wx?.current?.wind_speed_10m ?? 0),
    },
    hourly,
  };
}

export async function searchPlaces(query: string): Promise<Place[]> {
  if (query.trim().length < 2) return [];
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`,
  );
  if (!res.ok) return [];
  const json = await res.json();
  return (json.results ?? []).map(
    (r: {
      name: string;
      admin1?: string;
      country?: string;
      latitude: number;
      longitude: number;
    }) => ({
      name: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
      lat: r.latitude,
      lon: r.longitude,
    }),
  );
}

/** Index of the lowest AQI among loaded readings (undefined = still loading), or null if none loaded. */
export function cleanestIndex(aqis: (number | undefined)[]): number | null {
  let best: number | null = null;
  aqis.forEach((aqi, i) => {
    if (aqi === undefined) return;
    const bestAqi = best === null ? undefined : aqis[best];
    if (bestAqi === undefined || aqi < bestAqi) best = i;
  });
  return best;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/** Times of the hours that fall inside any of the windows (used to outline them on charts). */
export function hoursInWindows(hours: HourPoint[], windows: Window[]) {
  return new Set(
    hours.filter((h) => windows.some((w) => h.time >= w.start && h.time < w.end)).map((h) => h.time),
  );
}
