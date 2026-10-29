import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));

import { createCollectionAction } from "@/features/collections/actions";

const requestId = "00000000-0000-4000-8000-000000000001";
const createdId = "00000000-0000-4000-8000-000000000002";

describe("Collection Server Actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("validates, authenticates, and sends one owner-free atomic RPC", async () => {
    const rpc = vi.fn(async (...args: [string, Record<string, unknown>]) => ({
      data: createdId,
      error: null,
      request: args,
    }));
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: "00000000-0000-4000-8000-000000000099" } },
          error: null,
        })),
      },
      rpc,
    });

    await expect(
      createCollectionAction({
        description: "Reading list",
        name: "My Books",
        presetKey: "book",
        requestId,
      }),
    ).resolves.toEqual({ data: { id: createdId }, status: "success" });

    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith(
      "create_collection_with_schema",
      expect.objectContaining({
        p_fields: expect.any(Array),
        p_preset_key: "book",
        p_request_id: requestId,
      }),
    );
    expect(rpc.mock.calls[0]![1]).not.toHaveProperty("owner_id");
  });

  it("performs no RPC write for invalid input", async () => {
    const rpc = vi.fn();
    createClientMock.mockResolvedValue({ rpc });

    await expect(
      createCollectionAction({ name: "", presetKey: "blank", requestId }),
    ).resolves.toMatchObject({ status: "validation_error" });
    expect(rpc).not.toHaveBeenCalled();
  });
});
