vi.mock("@/features/collections/settings-modal", () => ({
  SettingsModal: () => null,
}));
vi.mock("@/features/items/actions", () => ({
  createItemFromFormAction: vi.fn(),
}));
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import axe from "axe-core";

vi.mock("@/features/gallery/actions", () => ({
  saveGalleryConfigAction: vi.fn(),
}));
const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push }),
}));

import {
  browseHref,
  getBrowseFolders,
  resolveBrowseState,
  UNCATEGORIZED,
} from "@/features/gallery/browse";
import { BrowseView } from "@/features/gallery/browse-view";
import { LibraryView } from "@/features/collections/library-view";
import type { CollectionRecord } from "@/features/collections/models";
import type { ItemRecord } from "@/features/items/types";

const collectionId = "00000000-0000-4000-8000-000000000001";
const fieldId = "00000000-0000-4000-8000-000000000002";
const optionId = "00000000-0000-4000-8000-000000000003";
const emptyId = "00000000-0000-4000-8000-000000000004";
const otherId = "00000000-0000-4000-8000-000000000005";
const collection: CollectionRecord = {
  id: collectionId,
  name: "Memories",
  description: null,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
  presetKey: "blank",
  imageCount: 0,
  itemCount: 2,
  fields: [
    {
      id: fieldId,
      name: "Status",
      type: "select",
      required: false,
      position: 0,
      options: [
        { id: optionId, label: "Kept", position: 0 },
        { id: emptyId, label: "Later", position: 1 },
      ],
    },
    {
      id: otherId,
      name: "Notes",
      type: "text",
      required: false,
      position: 1,
      options: [],
    },
  ],
  viewConfig: {
    columns: 3,
    aspectRatio: "3:4",
    imageFit: "cover",
    spacing: "normal",
    sortBy: "createdAt",
    sortDirection: "desc",
    visibleFieldIds: ["title"],
    showDetails: true,
  },
};
const items: ItemRecord[] = [
  {
    id: optionId,
    collectionId,
    title: "Remembered",
    description: null,
    values: { [fieldId]: optionId },
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    id: emptyId,
    collectionId,
    title: "Unsorted",
    description: null,
    values: {},
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
];

describe("Browse URL and membership", () => {
  it("uses the same translate transition, timing and reduced-motion behavior for Collection and folder cards", () => {
    render(
      <>
        <LibraryView collections={[collection]} />
        <BrowseView
          collection={collection}
          items={items}
          state={{ fieldId, optionId: null }}
        />
      </>,
    );
    const collectionCard = screen
      .getByRole("link", { name: "Open Memories" })
      .closest("article");
    const folderCard = screen
      .getByRole("link", { name: "Open Kept, 1 item" })
      .closest("article");
    expect(folderCard?.className).toBe(collectionCard?.className);
    expect(folderCard?.querySelector("button")).toBeNull();
    const actions = screen.getByRole("button", {
      name: "Collection actions for Memories",
    });
    expect(actions.closest("a")).toBeNull();
    expect(actions.parentElement).toHaveClass("top-2", "right-2");
    for (const card of [collectionCard, folderCard]) {
      expect(card).toHaveClass(
        "transition-[translate,border-color]",
        "duration-base",
        "ease-standard",
        "motion-safe:hover:-translate-y-0.5",
        "motion-reduce:transition-none",
      );
      expect(card).not.toHaveClass(
        "transition-[transform,border-color]",
        "transition-transform",
      );
    }
  });
  it("shows folders immediately while URL navigation is still pending and follows server history state", async () => {
    const request = Promise.withResolvers<void>();
    push.mockReturnValueOnce(request.promise);
    const { rerender } = render(
      <BrowseView
        collection={collection}
        items={items}
        state={{ fieldId: null, optionId: null }}
      />,
    );
    fireEvent.click(screen.getByRole("link", { name: "Status" }));
    expect(
      screen.getByRole("link", { name: "Open Kept, 1 item" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Updating view" }),
    ).toBeInTheDocument();
    expect(push).toHaveBeenCalledWith(
      browseHref(collectionId, { fieldId, optionId: null }),
      { scroll: false },
    );
    await act(async () => request.resolve());
    rerender(
      <BrowseView
        collection={collection}
        items={items}
        state={{ fieldId, optionId: null }}
      />,
    );
    expect(
      screen.queryByRole("status", { name: "Updating view" }),
    ).not.toBeInTheDocument();
    rerender(
      <BrowseView
        collection={collection}
        items={items}
        state={{ fieldId: null, optionId: null }}
      />,
    );
    expect(
      screen.getByRole("link", { name: "Open Remembered" }),
    ).toBeInTheDocument();
  });
  it.each([
    [
      "Open Kept, 1 item",
      { fieldId, optionId: null },
      { fieldId, optionId },
      "Open Remembered",
    ],
    [
      "Back to Status folders",
      { fieldId, optionId },
      { fieldId, optionId: null },
      "Open Kept, 1 item",
    ],
    [
      "All",
      { fieldId, optionId: null },
      { fieldId: null, optionId: null },
      "Open Unsorted",
    ],
  ])(
    "updates %s before the server finishes",
    async (label, initial, next, visibleLink) => {
      const request = Promise.withResolvers<void>();
      push.mockReturnValueOnce(request.promise);
      render(
        <BrowseView collection={collection} items={items} state={initial} />,
      );
      fireEvent.click(screen.getByRole("link", { name: label }));
      expect(
        screen.getByRole("link", { name: visibleLink }),
      ).toBeInTheDocument();
      expect(push).toHaveBeenLastCalledWith(browseHref(collectionId, next), {
        scroll: false,
      });
      await act(async () => request.resolve());
    },
  );
  it("keeps modified clicks native and skips redundant current-view requests", () => {
    push.mockClear();
    render(
      <BrowseView
        collection={collection}
        items={items}
        state={{ fieldId: null, optionId: null }}
      />,
    );
    fireEvent.click(screen.getByRole("link", { name: "All" }));
    window.addEventListener(
      "click",
      (event) => {
        expect(event.defaultPrevented).toBe(false);
        event.preventDefault(); // jsdom cannot open the browser's native new tab.
      },
      { once: true },
    );
    fireEvent.click(screen.getByRole("link", { name: "Status" }), {
      ctrlKey: true,
    });
    expect(push).not.toHaveBeenCalled();
  });
  it("preserves valid stable-ID state and the Uncategorized sentinel", () => {
    expect(
      resolveBrowseState(
        { groupByFieldId: fieldId, selectedOptionId: optionId },
        collection.fields,
      ),
    ).toEqual({ fieldId, optionId, needsRedirect: false });
    expect(
      resolveBrowseState(
        { groupByFieldId: fieldId, selectedOptionId: UNCATEGORIZED },
        collection.fields,
      ).optionId,
    ).toBe(UNCATEGORIZED);
    expect(browseHref(collectionId, { fieldId, optionId })).toBe(
      `/collections/${collectionId}?groupByFieldId=${fieldId}&selectedOptionId=${optionId}`,
    );
  });
  it("recovers invalid, non-Select, repeated, and foreign fields to All", () => {
    for (const groupByFieldId of [
      "bad",
      otherId,
      emptyId,
      [fieldId, fieldId],
    ]) {
      expect(
        resolveBrowseState(
          { groupByFieldId, selectedOptionId: optionId },
          collection.fields,
        ),
      ).toEqual({ fieldId: null, optionId: null, needsRedirect: true });
    }
  });
  it("recovers missing and foreign options to the field's folder list", () => {
    for (const selectedOptionId of ["bad", otherId, [optionId]]) {
      expect(
        resolveBrowseState(
          { groupByFieldId: fieldId, selectedOptionId },
          collection.fields,
        ),
      ).toEqual({ fieldId, optionId: null, needsRedirect: true });
    }
    expect(
      resolveBrowseState({ selectedOptionId: optionId }, collection.fields)
        .needsRedirect,
    ).toBe(true);
  });
  it("includes zero-count options and Uncategorized, with stable membership across renames", () => {
    expect(
      getBrowseFolders(collection.fields[0], items).map(({ id, count }) => ({
        id,
        count,
      })),
    ).toEqual([
      { id: optionId, count: 1 },
      { id: emptyId, count: 0 },
      { id: UNCATEGORIZED, count: 1 },
    ]);
    const renamed = {
      ...collection.fields[0],
      options: collection.fields[0].options.map((option) => ({
        ...option,
        label: "Renamed",
      })),
    };
    expect(getBrowseFolders(renamed, items)[0]).toMatchObject({
      id: optionId,
      count: 1,
      label: "Renamed",
    });
    expect(getBrowseFolders({ ...renamed, options: [] }, items)).toMatchObject([
      { id: UNCATEGORIZED, count: 2 },
    ]);
    expect(
      getBrowseFolders(
        collection.fields[0],
        items.map((item) => ({ ...item, values: { [fieldId]: emptyId } })),
      ).map(({ count }) => count),
    ).toEqual([0, 2, 0]);
  });
});

describe("Browse views", () => {
  it("shows only All without Select fields and exposes accessible folder navigation", async () => {
    const { rerender, container } = render(
      <BrowseView
        collection={{ ...collection, fields: [] }}
        items={items}
        state={{ fieldId: null, optionId: null }}
      />,
    );
    expect(
      within(
        screen.getByRole("navigation", { name: "Browse by" }),
      ).getAllByRole("link"),
    ).toHaveLength(1);
    rerender(
      <BrowseView
        collection={collection}
        items={items}
        state={{ fieldId, optionId: null }}
      />,
    );
    const result = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
      },
    });
    expect(result.violations).toEqual([]);
  });
  it("links only All and Select fields and clears previous option selection", () => {
    render(
      <BrowseView
        collection={collection}
        items={items}
        state={{ fieldId, optionId }}
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Browse by" });
    expect(within(nav).getByRole("link", { name: "All" })).toHaveAttribute(
      "href",
      `/collections/${collectionId}`,
    );
    expect(within(nav).getByRole("link", { name: "Status" })).toHaveAttribute(
      "href",
      browseHref(collectionId, { fieldId, optionId: null }),
    );
    expect(
      within(nav).queryByRole("link", { name: "Notes" }),
    ).not.toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Status" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
  it("renders every option folder and its current count", () => {
    render(
      <BrowseView
        collection={collection}
        items={items}
        state={{ fieldId, optionId: null }}
      />,
    );
    expect(
      screen.getByRole("link", { name: "Open Later, 0 items" }),
    ).toHaveAttribute(
      "href",
      browseHref(collectionId, { fieldId, optionId: emptyId }),
    );
    expect(
      screen.getByRole("link", { name: "Open Uncategorized, 1 item" }),
    ).toBeInTheDocument();
  });
  it("filters by stable ID and shares the saved gallery configuration", () => {
    render(
      <BrowseView
        collection={{
          ...collection,
          viewConfig: { ...collection.viewConfig, showDetails: false },
        }}
        items={items}
        state={{ fieldId, optionId }}
      />,
    );
    expect(
      screen.getByRole("link", { name: "Open Remembered" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Open Unsorted" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Remembered")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to Status folders" }),
    ).toHaveAttribute(
      "href",
      browseHref(collectionId, { fieldId, optionId: null }),
    );
  });
  it("renders Uncategorized membership and a distinct empty folder state", () => {
    const { rerender } = render(
      <BrowseView
        collection={collection}
        items={items}
        state={{ fieldId, optionId: UNCATEGORIZED }}
      />,
    );
    expect(
      screen.getByRole("link", { name: "Open Unsorted" }),
    ).toBeInTheDocument();
    rerender(
      <BrowseView
        collection={collection}
        items={items}
        state={{ fieldId, optionId: emptyId }}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "No items in this folder" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add item" }),
    ).not.toHaveAttribute("href");
  });
});
