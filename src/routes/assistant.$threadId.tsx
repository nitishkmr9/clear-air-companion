import { useChat } from "@ai-sdk/react";
import { createFileRoute, Link, useHydrated } from "@tanstack/react-router";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

import logo from "@/assets/breatheeasy-logo.png";
import { LevelPill } from "@/components/app/aqi-ui";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { familyStore, placeStore, threadStore, useAir, type Thread } from "@/lib/store";
import { saveThreadMessages, STARTER_QUESTIONS, takePendingQuestion } from "@/lib/threads";

export const Route = createFileRoute("/assistant/$threadId")({
  head: () => ({
    meta: [
      { title: "Conversation — BreatheEasy" },
      {
        name: "description",
        content: "Your conversation with BreatheEasy, the calm family air-quality guide.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  const hydrated = useHydrated();
  const threads = threadStore.use();
  const thread = threads.find((t) => t.id === threadId);

  if (!hydrated) return <Skeleton className="h-[70vh] rounded-3xl" />;
  if (!thread) {
    return (
      <div className="surface flex flex-col items-center gap-3 p-12 text-center">
        <h1 className="font-display text-3xl">This conversation isn't here</h1>
        <p className="text-muted-foreground">
          It may have been deleted, or saved in another browser.
        </p>
        <Button asChild variant="soft">
          <Link to="/assistant">Back to conversations</Link>
        </Button>
      </div>
    );
  }
  return <ChatWindow key={thread.id} thread={thread} />;
}

function readError(err: Error) {
  try {
    const parsed = JSON.parse(err.message);
    if (parsed?.error) return String(parsed.error);
  } catch {
    /* not JSON */
  }
  return err.message || "Something went wrong. Please try again.";
}

function ChatWindow({ thread }: { thread: Thread }) {
  const place = placeStore.use();
  const family = familyStore.use();
  const { data } = useAir();
  const ctx = useRef({ place, family });
  ctx.current = { place, family };
  const inputWrap = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({ threadId: thread.id, place: ctx.current.place, family: ctx.current.family }),
      }),
    [thread.id],
  );

  const { messages, sendMessage, status, stop } = useChat({
    id: thread.id,
    messages: thread.messages,
    transport,
    onError: (err) => toast.error(readError(err)),
  });

  const busy = status === "submitted" || status === "streaming";
  const focusInput = () => inputWrap.current?.querySelector("textarea")?.focus();

  // Persist completed turns for this thread.
  useEffect(() => {
    if ((status === "ready" || status === "error") && messages.length > 0) {
      saveThreadMessages(thread.id, messages as UIMessage[]);
    }
  }, [messages, status, thread.id]);

  // Send a question queued from another page, once.
  useEffect(() => {
    // Deferred so React StrictMode's mount/unmount/mount cycle sends exactly once.
    const timer = setTimeout(() => {
      const q = takePendingQuestion(thread.id);
      if (q) sendMessage({ text: q });
      focusInput();
    }, 0);
    return () => clearTimeout(timer);
  }, [thread.id, sendMessage]);

  useEffect(() => {
    if (status === "ready") focusInput();
  }, [status]);

  const submit = (msg: PromptInputMessage) => {
    const text = msg.text?.trim();
    if (!text || busy) return;
    sendMessage({ text });
  };

  return (
    <div className="surface flex h-[calc(100dvh-13.5rem)] flex-col overflow-hidden md:h-[calc(100vh-7.5rem)]">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <img src={logo} alt="" width={36} height={36} className="size-9" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{thread.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              Using live air for {place.name}
            </p>
          </div>
        </div>
        {data && <LevelPill aqi={data.current.aqi} className="shrink-0" />}
      </div>

      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 py-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <img src={logo} alt="" width={72} height={72} className="size-18 animate-breathe" />
              <p className="font-display text-3xl">What's on your mind?</p>
              <Suggestions>
                {STARTER_QUESTIONS.map((q) => (
                  <Suggestion
                    key={q}
                    suggestion={q}
                    onClick={(s) => sendMessage({ text: s })}
                    className="rounded-full bg-card"
                  />
                ))}
              </Suggestions>
            </div>
          )}
          {messages.map((m) => (
            <Message key={m.id} from={m.role}>
              {m.role === "assistant" && (
                <img src={logo} alt="" width={28} height={28} className="size-7" />
              )}
              <MessageContent className="text-[0.95rem] leading-relaxed">
                {m.parts.map((part, i) => {
                  if (part.type === "text") {
                    return m.role === "assistant" ? (
                      <MessageResponse key={i}>{part.text}</MessageResponse>
                    ) : (
                      <p key={i} className="whitespace-pre-wrap">
                        {part.text}
                      </p>
                    );
                  }
                  if (part.type === "reasoning" && part.text.trim()) {
                    return (
                      <Reasoning
                        key={i}
                        isStreaming={status === "streaming" && m.id === messages.at(-1)?.id}
                      >
                        <ReasoningTrigger />
                        <ReasoningContent>{part.text}</ReasoningContent>
                      </Reasoning>
                    );
                  }
                  return null;
                })}
              </MessageContent>
            </Message>
          ))}
          {status === "submitted" && (
            <Message from="assistant">
              <img src={logo} alt="" width={28} height={28} className="size-7" />
              <MessageContent>
                <Shimmer>Checking today's air for your family…</Shimmer>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div ref={inputWrap} className="mx-auto w-full max-w-3xl px-3 pb-3">
        <PromptInput onSubmit={submit} className="rounded-3xl bg-card shadow-soft">
          <PromptInputTextarea
            placeholder="Ask about outdoor time, routes, windows, masks…"
            autoFocus
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
        <p className="mt-2 text-center text-[0.7rem] text-muted-foreground">
          Gentle guidance, not medical advice. If anyone feels unwell, please contact a doctor.
        </p>
      </div>
    </div>
  );
}
