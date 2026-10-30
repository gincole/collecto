import { createClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { createCollectionGateway } from "@/features/collections/gateway";
import type { Database } from "@/lib/supabase/database.types";

describe("preloaded Collection summaries", () => {
  it("requests owner-scoped Item and image aggregates rather than capped child rows", async () => {
    const fetcher = vi.fn<typeof fetch>(
      async () =>
        new Response(JSON.stringify([]), {
          headers: { "Content-Type": "application/json" },
        }),
    );
    const client = createClient<Database>(
      "http://127.0.0.1:54321",
      "test-publishable-key",
      {
        global: { fetch: fetcher },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
    const result = await createCollectionGateway(client).listOwned("owner-id");
    expect(result).toEqual({ data: [], error: null });
    const request = fetcher.mock.calls[0]?.[0];
    if (!request) throw Error("Missing query");
    const url = new URL(String(request));
    expect(url.searchParams.get("select")).toContain(
      "items(count),image_items:items(count)",
    );
    expect(url.searchParams.get("select")).not.toContain("items(id");
    expect(url.searchParams.get("owner_id")).toBe("eq.owner-id");
    expect(url.searchParams.get("image_items.image_path")).toBe("not.is.null");
  });
});
