import { beforeEach, describe, expect, it, vi } from "vitest";

const { create, update, remove, redirectMock } = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  redirectMock: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));
vi.mock("@/features/items/service", () => ({
  createItem: create,
  updateItem: update,
  deleteItem: remove,
}));
vi.mock("@/features/items/gateway", () => ({ createItemGateway: () => ({}) }));
vi.mock("@/features/items/image-gateway", () => ({
  createItemImageGateway: () => ({}),
}));

import {
  createItemFromFormAction,
  updateItemFromFormAction,
  deleteItemFromDetailsAction,
} from "@/features/items/actions";

const collectionId = "00000000-0000-4000-8000-000000000001";
const itemId = "00000000-0000-4000-8000-000000000002";
beforeEach(() => {
  vi.clearAllMocks();
  create.mockResolvedValue({ status: "success", data: { id: itemId } });
  update.mockResolvedValue({ status: "success", data: { id: itemId } });
  remove.mockResolvedValue({
    status: "success",
    data: { id: itemId, imagePath: null, cleanupJobId: null },
  });
});

describe("Item success feedback", () => {
  it.each([
    [
      "create",
      createItemFromFormAction,
      `/collections/${collectionId}?feedback=item-created`,
    ],
    [
      "update",
      updateItemFromFormAction,
      `/collections/${collectionId}/items/${itemId}?feedback=item-updated`,
    ],
    [
      "delete",
      deleteItemFromDetailsAction,
      `/collections/${collectionId}?feedback=item-deleted`,
    ],
  ] as const)(
    "announces %s only after successful persistence",
    async (_label, action, href) => {
      const form = new FormData();
      form.set("collectionId", collectionId);
      form.set("itemId", itemId);
      form.set("title", "Memory");
      await expect(action({ status: "idle" }, form)).rejects.toThrow(
        "NEXT_REDIRECT",
      );
      expect(redirectMock).toHaveBeenCalledWith(href);
    },
  );
});
