import { ArrowDownIcon } from "lucide-react";
import type { ReactNode } from "react";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";

import { Button } from "@/components/ui/button";

/** Scrolling message list that follows new replies, with a jump-to-latest button. */
export function ChatLog({ children }: { children: ReactNode }) {
  return (
    <StickToBottom
      className="relative flex-1 overflow-y-hidden"
      initial="smooth"
      resize="smooth"
      role="log"
      aria-label="Conversation"
    >
      <StickToBottom.Content className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
        {children}
      </StickToBottom.Content>
      <ScrollToLatest />
    </StickToBottom>
  );
}

function ScrollToLatest() {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();
  if (isAtBottom) return null;
  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      aria-label="Scroll to the latest message"
      onClick={() => void scrollToBottom()}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full"
    >
      <ArrowDownIcon className="size-4" aria-hidden />
    </Button>
  );
}
