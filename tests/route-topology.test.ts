import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizeAppPath } from "next/dist/shared/lib/router/utils/app-paths";
import { normalizeCatchAllRoutes } from "next/dist/server/lib/router-utils/normalize-catchall-routes";

describe("App Router topology", () => {
  it("keeps authentication and protected pages reachable under strict matching", () => {
    const pages: Record<string, string[]> = {};
    const defaults: string[] = [];
    for (const file of readdirSync("app", {
      recursive: true,
      encoding: "utf8",
    })) {
      const appPath = `/${file.replaceAll("\\", "/").replace(/\.tsx$/, "")}`;
      if (file.endsWith("default.tsx")) defaults.push(appPath);
      if (!file.endsWith("page.tsx")) continue;
      (pages[normalizeAppPath(appPath)] ??= []).push(appPath);
    }

    // Exercise the same pinned Next.js validator used by the development bundler.
    const result = normalizeCatchAllRoutes(pages, undefined, {
      strictRouteMatching: true,
      defaultAppPaths: defaults,
    });
    expect(result.unmatchedAppPages).toEqual([]);
    expect(result.incompatibleParallelRouteSlots).toEqual([]);
    expect(pages["/login"]).toContain("/(auth)/login/page");
    expect(pages["/register"]).toContain("/(auth)/register/page");
    expect(pages["/library"]).toContain("/(app)/@modal/library/page");
    expect(pages["/collections/[id]"]).toContain(
      "/(app)/@modal/collections/[...catchAll]/page",
    );
    expect(pages["/login"]).not.toContain(
      "/(app)/@modal/collections/[...catchAll]/page",
    );
  });
});
