// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Member } from "@/lib/family";
import { bodySchema, buildInstructions, friendlyError, handleChat } from "@/lib/chat.server";

import { hour, snapshot } from "./fixtures";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const validBody = {
  threadId: "t1",
  messages: [{ id: "m1", role: "user", parts: [{ type: "text", text: "Can my kid play?" }] }],
  place: { name: "New Delhi, India", lat: 28.6, lon: 77.2 },
  family: [],
};
const post = (body: unknown) =>
  new Request("http://localhost/api/chat", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

describe("chat request validation", () => {
  it("accepts a well-formed request", () => {
    expect(bodySchema.safeParse(validBody).success).toBe(true);
  });
  it("rejects unknown member types, empty chats and too many family members", () => {
    const member = { id: "1", name: "A", kind: "alien", routines: [] };
    expect(bodySchema.safeParse({ ...validBody, family: [member] }).success).toBe(false);
    expect(bodySchema.safeParse({ ...validBody, messages: [] }).success).toBe(false);
    const many = Array.from({ length: 21 }, (_, i) => ({
      id: `${i}`,
      name: "A",
      kind: "adult",
      routines: [],
    }));
    expect(bodySchema.safeParse({ ...validBody, family: many }).success).toBe(false);
  });
});

describe("handleChat", () => {
  it("answers 500 when the AI key is missing", async () => {
    vi.stubEnv("LOVABLE_API_KEY", "");
    const res = await handleChat(post(validBody));
    expect(res.status).toBe(500);
  });

  it("answers 400 for an unreadable message", async () => {
    vi.stubEnv("LOVABLE_API_KEY", "test-key");
    expect((await handleChat(post("{oops"))).status).toBe(400);
    expect((await handleChat(post({ hello: "world" }))).status).toBe(400);
  });

  it("answers 503 with a kind message when live air data is unreachable", async () => {
    vi.stubEnv("LOVABLE_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const res = await handleChat(post(validBody));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/live air quality/);
  });
});

describe("friendly AI errors", () => {
  it("maps rate limits, credits and access to plain messages", () => {
    expect(friendlyError({ statusCode: 429 })).toMatch(/try again in a moment/);
    expect(friendlyError({ statusCode: 402 })).toMatch(/credits/);
    expect(friendlyError({ statusCode: 403 })).toMatch(/restricted/);
    expect(friendlyError(new Error("boom"))).toMatch(/Something went wrong/);
  });
});

describe("assistant instructions", () => {
  const air = snapshot(180, [hour(8, 180), hour(14, 70), hour(15, 80), hour(18, 210)]);

  it("ground the answer in the live numbers and ask for direct impact", () => {
    const text = buildInstructions(air, []);
    expect(text).toContain("Current: AQI 180 (Unhealthy), PM2.5 90");
    expect(text).toContain("today 2 PM: AQI 70");
    expect(text).toContain("ALWAYS EXPLAIN DIRECT IMPACT");
    expect(text).toContain("No family members added yet");
  });

  it("include each family member's routines and comfort threshold", () => {
    const kid: Member = {
      id: "k",
      name: "Aarav",
      kind: "child",
      age: 7,
      routines: [
        { id: "r", label: "Cricket", hour: 17, minutes: 60, intensity: "vigorous", flexible: true },
      ],
    };
    const text = buildInstructions(air, [kid]);
    expect(text).toContain("- Aarav: Child, age 7");
    expect(text).toContain("Cricket (usually 5 PM, 60 min, vigorous, flexible)");
    expect(text).toContain("Comfort threshold AQI ≤ 50");
    expect(text).toContain("No hour meets it");
  });
});
