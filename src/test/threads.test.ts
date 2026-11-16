import type { UIMessage } from "ai";
import { beforeEach, describe, expect, it } from "vitest";

import { threadStore } from "@/lib/store";
import {
  createThread,
  deleteThread,
  saveThreadMessages,
  STARTER_QUESTIONS,
  takePendingQuestion,
} from "@/lib/threads";

const userMsg = (text: string): UIMessage => ({
  id: text,
  role: "user",
  parts: [{ type: "text", text }],
});

beforeEach(() => {
  threadStore.set([]);
  sessionStorage.clear();
});

describe("chat threads", () => {
  it("creates a new thread at the top, titled from the first question", () => {
    createThread("Older");
    const id = createThread("Can my kid play outside today?");
    const [top] = threadStore.get();
    expect(top).toMatchObject({ id, title: "Can my kid play outside today?", messages: [] });
    expect(threadStore.get()).toHaveLength(2);
  });

  it("queues the first question exactly once", () => {
    const id = createThread("Should I open the windows?");
    expect(takePendingQuestion(id)).toBe("Should I open the windows?");
    expect(takePendingQuestion(id)).toBeNull();
  });

  it("an empty thread is called 'New conversation' and is retitled by its first message", () => {
    const id = createThread();
    expect(takePendingQuestion(id)).toBeNull();
    saveThreadMessages(id, [userMsg("  When   is the best time for a run? ")]);
    const t = threadStore.get()[0]!;
    expect(t.title).toBe("When is the best time for a run?");
    expect(t.messages).toHaveLength(1);
  });

  it("shortens long titles to 47 characters with an ellipsis", () => {
    const id = createThread("x".repeat(80));
    const title = threadStore.get().find((t) => t.id === id)!.title;
    expect(title).toHaveLength(47);
    expect(title.endsWith("…")).toBe(true);
  });

  it("keeps an existing title when saving later messages", () => {
    const id = createThread("First question");
    saveThreadMessages(id, [userMsg("Something else")]);
    expect(threadStore.get()[0]!.title).toBe("First question");
  });

  it("deletes only the chosen thread", () => {
    const a = createThread("A");
    const b = createThread("B");
    deleteThread(a);
    expect(threadStore.get().map((t) => t.id)).toEqual([b]);
  });

  it("offers four starter questions", () => {
    expect(STARTER_QUESTIONS).toHaveLength(4);
  });
});
