import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AlertsCard, AlertWatcher } from "@/components/app/alerts";
import { AirError, AqiRing, HourlyStrip, LevelPill } from "@/components/app/aqi-ui";
import { ShareAir } from "@/components/app/share";
import { alertsStore } from "@/lib/store";

import { hour, openMeteoFetch, snapshot } from "./fixtures";

const toast = vi.hoisted(() => Object.assign(vi.fn(), { success: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

function withQuery(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  toast.mockClear();
  toast.success.mockClear();
  alertsStore.set({ enabled: false, threshold: 100 });
});
afterEach(() => vi.unstubAllGlobals());

describe("air level display", () => {
  it("shows the AQI number and its level name", () => {
    render(
      <>
        <AqiRing aqi={168} />
        <LevelPill aqi={168} />
      </>,
    );
    expect(screen.getByText("168")).toBeInTheDocument();
    expect(screen.getByText("Unhealthy")).toBeInTheDocument();
  });

  it("labels the first forecast hour as Now", () => {
    render(<HourlyStrip hours={[hour(14, 90), hour(15, 120)]} />);
    expect(screen.getByText("Now")).toBeInTheDocument();
    expect(screen.getByText("3PM")).toBeInTheDocument();
  });

  it("lets the user retry when the air service is down", () => {
    const onRetry = vi.fn();
    render(<AirError onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe("share buttons", () => {
  const data = snapshot(120, [hour(14, 70)]);

  it("copies today's air message", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText }, share: undefined });
    render(<ShareAir data={data} />);
    fireEvent.click(screen.getByRole("button", { name: /copy/i }));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(writeText.mock.calls[0]![0]).toContain("AQI 120");
  });

  it("tells the user when copying is blocked", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText }, share: undefined });
    render(<ShareAir data={data} />);
    fireEvent.click(screen.getByRole("button", { name: /^share$/i }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.stringMatching(/Couldn't copy/)));
  });

  it("uses the phone's share sheet when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, share });
    render(<ShareAir data={data} />);
    fireEvent.click(screen.getByRole("button", { name: /^share$/i }));
    await waitFor(() => expect(share).toHaveBeenCalledOnce());
    expect(share.mock.calls[0]![0]).toMatchObject({ title: "Today's air" });
  });

  it("opens WhatsApp with the message", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    render(<ShareAir data={data} />);
    fireEvent.click(screen.getByRole("button", { name: /whatsapp/i }));
    expect(open.mock.calls[0]![0]).toMatch(/^https:\/\/api\.whatsapp\.com\/send\?text=.*AQI%20120/);
    open.mockRestore();
  });
});

describe("clean-air alerts", () => {
  it("turning alerts on saves the setting and today's AQI", async () => {
    vi.stubGlobal("fetch", openMeteoFetch({ currentAqi: 140, hourlyAqi: [140, 140, 140] }));
    withQuery(<AlertsCard />);
    await screen.findByText(/Right now: AQI 140/);
    fireEvent.click(screen.getByRole("button", { name: /turn on alerts/i }));
    await waitFor(() => expect(alertsStore.get()).toMatchObject({ enabled: true, lastAqi: 140 }));
    expect(screen.getByRole("button", { name: /turn alerts off/i })).toBeInTheDocument();
  });

  it("nudges the family when the air drops to the chosen level", async () => {
    alertsStore.set({ enabled: true, threshold: 100, lastAqi: 180 });
    vi.stubGlobal("fetch", openMeteoFetch({ currentAqi: 80, hourlyAqi: [80, 80, 80] }));
    withQuery(<AlertWatcher />);
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "The air has cleared up 🌿",
        expect.objectContaining({ description: expect.stringContaining("AQI in New Delhi") }),
      ),
    );
    expect(alertsStore.get()).toMatchObject({ lastAqi: 80 });
    expect(alertsStore.get().lastNotifiedAt).toBeTypeOf("number");
  });

  it("stays quiet when alerts are off", async () => {
    alertsStore.set({ enabled: false, threshold: 100, lastAqi: 180 });
    const fetch = openMeteoFetch({ currentAqi: 80, hourlyAqi: [80, 80, 80] });
    vi.stubGlobal("fetch", fetch);
    withQuery(<AlertWatcher />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    await act(() => new Promise((r) => setTimeout(r, 20)));
    expect(toast.success).not.toHaveBeenCalled();
  });
});
