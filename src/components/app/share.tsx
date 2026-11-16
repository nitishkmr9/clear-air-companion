import { Copy, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { aqiInfo, findWindows, windowLabel, type AirSnapshot } from "@/lib/aqi";

function shareText(data: AirSnapshot) {
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
    `Check yours on BreatheEasy: ${window.location.origin}`,
  ];
  return lines.filter(Boolean).join("\n");
}

export function ShareAir({ data }: { data: AirSnapshot }) {
  const whatsapp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText(data))}`, "_blank", "noopener");
  };
  const share = async () => {
    const text = shareText(data);
    if (navigator.share) {
      try {
        await navigator.share({ title: "Today's air", text });
      } catch {
        /* user closed the share sheet */
      }
    } else {
      await copy();
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareText(data));
      toast.success("Copied — paste it into any chat.");
    } catch {
      toast("Couldn't copy automatically on this browser.");
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="hero" onClick={whatsapp}>
        <MessageCircle /> Share on WhatsApp
      </Button>
      <Button size="sm" variant="soft" onClick={share}>
        <Share2 /> Share
      </Button>
      <Button size="sm" variant="ghost" onClick={copy}>
        <Copy /> Copy
      </Button>
    </div>
  );
}
