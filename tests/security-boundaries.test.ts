import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { createCollectionGateway } from "@/features/collections/gateway";
import { createItemGateway } from "@/features/items/gateway";
import { createFieldGateway } from "@/features/fields/gateway";

const { retry, configuration } = vi.hoisted(() => ({
  retry: vi.fn(),
  configuration: { STORAGE_CLEANUP_SECRET: "fixture-admin-secret" },
}));
vi.mock("@/features/collections/cleanup-runner", () => ({
  retryPendingStorageCleanup: retry,
}));
vi.mock("@/lib/env/server", () => ({ serverEnv: configuration }));
import { POST } from "@/app/api/admin/storage-cleanup/route";

afterEach(() => vi.restoreAllMocks());

describe("security boundaries and error privacy", () => {
  it.each([null, "Bearer wrong", "Basic fixture-admin-secret"])(
    "hides the cleanup endpoint from unauthorized caller %s",
    async (authorization) => {
      retry.mockClear();
      const response = await POST(
        new Request("http://localhost/api/admin/storage-cleanup", {
          method: "POST",
          headers: authorization ? { authorization } : {},
        }),
      );
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: "Not found." });
      expect(retry).not.toHaveBeenCalled();
    },
  );
  it("returns safe cleanup errors and never logs authorization or private provider details", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const privateMessage =
      "private-title signed-url?token=fixture credentials=fixture-password";
    retry.mockRejectedValueOnce(new Error(privateMessage));
    const response = await POST(
      new Request("http://localhost/api/admin/storage-cleanup", {
        method: "POST",
        headers: { authorization: "Bearer fixture-admin-secret" },
      }),
    );
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Cleanup could not be completed.",
    });
    expect(JSON.stringify(log.mock.calls)).not.toMatch(
      /private-title|signed-url|fixture-password|fixture-admin-secret/,
    );
  });
  it("logs only operation and provider code at Collection, Item and Field gateways", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const client = createClient<Database>(
      "http://127.0.0.1:54321",
      "fixture-public-key",
      { auth: { persistSession: false } },
    );
    const failure = {
      code: "42501",
      message: "PRIVATE_USER_CONTENT",
      details: "SIGNED_URL_TOKEN",
      access_token: "SECRET_FIXTURE",
    };
    for (const gateway of [
      createCollectionGateway(client),
      createItemGateway(client),
      createFieldGateway(client),
    ])
      gateway.logError("test-denial", failure);
    expect(log).toHaveBeenCalledTimes(3);
    for (const [, context] of log.mock.calls)
      expect(context).toEqual({ errorCode: "42501", operation: "test-denial" });
    expect(JSON.stringify(log.mock.calls)).not.toMatch(
      /PRIVATE_USER_CONTENT|SIGNED_URL_TOKEN|SECRET_FIXTURE/,
    );
  });
});
