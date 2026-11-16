import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { MessageSquarePlus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { threadStore } from "@/lib/store";
import { createThread, deleteThread } from "@/lib/threads";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "Ask BreatheEasy — AI family air guide" },
      {
        name: "description",
        content:
          "Ask anything about today's air — get calm, personalised answers that explain the impact of each choice.",
      },
      { property: "og:title", content: "Ask BreatheEasy — AI family air guide" },
      {
        property: "og:description",
        content:
          '"Can my kid play outside today?" Get caring answers grounded in live air quality data.',
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AssistantLayout,
});

function AssistantLayout() {
  const threads = threadStore.use();
  const params = useParams({ strict: false }) as { threadId?: string };
  const navigate = useNavigate();
  const sorted = [...threads].sort((a, b) => b.updatedAt - a.updatedAt);

  const newChat = () => {
    const id = createThread();
    navigate({ to: "/assistant/$threadId", params: { threadId: id } });
  };

  return (
    <div className="mx-auto flex max-w-6xl gap-5 px-3 pt-4 md:px-6 md:pt-6">
      <aside className="hidden w-64 shrink-0 md:block">
        <div className="surface sticky top-24 flex max-h-[calc(100vh-8rem)] flex-col p-3">
          <Button variant="hero" onClick={newChat} className="w-full">
            <MessageSquarePlus /> New conversation
          </Button>
          <p className="eyebrow mt-5 px-2">Conversations</p>
          <ul className="mt-2 flex-1 space-y-1 overflow-y-auto">
            {sorted.length === 0 && (
              <li className="px-2 py-3 text-sm text-muted-foreground">No conversations yet.</li>
            )}
            {sorted.map((t) => (
              <li
                key={t.id}
                className={cn(
                  "group flex items-center rounded-xl pr-1 transition-colors hover:bg-muted",
                  params.threadId === t.id && "bg-primary-soft hover:bg-primary-soft",
                )}
              >
                <Link
                  to="/assistant/$threadId"
                  params={{ threadId: t.id }}
                  className="min-w-0 flex-1 truncate px-3 py-2 text-sm text-foreground"
                >
                  {t.title}
                </Link>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label={`Delete ${t.title}`}
                  className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  onClick={() => {
                    deleteThread(t.id);
                    if (params.threadId === t.id) navigate({ to: "/assistant" });
                  }}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile thread switcher */}
        <div className="no-scrollbar -mx-3 mb-3 flex gap-2 overflow-x-auto px-3 md:hidden">
          <Button size="sm" variant="hero" onClick={newChat} className="shrink-0">
            <MessageSquarePlus /> New
          </Button>
          {sorted.map((t) => (
            <Link
              key={t.id}
              to="/assistant/$threadId"
              params={{ threadId: t.id }}
              className={cn(
                "max-w-44 shrink-0 truncate rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs text-foreground",
                params.threadId === t.id && "border-primary bg-primary-soft",
              )}
            >
              {t.title}
            </Link>
          ))}
        </div>
        <Outlet />
      </div>
    </div>
  );
}
