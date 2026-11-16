import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MessageSquarePlus } from "lucide-react";

import logo from "@/assets/breatheeasy-logo.png";
import { LevelPill } from "@/components/app/aqi-ui";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Button } from "@/components/ui/button";
import { useAir } from "@/lib/store";
import { createThread, STARTER_QUESTIONS } from "@/lib/threads";

export const Route = createFileRoute("/assistant/")({
  component: AssistantHome,
});

function AssistantHome() {
  const navigate = useNavigate();
  const { data, place } = useAir();
  const open = (q?: string) => {
    const id = createThread(q);
    navigate({ to: "/assistant/$threadId", params: { threadId: id } });
  };

  return (
    <div className="surface flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center gap-5 p-6 text-center md:p-12">
      <img
        src={logo}
        alt="BreatheEasy"
        width={96}
        height={96}
        className="size-24 animate-breathe"
      />
      <div>
        <h1 className="font-display text-4xl md:text-5xl">
          How can I help your family breathe easier?
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          I look at live air in {place.name} and your family's routines, then explain what each
          choice really changes.
        </p>
        {data && <LevelPill aqi={data.current.aqi} className="mt-4" />}
      </div>
      <Suggestions className="max-w-full">
        {STARTER_QUESTIONS.map((q) => (
          <Suggestion key={q} suggestion={q} onClick={open} className="rounded-full bg-card" />
        ))}
      </Suggestions>
      <Button variant="soft" onClick={() => open()}>
        <MessageSquarePlus /> Start a blank conversation
      </Button>
    </div>
  );
}
