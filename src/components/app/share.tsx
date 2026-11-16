import { Copy, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { AirSnapshot } from "@/lib/aqi";
import { shareText, whatsappUrl } from "@/lib/share";

export function ShareAir({ data }: { data: AirSnapshot }) {
  const text = () => shareText(data, window.location.origin);

  const whatsapp = () => {
    window.open(whatsappUrl(text()), "_blank", "noopener");
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text());
      toast.success("Copied — paste it into any chat.");
    } catch {
      toast("Couldn't copy automatically on this browser.");
    }
  };
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Today's air", text: text() });
      } catch {
        /* user closed the share sheet */
      }
    } else {
      await copy();
    }
  };

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Share today's air">
      <Button size="sm" variant="hero" onClick={whatsapp}>
        <MessageCircle aria-hidden="true" /> Share on WhatsApp
      </Button>
      <Button size="sm" variant="soft" onClick={share}>
        <Share2 aria-hidden="true" /> Share
      </Button>
      <Button size="sm" variant="ghost" onClick={copy}>
        <Copy aria-hidden="true" /> Copy
      </Button>
    </div>
  );
}
