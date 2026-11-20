import { useNavigate } from "@tanstack/react-router";
import { MessageCircleHeart } from "lucide-react";

import { createThread, STARTER_QUESTIONS } from "@/lib/threads";

const SHOWN = 3;

/** Shortcut questions that open a new chat with the question already asked. */
export function AskCard() {
  const navigate = useNavigate();
  const ask = (q: string) => {
    const id = createThread(q);
    void navigate({ to: "/assistant/$threadId", params: { threadId: id } });
  };

  return (
    <section className="animate-rise rounded-3xl bg-chat-user p-6 text-chat-user-foreground shadow-lift [animation-delay:260ms]">
      <MessageCircleHeart className="size-7" aria-hidden />
      <h3 className="mt-3 font-display text-3xl">Wondering about something?</h3>
      <p className="mt-1 text-sm opacity-80">Ask in plain words — answers use today's live air.</p>
      <div className="mt-4 flex flex-col gap-2">
        {STARTER_QUESTIONS.slice(0, SHOWN).map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => ask(q)}
            className="rounded-2xl border border-chat-user-foreground/20 px-4 py-2.5 text-left text-sm transition-colors hover:bg-chat-user-foreground/10"
          >
            {q}
          </button>
        ))}
      </div>
    </section>
  );
}
