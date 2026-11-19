import { ArrowUpIcon, SquareIcon } from "lucide-react";
import { useState, type KeyboardEvent, type Ref } from "react";

import { Button } from "@/components/ui/button";
import { MAX_TEXT_CHARS } from "@/lib/chat-limits";

type ChatComposerProps = {
  /** True while a reply is on its way; the send button becomes a stop button. */
  busy: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  textareaRef?: Ref<HTMLTextAreaElement>;
};

/** Question box: Enter sends, Shift+Enter adds a new line. */
export function ChatComposer({ busy, onSend, onStop, textareaRef }: ChatComposerProps) {
  const [text, setText] = useState("");

  const send = () => {
    const question = text.trim();
    if (!question || busy) return;
    onSend(question);
    setText("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    send();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      className="flex items-end gap-2 rounded-3xl border border-border bg-card p-2 shadow-soft focus-within:ring-2 focus-within:ring-ring"
    >
      <label htmlFor="chat-question" className="sr-only">
        Your question
      </label>
      <textarea
        id="chat-question"
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        rows={2}
        maxLength={MAX_TEXT_CHARS}
        placeholder="Ask about outdoor time, routes, windows, masks…"
        autoFocus
        className="max-h-48 min-h-12 flex-1 resize-none bg-transparent px-3 py-2 text-base outline-none placeholder:text-muted-foreground md:text-sm"
      />
      {busy ? (
        <Button type="button" size="icon" variant="soft" onClick={onStop} aria-label="Stop the reply">
          <SquareIcon className="size-4" aria-hidden />
        </Button>
      ) : (
        <Button type="submit" size="icon" disabled={!text.trim()} aria-label="Send question">
          <ArrowUpIcon className="size-4" aria-hidden />
        </Button>
      )}
    </form>
  );
}
