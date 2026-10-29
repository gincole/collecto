import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, redirectMock, revalidatePathMock } = vi.hoisted(
  () => ({
    createClientMock: vi.fn(),
    redirectMock: vi.fn(() => {
      throw new Error("NEXT_REDIRECT");
    }),
    revalidatePathMock: vi.fn(),
  }),
);

vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import {
  createCollectionAction,
  createCollectionFromWizardAction,
} from "@/features/collections/actions";

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

  it("returns adjacent wizard validation without writing", async () => {
    const rpc = vi.fn();
    createClientMock.mockResolvedValue({ rpc });
    const formData = new FormData();
    formData.set("name", "");
    formData.set("presetKey", "blank");
    formData.set("requestId", requestId);

    await expect(
      createCollectionFromWizardAction({ status: "idle" }, formData),
    ).resolves.toMatchObject({
      fieldErrors: { name: "Enter a Collection name." },
      status: "error",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("revalidates the Library and opens the created Collection", async () => {
    const rpc = vi.fn(async () => ({ data: createdId, error: null }));
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: "00000000-0000-4000-8000-000000000099" } },
          error: null,
        })),
      },
      rpc,
    });
    const formData = new FormData();
    formData.set("name", "My Books");
    formData.set("presetKey", "book");
    formData.set("requestId", requestId);

    await expect(
      createCollectionFromWizardAction({ status: "idle" }, formData),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(revalidatePathMock).toHaveBeenCalledWith("/library");
    expect(redirectMock).toHaveBeenCalledWith(`/collections/${createdId}`);
  });
});
