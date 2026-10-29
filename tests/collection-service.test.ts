import { describe, expect, it, vi } from "vitest";

import {
  createCollection,
  deleteCollection,
  getCollection,
  getCollectionPreset,
  listCollections,
  updateCollection,
  type CollectionGateway,
} from "@/features/collections";

const userId = "00000000-0000-4000-8000-000000000099";
const collectionId = "00000000-0000-4000-8000-000000000000";
const collectionRecord = {
  createdAt: "2026-10-29T00:00:00.000Z",
  description: null,
  fields: [],
  id: collectionId,
  imageCount: 0,
  itemCount: 0,
  name: "Collection",
  presetKey: "blank" as const,
  updatedAt: "2026-10-29T00:00:00.000Z",
  viewConfig: {
    aspectRatio: "3:4" as const,
    columns: 3,
    imageFit: "cover" as const,
    showDetails: true,
    sortBy: "createdAt" as const,
    sortDirection: "desc" as const,
    spacing: "normal" as const,
    visibleFieldIds: ["title" as const],
  },
};

function gateway(
  overrides: Partial<CollectionGateway> = {},
): CollectionGateway {
  return {
    createAtomic: vi.fn(async () => ({
      data: { id: collectionId },
      error: null,
    })),
    deleteOwned: vi.fn(async () => ({
      data: { id: collectionId, scheduledImageCount: 0 },
      error: null,
    })),
    getOwned: vi.fn(async () => ({ data: collectionRecord, error: null })),
    getUser: vi.fn(async () => ({ data: { id: userId }, error: null })),
    listOwned: vi.fn(async () => ({ data: [], error: null })),
    logError: vi.fn(),
    updateOwned: vi.fn(async () => ({
      data: { id: collectionId },
      error: null,
    })),
    ...overrides,
  };
}

describe("Collection server operations", () => {
  it("does not write while a preset is merely selected", async () => {
    const store = gateway();
    expect(getCollectionPreset("book").label).toBe("Books");
    expect(store.createAtomic).not.toHaveBeenCalled();
  });

  it("reports authentication provider failures separately from logged-out users", async () => {
    const store = gateway({
      getUser: vi.fn(async () => ({
        data: null,
        error: { code: "AUTH_PROVIDER_FAILURE" },
      })),
    });

    await expect(listCollections(store)).resolves.toEqual({ status: "error" });
    expect(store.logError).toHaveBeenCalledWith(
      "authenticate",
      expect.objectContaining({ code: "AUTH_PROVIDER_FAILURE" }),
    );
  });

  it("rejects unauthenticated operations before accessing collection data", async () => {
    const store = gateway({
      getUser: vi.fn(async () => ({ data: null, error: null })),
    });

    await expect(listCollections(store)).resolves.toEqual({
      status: "unauthorized",
    });
    await expect(getCollection(collectionId, store)).resolves.toEqual({
      status: "unauthorized",
    });
    expect(store.listOwned).not.toHaveBeenCalled();
    expect(store.getOwned).not.toHaveBeenCalled();
  });

  it("creates the copied preset atomically without accepting an owner from input", async () => {
    const store = gateway();
    const result = await createCollection(
      {
        description: null,
        name: "My Books",
        presetKey: "book",
        requestId: collectionId,
      },
      store,
      () => crypto.randomUUID(),
    );

    expect(result).toEqual({ data: { id: collectionId }, status: "success" });
    expect(store.createAtomic).toHaveBeenCalledOnce();
    expect(store.createAtomic).toHaveBeenCalledWith(
      expect.objectContaining({ presetKey: "book", requestId: collectionId }),
    );
    expect(store.createAtomic).not.toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: expect.anything() }),
    );
  });

  it("returns structured validation errors and performs no write", async () => {
    const store = gateway();
    const result = await createCollection(
      { name: "", presetKey: "blank", requestId: collectionId },
      store,
    );

    expect(result).toMatchObject({ status: "validation_error" });
    expect(store.createAtomic).not.toHaveBeenCalled();
  });

  it("converts unexpected provider failures into a safe structured error", async () => {
    const store = gateway({
      createAtomic: vi.fn(async () => {
        throw new Error("database details");
      }),
    });

    await expect(
      createCollection(
        { name: "Safe", presetKey: "blank", requestId: collectionId },
        store,
      ),
    ).resolves.toEqual({ status: "error" });
  });

  it("uses the same not-found result for missing and unauthorized IDs", async () => {
    const missing = gateway({
      getOwned: vi.fn(async () => ({ data: null, error: null })),
    });
    const hidden = gateway({
      getOwned: vi.fn(async () => ({
        data: null,
        error: { code: "PGRST116" },
      })),
    });

    await expect(getCollection(collectionId, missing)).resolves.toEqual({
      status: "not_found",
    });
    await expect(getCollection(collectionId, hidden)).resolves.toEqual({
      status: "not_found",
    });
  });

  it("does not disguise provider failures as missing records", async () => {
    const store = gateway({
      getOwned: vi.fn(async () => ({ data: null, error: { code: "XX000" } })),
    });

    await expect(getCollection(collectionId, store)).resolves.toEqual({
      status: "error",
    });
  });

  it("authorizes update and empty Collection deletion through owner-scoped gateway calls", async () => {
    const store = gateway();

    await expect(
      updateCollection({ collectionId, name: "Updated" }, store),
    ).resolves.toEqual({ data: { id: collectionId }, status: "success" });
    await expect(
      deleteCollection({ collectionId, confirmationName: "" }, store),
    ).resolves.toEqual({
      data: { id: collectionId, scheduledImageCount: 0 },
      status: "success",
    });
    expect(store.updateOwned).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({ collectionId, name: "Updated" }),
    );
    expect(store.deleteOwned).toHaveBeenCalledWith(userId, {
      collectionId,
      confirmationName: "",
    });
  });

  it("requires the exact Collection name before deleting populated Collections", async () => {
    const populated = gateway({
      getOwned: vi.fn(async () => ({
        data: { ...collectionRecord, itemCount: 2, name: "My Books" },
        error: null,
      })),
    });

    await expect(
      deleteCollection(
        { collectionId, confirmationName: "my books" },
        populated,
      ),
    ).resolves.toMatchObject({
      confirmationName: "My Books",
      fieldErrors: { confirmationName: ["Type My Books to confirm."] },
      status: "validation_error",
    });
    expect(populated.deleteOwned).not.toHaveBeenCalled();

    await expect(
      deleteCollection(
        { collectionId, confirmationName: "My Books" },
        populated,
      ),
    ).resolves.toMatchObject({ status: "success" });
  });
});
