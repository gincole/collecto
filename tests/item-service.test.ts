import { describe, expect, it, vi } from "vitest";

import {
  createItem,
  getItem,
  updateItem,
  type ItemGateway,
} from "@/features/items";

const userId = "00000000-0000-4000-8000-000000000099";
const collectionId = "00000000-0000-4000-8000-000000000001";
const itemId = "00000000-0000-4000-8000-000000000002";
const fieldId = "00000000-0000-4000-8000-000000000003";
const fields = [
  {
    id: fieldId,
    name: "Rating",
    options: [],
    position: 0,
    required: true,
    type: "rating" as const,
  },
];

function gateway(overrides: Partial<ItemGateway> = {}): ItemGateway {
  return {
    createOwned: vi.fn(async () => ({ data: { id: itemId }, error: null })),
    deleteOwned: vi.fn(async () => ({ data: { id: itemId }, error: null })),
    getCollectionSchemaOwned: vi.fn(async () => ({
      data: { fields, id: collectionId, name: "Memories" },
      error: null,
    })),
    getOwned: vi.fn(async () => ({
      data: {
        collectionId,
        createdAt: "2026-10-30",
        description: null,
        id: itemId,
        title: "Item",
        updatedAt: "2026-10-30",
        values: { [fieldId]: 4 },
      },
      error: null,
    })),
    getUser: vi.fn(async () => ({ data: { id: userId }, error: null })),
    listOwned: vi.fn(async () => ({ data: [], error: null })),
    logError: vi.fn(),
    updateOwned: vi.fn(async () => ({ data: { id: itemId }, error: null })),
    ...overrides,
  };
}

describe("Item server operations", () => {
  it("validates against the current owned schema before creating", async () => {
    const store = gateway();
    await expect(
      createItem(
        { collectionId, title: "Memory", values: { [fieldId]: "5" } },
        store,
      ),
    ).resolves.toEqual({ data: { id: itemId }, status: "success" });
    expect(store.createOwned).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({ values: { [fieldId]: 5 } }),
    );
  });

  it("does not write stale or invalid values", async () => {
    const store = gateway();
    await expect(
      createItem(
        { collectionId, title: "Memory", values: { [fieldId]: "9" } },
        store,
      ),
    ).resolves.toMatchObject({ status: "validation_error" });
    expect(store.createOwned).not.toHaveBeenCalled();
  });

  it("uses the same not-found response for missing and unauthorized direct IDs", async () => {
    const store = gateway({
      getOwned: vi.fn(async () => ({ data: null, error: null })),
    });
    await expect(getItem({ collectionId, itemId }, store)).resolves.toEqual({
      status: "not_found",
    });
  });

  it("requires the item and collection to remain owner-scoped on update", async () => {
    const store = gateway();
    await expect(
      updateItem(
        { collectionId, itemId, title: "Updated", values: { [fieldId]: "4" } },
        store,
      ),
    ).resolves.toMatchObject({ status: "success" });
    expect(store.updateOwned).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({ collectionId, itemId }),
    );
  });
});
