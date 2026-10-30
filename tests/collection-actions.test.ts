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
  deleteCollectionFromSettingsAction,
  updateCollectionFromSettingsAction,
} from "@/features/collections/actions";

const requestId = "00000000-0000-4000-8000-000000000001";
const createdId = "00000000-0000-4000-8000-000000000002";

describe("Collection Server Actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("submits the customized schema in one atomic authenticated RPC", async () => {
    const rpc = vi.fn(async () => ({ data: createdId, error: null }));
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: requestId } },
          error: null,
        })),
      },
      rpc,
    });
    const formData = new FormData();
    formData.set("name", "Custom books");
    formData.set("presetKey", "book");
    formData.set("requestId", requestId);
    formData.set(
      "fields",
      JSON.stringify([
        {
          name: " Read state ",
          type: "select",
          required: true,
          options: [" Later ", "Done"],
        },
      ]),
    );
    await expect(
      createCollectionFromWizardAction({ status: "idle" }, formData),
    ).resolves.toEqual({ status: "success" });
    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith(
      "create_collection_with_schema",
      expect.objectContaining({
        p_request_id: requestId,
        p_preset_key: "book",
        p_fields: [
          expect.objectContaining({
            name: "Read state",
            type: "select",
            required: true,
            position: 0,
            options: [
              expect.objectContaining({ label: "Later", position: 0 }),
              expect.objectContaining({ label: "Done", position: 1 }),
            ],
          }),
        ],
      }),
    );
  });

  it.each([
    "{invalid",
    "null",
    "{}",
    JSON.stringify([
      { name: "Bad", type: "text", required: false, options: ["not allowed"] },
    ]),
  ])("rejects malformed wizard schema %s without a write", async (fields) => {
    const rpc = vi.fn();
    createClientMock.mockResolvedValue({ rpc });
    const formData = new FormData();
    formData.set("name", "Safe name");
    formData.set("presetKey", "blank");
    formData.set("requestId", requestId);
    formData.set("fields", fields);
    expect(
      await createCollectionFromWizardAction({ status: "idle" }, formData),
    ).toMatchObject({
      status: "error",
      fieldErrors: { fields: expect.any(String) },
    });
    expect(rpc).not.toHaveBeenCalled();
  });

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

  it("revalidates Library without navigating after creation", async () => {
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
    ).resolves.toEqual({ status: "success" });
    expect(revalidatePathMock).toHaveBeenCalledWith("/library");
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("updates Collection identity and revalidates its routes", async () => {
    const update = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data: { id: createdId },
              error: null,
            })),
          })),
        })),
      })),
    }));
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: "00000000-0000-4000-8000-000000000099" } },
          error: null,
        })),
      },
      from: vi.fn(() => ({ update })),
    });
    const formData = new FormData();
    formData.set("name", "Renamed");
    formData.set("description", "Updated description");

    await expect(
      updateCollectionFromSettingsAction(
        createdId,
        { status: "idle" },
        formData,
      ),
    ).resolves.toMatchObject({ message: "Changes saved.", status: "success" });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/collections/${createdId}`,
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/library");
  });

  it("deletes through the cleanup-scheduling RPC and redirects safely", async () => {
    const maybeSingle = vi.fn(async () => ({
      data: {
        created_at: "2026-10-29T00:00:00.000Z",
        description: null,
        field_definitions: [],
        id: createdId,
        items: [{ count: 0 }],
        name: "Empty",
        preset_key: "blank",
        updated_at: "2026-10-29T00:00:00.000Z",
        view_config: {
          aspectRatio: "3:4",
          columns: 3,
          imageFit: "cover",
          showDetails: true,
          sortBy: "createdAt",
          sortDirection: "desc",
          spacing: "normal",
          visibleFieldIds: ["title"],
        },
      },
      error: null,
    }));
    const rpc = vi.fn(async () => ({
      data: { id: createdId, scheduled_image_count: 0 },
      error: null,
    }));
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: "00000000-0000-4000-8000-000000000099" } },
          error: null,
        })),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({ not: vi.fn(() => ({ maybeSingle })) })),
          })),
        })),
      })),
      rpc,
    });
    const formData = new FormData();
    formData.set("confirmationName", "");

    await expect(
      deleteCollectionFromSettingsAction(
        createdId,
        { status: "idle" },
        formData,
      ),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(rpc).toHaveBeenCalledWith("delete_collection_with_cleanup", {
      p_collection_id: createdId,
      p_confirmation_name: "",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/library");
    expect(redirectMock).toHaveBeenCalledWith(
      "/library?feedback=collection-deleted",
    );
  });
});
