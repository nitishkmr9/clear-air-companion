import { describe, expect, it } from "vitest";

import { dateKey, greeting, lastDays } from "@/lib/dates";

describe("dates", () => {
  it("formats a local date as YYYY-MM-DD", () => {
    expect(dateKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
  it("lists the last 14 days oldest first, ending today, across a month boundary", () => {
    const days = lastDays(14, new Date(2026, 11, 3, 10));
    expect(days).toHaveLength(14);
    expect(days[0]).toBe("2026-11-20");
    expect(days.at(-1)).toBe("2026-12-03");
  });
  it("greets by the place's local hour", () => {
    expect(greeting(undefined)).toBe("Hello");
    expect(greeting("2026-11-16T06:00")).toBe("Good morning");
    expect(greeting("2026-11-16T11:00")).toBe("Good morning");
    expect(greeting("2026-11-16T12:00")).toBe("Good afternoon");
    expect(greeting("2026-11-16T16:00")).toBe("Good afternoon");
    expect(greeting("2026-11-16T17:00")).toBe("Good evening");
  });
});
