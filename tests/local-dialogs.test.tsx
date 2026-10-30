import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { galleryConfigSchema } from "@/features/collections/schemas";
import type { CollectionRecord } from "@/features/collections/models";

const mocks = vi.hoisted(() => ({
  createCollection: vi.fn(),
  createItem: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  gallery: vi.fn(),
  notify: vi.fn(),
  router: { refresh: vi.fn(), push: vi.fn(), replace: vi.fn(), back: vi.fn() },
}));
vi.mock("next/navigation", () => ({ useRouter: () => mocks.router }));
vi.mock("@/components/shared/feedback", () => ({
  useFeedback: () => mocks.notify,
}));
vi.mock("@/features/collections/actions", () => ({
  createCollectionFromWizardAction: mocks.createCollection,
  updateCollectionFromSettingsAction: mocks.update,
  deleteCollectionFromSettingsAction: mocks.remove,
}));
vi.mock("@/features/items/actions", () => ({
  createItemFromFormAction: mocks.createItem,
}));
vi.mock("@/features/gallery/actions", () => ({
  saveGalleryConfigAction: mocks.gallery,
}));
vi.mock("@/features/fields/action-bindings", () => ({ fieldActions: {} }));

import { LibraryContent } from "@/features/collections/library-content";
import {
  CollectionHeader,
  CollectionGallery,
} from "@/features/gallery/collection-gallery";

const collection: CollectionRecord = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Books",
  description: null,
  presetKey: "book",
  itemCount: 0,
  imageCount: 0,
  createdAt: "2026-10-30",
  updatedAt: "2026-10-30",
  viewConfig: galleryConfigSchema.parse({
    aspectRatio: "3:4",
    columns: 3,
    imageFit: "cover",
    showDetails: true,
    sortBy: "createdAt",
    sortDirection: "desc",
    spacing: "normal",
    visibleFieldIds: ["title"],
  }),
  fields: [
    {
      id: "00000000-0000-4000-8000-000000000002",
      name: "Author",
      type: "text",
      required: false,
      position: 0,
      options: [],
    },
  ],
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.createCollection.mockResolvedValue({ status: "success" });
  mocks.createItem.mockResolvedValue({ status: "success" });
  mocks.update.mockResolvedValue({
    status: "success",
    savedIdentity: { name: "New books", description: "" },
  });
});

function expectNoNavigation(url: string) {
  expect(window.location.href).toBe(url);
  expect(mocks.router.push).not.toHaveBeenCalled();
  expect(mocks.router.replace).not.toHaveBeenCalled();
  expect(mocks.router.back).not.toHaveBeenCalled();
}

