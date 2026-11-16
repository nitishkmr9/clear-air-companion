import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
const router = () => createRouter({ routeTree, context: { queryClient: new QueryClient() } });

describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    expect(router().matchRoutes("/").at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it.each([
    ["/", "/"],
    ["/family", "/family"],
    ["/planner", "/planner"],
    ["/indoor", "/indoor"],
    ["/impact", "/impact"],
    ["/diary", "/diary"],
    ["/assistant", "/assistant/"],
    ["/assistant/abc-123", "/assistant/$threadId"],
  ])("%s opens its own page", (path, routeId) => {
    expect(router().matchRoutes(path).at(-1)?.routeId).toBe(routeId);
  });

  it("gives the chat thread page its id", () => {
    expect(router().matchRoutes("/assistant/abc-123").at(-1)?.params).toMatchObject({
      threadId: "abc-123",
    });
  });
});
