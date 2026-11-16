import type { UIMessage } from "ai";

import { newId } from "./family";
import { threadStore, type Thread } from "./store";

const pendingKey = (id: string) => `be.pending.${id}`;

/** Create a thread (optionally with a first question to send on open). Call from event handlers only. */
export function createThread(question?: string) {
  const id = newId();
  const thread: Thread = {
    id,
    title: question ? titleFrom(question) : "New conversation",
    updatedAt: Date.now(),
    messages: [],
  };
  threadStore.set((prev) => [thread, ...prev]);
  if (question) sessionStorage.setItem(pendingKey(id), question);
  return id;
}

export function takePendingQuestion(id: string) {
  const q = sessionStorage.getItem(pendingKey(id));
  if (q) sessionStorage.removeItem(pendingKey(id));
  return q;
}

export function saveThreadMessages(id: string, messages: UIMessage[]) {
  threadStore.set((prev) =>
    prev.map((t) => {
      if (t.id !== id) return t;
      const firstUser = messages.find((m) => m.role === "user");
      const firstText = firstUser?.parts.find((p) => p.type === "text");
      const title =
        t.title === "New conversation" && firstText && "text" in firstText
          ? titleFrom(firstText.text)
          : t.title;
      return { ...t, title, messages, updatedAt: Date.now() };
    }),
  );
}

export function deleteThread(id: string) {
  threadStore.set((prev) => prev.filter((t) => t.id !== id));
}

function titleFrom(text: string) {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length > 48 ? `${t.slice(0, 46)}…` : t;
}

export const STARTER_QUESTIONS = [
  "Can my kid play outside today?",
  "When is the best time for my evening run?",
  "Is it okay for grandma to take her morning walk?",
  "Should I open the windows right now?",
];
