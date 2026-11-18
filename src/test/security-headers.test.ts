// @vitest-environment node
import { describe, expect, it } from "vitest";

import { SECURITY_HEADERS, withSecurityHeaders } from "@/lib/security-headers";

describe("security headers", () => {
  it("adds every baseline header and keeps status and body", async () => {
    const res = withSecurityHeaders(new Response("hello", { status: 201 }));
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) expect(res.headers.get(k)).toBe(v);
    expect(res.status).toBe(201);
    expect(await res.text()).toBe("hello");
  });

  it("never blocks framing, so the editor preview keeps working", () => {
    const res = withSecurityHeaders(new Response(""));
    expect(res.headers.get("X-Frame-Options")).toBeNull();
  });

  it("does not overwrite a header a route already set", () => {
    const res = withSecurityHeaders(
      new Response("", { headers: { "Referrer-Policy": "no-referrer" } }),
    );
    expect(res.headers.get("Referrer-Policy")).toBe("no-referrer");
  });

  it("allows location (for 'use my location') but blocks camera and microphone", () => {
    const policy = SECURITY_HEADERS["Permissions-Policy"]!;
    expect(policy).toContain("geolocation=(self)");
    expect(policy).toContain("camera=()");
    expect(policy).toContain("microphone=()");
  });
});
