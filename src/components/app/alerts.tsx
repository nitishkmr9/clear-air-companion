import { BellOff, BellRing } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { shouldNotify } from "@/lib/alerts";
import { aqiInfo } from "@/lib/aqi";
import { alertsStore, useAir } from "@/lib/store";

/** Mounted once in the app shell: watches live air and nudges when it turns clean. */
export function AlertWatcher() {
  const settings = alertsStore.use();
  const { data } = useAir();

  useEffect(() => {
    if (!settings.enabled || !data) return;
    const aqi = data.current.aqi;
    const current = alertsStore.get();
    if (current.lastAqi === aqi && current.lastNotifiedAt !== undefined) return;
    const now = Date.now();
    const notify = shouldNotify({
      prevAqi: current.lastAqi,
      aqi,
      threshold: current.threshold,
      lastNotifiedAt: current.lastNotifiedAt,
      now,
    });
    if (notify) {
      const title = "The air has cleared up 🌿";
      const body = `AQI in ${data.place} is now ${aqi} (${aqiInfo(aqi).label}). A lovely moment to step outside or open the windows.`;
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification(title, { body, icon: "/favicon.png" });
      }
      toast.success(title, { description: body });
    }
    alertsStore.set((prev) => ({
      ...prev,
      lastAqi: aqi,
      lastNotifiedAt: notify ? now : prev.lastNotifiedAt,
    }));
  }, [settings.enabled, data]);

  return null;
}

export function AlertsCard() {
  const settings = alertsStore.use();
  const { data } = useAir();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    setPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  }, []);

  const enable = async () => {
    let perm: NotificationPermission | "unsupported" = permission;
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      perm = await Notification.requestPermission();
      setPermission(perm);
    }
    alertsStore.set((prev) => ({ ...prev, enabled: true, lastAqi: data?.current.aqi }));
    toast.success(
      perm === "granted"
        ? "Alerts on — we'll ping you when the air clears."
        : "Alerts on — you'll see a message here when the air clears (browser notifications are blocked).",
    );
  };

  const isClean = data ? data.current.aqi <= settings.threshold : false;

  return (
    <section className="surface flex flex-col p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-sky text-sky-foreground">
          {settings.enabled ? <BellRing className="size-5" /> : <BellOff className="size-5" />}
        </span>
        <div>
          <p className="eyebrow">Clean-air alerts</p>
          <h3 className="font-display text-2xl leading-tight">
            {settings.enabled ? "We're watching the sky" : "Get a nudge when it clears"}
          </h3>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        A gentle notification the moment AQI drops to your chosen level — so you never miss a
        fresh-air window.
      </p>
      <label className="mt-4 flex items-center justify-between gap-3 text-sm text-foreground">
        Alert me at AQI
        <Select
          value={String(settings.threshold)}
          onValueChange={(v) => alertsStore.set((prev) => ({ ...prev, threshold: Number(v) }))}
        >
          <SelectTrigger className="w-40 rounded-full bg-card" aria-label="Alert threshold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="50">≤ 50 · Good</SelectItem>
            <SelectItem value="100">≤ 100 · Moderate</SelectItem>
            <SelectItem value="150">≤ 150 · Sensitive</SelectItem>
          </SelectContent>
        </Select>
      </label>
      {data && (
        <p className="mt-3 rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
          Right now: AQI {data.current.aqi} —{" "}
          {isClean ? "already at your level. Enjoy it!" : "we'll tell you when it gets there."}
        </p>
      )}
      <div className="mt-auto pt-4">
        {settings.enabled ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => alertsStore.set((prev) => ({ ...prev, enabled: false }))}
          >
            <BellOff /> Turn alerts off
          </Button>
        ) : (
          <Button variant="hero" className="w-full" onClick={enable}>
            <BellRing /> Turn on alerts
          </Button>
        )}
        <p className="mt-2 text-center text-[0.7rem] text-muted-foreground">
          Works while BreatheEasy is open in a tab. Free, no sign-up.
        </p>
      </div>
    </section>
  );
}
