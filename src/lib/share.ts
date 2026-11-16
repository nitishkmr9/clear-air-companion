import { aqiInfo, findWindows, windowLabel, type AirSnapshot } from "./aqi";

/** Plain-text message describing today's air, ready for WhatsApp or any chat. */
export function shareText(data: AirSnapshot, origin: string) {
  const c = data.current;
  const info = aqiInfo(c.aqi);
  const best = findWindows(data.hourly.slice(0, 24), 100, 1, 1);
  const w = best.windows[0];
  const lines = [
    `🌿 Air in ${data.place} right now: AQI ${c.aqi} (${info.label}) · PM2.5 ${c.pm25} µg/m³`,
    info.advice,
    w
      ? `${best.relaxed ? "Gentlest" : "Best"} time outside: ${windowLabel(w, c.time)} (avg AQI ${w.avgAqi})`
      : "",
    `Check yours on BreatheEasy: ${origin}`,
  ];
  return lines.filter(Boolean).join("\n");
}

export function whatsappUrl(text: string) {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}
