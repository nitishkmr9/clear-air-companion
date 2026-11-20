import type { UIMessage } from "ai";
import { BrainIcon, ChevronDownIcon } from "lucide-react";
import { memo, type ReactNode } from "react";
import { Streamdown } from "streamdown";

import logo from "@/assets/breatheeasy-logo.png";
import { cn } from "@/lib/utils";

/** One chat turn: user questions sit right in a bubble, guide replies sit left with the logo. */
export function ChatBubble({ role, children }: { role: UIMessage["role"]; children: ReactNode }) {
  const fromUser = role === "user";
  return (
    <div className={cn("flex w-full max-w-[95%] flex-col gap-2", fromUser && "ml-auto")}>
      {!fromUser && <img src={logo} alt="" width={28} height={28} className="size-7" />}
      <div
        className={cn(
          "flex w-fit min-w-0 max-w-full flex-col gap-2 overflow-hidden break-words text-[0.95rem] leading-relaxed [overflow-wrap:anywhere]",
          fromUser
            ? "ml-auto rounded-3xl rounded-br-md bg-chat-user px-4 py-3 text-chat-user-foreground"
            : "text-foreground",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Renders the guide's markdown; memoised so finished replies don't re-render while one streams. */
export const Markdown = memo(function Markdown({ text }: { text: string }) {
  return (
    <Streamdown className="size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      {text}
    </Streamdown>
  );
});

/** The guide's working-out: open while it thinks, folded away once the answer arrives. */
export function ThinkingNote({ text, thinking }: { text: string; thinking: boolean }) {
  return (
    <details className="group mb-2 text-sm text-muted-foreground" open={thinking}>
      <summary className="flex cursor-pointer list-none items-center gap-2 hover:text-foreground [&::-webkit-details-marker]:hidden">
        <BrainIcon className="size-4" aria-hidden />
        <span className={cn(thinking && "animate-pulse")}>
          {thinking ? "Thinking…" : "How I worked this out"}
        </span>
        <ChevronDownIcon
          className="size-4 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="mt-3">
        <Markdown text={text} />
      </div>
    </details>
  );
}

/** Text and reasoning parts of one message; tool and data parts are not shown. */
export function MessageParts({ message, streaming }: { message: UIMessage; streaming: boolean }) {
  return (
    <>
      {message.parts.map((part, i) => {
        if (part.type === "text") {
          return message.role === "assistant" ? (
            <Markdown key={i} text={part.text} />
          ) : (
            <p key={i} className="whitespace-pre-wrap">
              {part.text}
            </p>
          );
        }
        if (part.type === "reasoning" && part.text.trim()) {
          return <ThinkingNote key={i} text={part.text} thinking={streaming} />;
        }
        return null;
      })}
    </>
  );
}