describe("ready local dialogs", () => {
  it("truncates long collection headings while keeping the full accessible name", () => {
    const name = "Long collection name ".repeat(8);
    render(<CollectionHeader collection={{ ...collection, name }} />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveClass("truncate");
    expect(heading).toHaveAttribute("title", name);
    expect(heading.textContent).toBe(name);
  });
  it("uses the shared dialog hierarchy for every Settings section without removing field controls", async () => {
    const user = userEvent.setup();
    render(<CollectionHeader collection={collection} />);
    await user.click(
      screen.getByRole("button", { name: "Collection actions for Books" }),
    );
    await user.click(
      screen.getByRole("menuitem", { name: "Collection settings" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Collection settings" });
    expect(within(dialog).queryByText("Books", { selector: "p" })).toBeNull();
    for (const name of [
      "General",
      "Built-in fields",
      "Custom fields",
      "Delete collection",
    ]) {
      const heading = within(dialog).getByRole("heading", { name });
      expect(heading).toHaveAttribute("data-form-heading", "section");
      const header = heading.closest("[data-section-header]");
      expect(header).not.toBeNull();
      expect(
        header?.querySelector("[data-section-description]"),
      ).not.toBeNull();
      expect(heading.closest("section")).toHaveAttribute("data-form-panel");
    }
    expect(within(dialog).getByLabelText("Collection name")).toBeVisible();
    expect(
      within(dialog).getByRole("button", { name: "Edit Author" }),
    ).toBeVisible();
  });

  it("shows one visible wizard heading with centered preset contents and an accessible modal name", async () => {
    const user = userEvent.setup();
    render(<LibraryContent collections={[]} />);
    await user.click(screen.getByRole("button", { name: "New collection" }));
    const dialog = screen.getByRole("dialog", { name: "New collection" });
    expect(
      within(dialog).getByRole("heading", { name: "What are you collecting?" }),
    ).toHaveClass("text-section-title-mobile");
    expect(
      within(dialog).getByRole("heading", { name: "What are you collecting?" }),
    ).not.toHaveClass("sm:text-page-title");
    expect(within(dialog).queryByRole("button", { name: "Cancel" })).toBeNull();
    expect(
      within(dialog).getByRole("heading", { name: "New collection" }),
    ).not.toHaveClass("sr-only");
    expect(
      within(dialog).getByRole("heading", { name: "What are you collecting?" }),
    ).toHaveAttribute("data-form-heading", "primary");
    expect(dialog.querySelector("header")).toHaveClass("border-b", "py-5");
    expect(within(dialog).queryByText(/Step [12] of 2/)).toBeNull();
    expect(
      within(dialog)
        .getByRole("heading", { name: "New collection" })
        .closest("header"),
    ).not.toBeNull();
    expect(within(dialog).getByRole("button", { name: "Close" })).toHaveClass(
      "border",
    );
    expect(dialog.querySelector("[data-modal-body]")).toHaveClass("pb-6");
    const custom = within(dialog).getByRole("button", {
      name: "Custom preset",
    });
    expect(custom).toHaveClass(
      "bg-foreground",
      "text-surface",
      "duration-base",
      "ease-standard",
      "transition-[border-color,background-color,color,box-shadow,transform]",
    );
    expect(custom.querySelector(".lucide-sparkles")).not.toBeNull();
    await user.click(custom);
    expect(custom).toHaveAttribute("aria-pressed", "true");
    expect(custom).toHaveClass("ring-2", "bg-foreground");
    expect(custom.querySelector(".lucide-check")).toBeNull();
    const preset = within(dialog).getByRole("button", { name: "Books preset" });
    expect(preset).toHaveClass("items-center", "justify-center", "text-center");
    expect(
      within(dialog)
        .getByRole("heading", { name: "What are you collecting?" })
        .closest("[data-section-header]"),
    ).not.toBeNull();
    await user.click(preset);
    expect(preset.querySelector(".lucide-check")).toBeNull();
    await user.click(within(dialog).getByRole("button", { name: "Continue" }));
    expect(within(dialog).queryByText(/Step [12] of 2/)).toBeNull();
    expect(dialog.querySelector("[data-modal-body]")).not.toHaveTextContent(
      "Step 2 of 2",
    );
    expect(
      within(dialog).getByRole("heading", { name: "Set up your collection" }),
    ).toHaveAttribute("data-form-heading", "primary");
    expect(
      within(dialog).getByRole("heading", { name: "Set up your collection" }),
    ).toHaveClass("text-section-title-mobile");
    expect(dialog.querySelector("[data-schema-editor]")).not.toHaveClass(
      "border",
      "p-4",
      "rounded-card",
    );
    expect(
      within(dialog).getByRole("button", { name: /Change preset/ }),
    ).toHaveClass("bg-foreground", "text-surface");
    expect(
      within(dialog).getByRole("button", { name: /Change preset/ }),
    ).toHaveClass("w-full", "h-11", "rounded-control");
    expect(
      within(dialog)
        .getByRole("heading", { name: "Set up your collection" })
        .closest("[data-section-header]"),
    ).not.toBeNull();
    const fieldHeading = within(dialog).getByRole("heading", {
      name: "Custom fields",
    });
    expect(fieldHeading.closest("[data-section-header]")).toHaveClass(
      "mb-5",
      "gap-3",
      "sm:items-start",
    );
    expect(fieldHeading.closest("[data-section-header]")).toContainElement(
      within(dialog).getByRole("button", { name: "Add field" }),
    );
    expect(
      within(dialog).getByText(/Title and Description included./),
    ).toHaveAttribute("data-section-description");
    expect(dialog.querySelector("[data-schema-editor]")).toHaveAttribute(
      "data-form-panel",
    );
    expect(
      within(dialog)
        .getByRole("button", { name: "Create collection" })
        .closest("[data-modal-footer]"),
    ).not.toBeNull();
    await user.click(within(dialog).getByRole("button", { name: "Back" }));
    expect(within(dialog).queryByText(/Step [12] of 2/)).toBeNull();
    expect(dialog.querySelector("[data-modal-body]")).not.toHaveTextContent(
      "Step 1 of 2",
    );
  });

  it("makes the entire selected preset strip one action and preserves the draft", async () => {
    const user = userEvent.setup();
    render(<LibraryContent collections={[]} />);
    await user.click(screen.getByRole("button", { name: "New collection" }));
    await user.click(screen.getByRole("button", { name: "Custom preset" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(screen.getByLabelText("Collection name"), "Memories");
    let strip = screen.getByRole("button", { name: "Change preset: Custom" });
    expect(strip).toHaveClass("w-full", "h-11", "rounded-control");
    expect(strip.querySelector("button")).toBeNull();
    await user.click(within(strip).getByText("Custom"));
    expect(
      screen.getByRole("heading", { name: "What are you collecting?" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByLabelText("Collection name")).toHaveValue("Memories");
    strip = screen.getByRole("button", { name: "Change preset: Custom" });
    await user.click(strip);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    screen.getByRole("button", { name: "Change preset: Custom" }).focus();
    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("heading", { name: "What are you collecting?" }),
    ).toBeVisible();
  });

  it("keeps Home free of Back and opens New Collection synchronously with unchanged URL", async () => {
    const user = userEvent.setup(),
      url = window.location.href;
    render(<LibraryContent collections={[]} />);
    expect(screen.queryByRole("link", { name: "Back" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    const opener = screen.getByRole("button", { name: "New collection" });
    await user.click(opener);
    expect(
      screen.getByRole("dialog", { name: "New collection" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Books preset" })).toBeVisible();
    expect(mocks.createCollection).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(opener).toHaveFocus());
    expectNoNavigation(url);
  });

  it("confirms closing a dirty wizard from step two, then creates and refreshes Home locally", async () => {
    const user = userEvent.setup(),
      url = window.location.href;
    render(<LibraryContent collections={[]} />);
    await user.click(
      screen.getByRole("button", { name: "Create your first collection" }),
    );
    await user.click(screen.getByRole("button", { name: "Custom preset" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(screen.getByLabelText("Collection name"), "Memories");
    await user.click(screen.getByRole("button", { name: "Close" }));
    const confirm = screen.getByRole("alertdialog", {
      name: "Discard this collection?",
    });
    await user.click(within(confirm).getByRole("button", { name: "Close" }));
    expect(screen.getByLabelText("Collection name")).toHaveValue("Memories");
    await user.click(screen.getByRole("button", { name: "Create collection" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(mocks.createCollection).toHaveBeenCalledOnce();
    expect(mocks.notify).toHaveBeenCalledWith("Collection created.");
    expect(mocks.router.refresh).toHaveBeenCalled();
    expectNoNavigation(url);
  });

  it("opens settings from preloaded Library fields and saves without route navigation", async () => {
    const user = userEvent.setup(),
      url = window.location.href;
    render(<LibraryContent collections={[collection]} />);
    const opener = screen.getByRole("button", {
      name: "Collection actions for Books",
    });
    await user.click(opener);
    await user.click(screen.getByRole("menuitem", { name: "Rename Books" }));
    expect(
      screen.getByRole("dialog", { name: "Collection settings" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Edit Author" })).toBeVisible();
    expect(mocks.update).not.toHaveBeenCalled();
    await user.clear(screen.getByLabelText("Collection name"));
    await user.type(screen.getByLabelText("Collection name"), "New books");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(opener).toHaveFocus());
    expectNoNavigation(url);
  });

  it("opens Add Item with preloaded fields, blocks dismissal while saving, then refreshes the same URL", async () => {
    const user = userEvent.setup(),
      url = window.location.href;
    const request = Promise.withResolvers<{ status: "success" }>();
    mocks.createItem.mockReturnValueOnce(request.promise);
    render(<CollectionHeader collection={collection} />);
    const opener = screen.getByRole("button", { name: "Add item" });
    await user.click(opener);
    expect(screen.getByLabelText("Author")).toBeVisible();
    expect(screen.queryByRole("link", { name: "Cancel" })).toBeNull();
    expect(
      screen.getByLabelText("Item image").closest("[data-image-actions]"),
    ).toHaveClass("justify-end");
    expect(mocks.createItem).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText(/Title/), "Memory");
    const save = screen.getByRole("button", { name: "Save item" });
    expect(save.closest("[data-modal-footer]")).not.toBeNull();
    await user.click(save);
    expect(screen.getByRole("button", { name: "Close" })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeVisible();
    await act(() => request.resolve({ status: "success" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(mocks.router.refresh).toHaveBeenCalledOnce();
    expect(mocks.notify).toHaveBeenCalledWith("Item created.");
    await waitFor(() => expect(opener).toHaveFocus());
    expectNoNavigation(url);
  });

  it("opens the empty gallery Add Item action locally and dismisses through the backdrop", async () => {
    const user = userEvent.setup();
    render(<CollectionGallery collection={collection} items={[]} />);
    const opener = screen.getByRole("button", { name: "Add your first item" });
    await user.click(opener);
    const overlay = document.querySelector(".dialog-overlay");
    if (!overlay) throw Error("Missing backdrop");
    await user.click(overlay);
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(opener).toHaveFocus());
  });
});
