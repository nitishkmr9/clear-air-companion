import { describe, expect, it } from "vitest";

import { ALERT_COOLDOWN_MS, shouldNotify } from "@/lib/alerts";

describe("clean-air alerts", () => {
  const base = { threshold: 100, lastNotifiedAt: undefined, now: 1_000_000_000 };

  it("cooldown is 3 hours", () => {
    expect(ALERT_COOLDOWN_MS).toBe(3 * 60 * 60 * 1000);
  });
  it("alerts when AQI drops from above the threshold to at/below it", () => {
    expect(shouldNotify({ ...base, prevAqi: 140, aqi: 95 })).toBe(true);
    expect(shouldNotify({ ...base, prevAqi: 140, aqi: 100 })).toBe(true);
    expect(shouldNotify({ ...base, prevAqi: 101, aqi: 100 })).toBe(true);
  });
  it("does not alert when air was already clean, is still smoggy, or there is no previous reading", () => {
    expect(shouldNotify({ ...base, prevAqi: 80, aqi: 70 })).toBe(false);
    expect(shouldNotify({ ...base, prevAqi: 100, aqi: 70 })).toBe(false);
    expect(shouldNotify({ ...base, prevAqi: 180, aqi: 150 })).toBe(false);
    expect(shouldNotify({ ...base, prevAqi: undefined, aqi: 50 })).toBe(false);
  });
  it("waits 3 hours between alerts", () => {
    const now = base.now;
    expect(
      shouldNotify({ ...base, prevAqi: 140, aqi: 90, lastNotifiedAt: now - ALERT_COOLDOWN_MS + 1 }),
    ).toBe(false);
    expect(
      shouldNotify({ ...base, prevAqi: 140, aqi: 90, lastNotifiedAt: now - ALERT_COOLDOWN_MS }),
    ).toBe(true);
  });
});
