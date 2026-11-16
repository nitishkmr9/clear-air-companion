import { describe, expect, it } from "vitest";

import { shareText, whatsappUrl } from "@/lib/share";

import { hour, snapshot } from "./fixtures";

describe("share today's air", () => {
  it("includes the place, AQI, level, advice, best time and link", () => {
    const text = shareText(
      snapshot(180, [hour(8, 180), hour(14, 70), hour(15, 80)]),
      "https://breathe.example",
    );
    expect(text).toContain(
      "Air in New Delhi, India right now: AQI 180 (Unhealthy) · PM2.5 90 µg/m³",
    );
    expect(text).toContain("Keep outdoor time brief");
    expect(text).toContain("Best time outside: Today · 2 PM – 4 PM (avg AQI 75)");
    expect(text.endsWith("Check yours on BreatheEasy: https://breathe.example")).toBe(true);
  });

  it("says 'Gentlest' when no hour is under AQI 100", () => {
    const text = shareText(snapshot(250, [hour(8, 250), hour(9, 210)]), "https://x.test");
    expect(text).toContain("Gentlest time outside: Today · 9 AM – 10 AM (avg AQI 210)");
  });

  it("leaves out the time line when there is no forecast", () => {
    const text = shareText(snapshot(40, []), "https://x.test");
    expect(text).not.toContain("time outside");
    expect(text.split("\n")).toHaveLength(3);
  });

  it("builds an encoded WhatsApp link", () => {
    expect(whatsappUrl("AQI 80 & calm")).toBe(
      "https://api.whatsapp.com/send?text=AQI%2080%20%26%20calm",
    );
  });
});
