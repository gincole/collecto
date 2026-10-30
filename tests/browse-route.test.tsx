import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCollection, listItems, redirectMock, notFoundMock } = vi.hoisted(
  () => ({
    getCollection: vi.fn(),
    listItems: vi.fn(),
    redirectMock: vi.fn(() => {
      throw new Error("NEXT_REDIRECT");
    }),
    notFoundMock: vi.fn(() => {
      throw new Error("NEXT_NOT_FOUND");
    }),
  }),
);
vi.mock("@/features/collections/queries", () => ({
  getCollectionQuery: getCollection,
}));
vi.mock("@/features/items/queries", () => ({ listItemsQuery: listItems }));
vi.mock("@/features/gallery/actions", () => ({
  saveGalleryConfigAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  notFound: notFoundMock,
  useRouter: () => ({ refresh: vi.fn() }),
}));

import CollectionPage from "@/app/(app)/collections/[id]/page";
import type { CollectionRecord } from "@/features/collections/models";

const id = "00000000-0000-4000-8000-000000000001";
const fieldId = "00000000-0000-4000-8000-000000000002";
const optionId = "00000000-0000-4000-8000-000000000003";
const collection: CollectionRecord = {
  id,
  name: "Memories",
  description: null,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
  itemCount: 0,
  imageCount: 0,
  presetKey: "blank",
  fields: [
    {
      id: fieldId,
      name: "Status",
      type: "select",
      required: false,
      position: 0,
      options: [{ id: optionId, label: "Kept", position: 0 }],
    },
  ],
  viewConfig: {
    columns: 3,
    aspectRatio: "3:4",
    imageFit: "cover",
    spacing: "normal",
    sortBy: "createdAt",
    sortDirection: "desc",
    showDetails: true,
    visibleFieldIds: ["title"],
  },
};
const page = (query: Record<string, string | string[]> = {}) =>
  CollectionPage({
    params: Promise.resolve({ id }),
    searchParams: Promise.resolve(query),
  });
beforeEach(() => {
  vi.clearAllMocks();
  getCollection.mockResolvedValue({ status: "success", data: collection });
  listItems.mockResolvedValue({ status: "success", data: [] });
});

describe("Browse route state", () => {
  it("reconstructs a valid folder view from the URL on refresh", async () => {
    render(await page({ groupByFieldId: fieldId, selectedOptionId: optionId }));
    expect(screen.getByRole("heading", { name: "Kept" })).toBeInTheDocument();
    expect(getCollection).toHaveBeenCalledWith(id);
    expect(listItems).toHaveBeenCalledWith(id);
    expect(redirectMock).not.toHaveBeenCalled();
  });
  it("canonicalizes a deleted option to its folder list and deleted field to All", async () => {
    getCollection.mockResolvedValueOnce({
      status: "success",
      data: {
        ...collection,
        fields: [{ ...collection.fields[0], options: [] }],
      },
    });
    await expect(
      page({ groupByFieldId: fieldId, selectedOptionId: optionId }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenLastCalledWith(
      `/collections/${id}?groupByFieldId=${fieldId}`,
    );
    getCollection.mockResolvedValueOnce({
      status: "success",
      data: { ...collection, fields: [] },
    });
    await expect(
      page({ groupByFieldId: fieldId, selectedOptionId: optionId }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenLastCalledWith(`/collections/${id}`);
  });
  it("checks Collection access before interpreting foreign Browse IDs", async () => {
    getCollection.mockResolvedValueOnce({ status: "not_found" });
    await expect(
      page({ groupByFieldId: fieldId, selectedOptionId: optionId }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(listItems).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });
  it("canonicalizes repeated parameters without querying Items", async () => {
    await expect(
      page({ groupByFieldId: [fieldId, fieldId], selectedOptionId: optionId }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith(`/collections/${id}`);
    expect(listItems).not.toHaveBeenCalled();
  });
});
