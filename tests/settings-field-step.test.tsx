import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CollectionRecord } from "@/features/collections/models";
import { SettingsModal } from "@/features/collections/settings-modal";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  option: vi.fn(),
  refresh: vi.fn(),
  notify: vi.fn(),
  update: vi.fn(),
  impact: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/components/shared/feedback", () => ({
  useFeedback: () => mocks.notify,
}));
vi.mock("@/features/collections/actions", () => ({
  updateCollectionFromSettingsAction: vi.fn(),
  deleteCollectionFromSettingsAction: vi.fn(),
}));
vi.mock("@/features/fields/action-bindings", () => ({
  fieldActions: {
    createField: mocks.create,
    createOption: mocks.option,
    updateField: mocks.update,
    getFieldImpact: mocks.impact,
    deleteField: mocks.remove,
  },
}));

const collection: CollectionRecord = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Books",
  description: "Keep this draft",
  presetKey: "book",
  fields: [],
  itemCount: 0,
  imageCount: 0,
  createdAt: "2026-10-30",
  updatedAt: "2026-10-30",
  viewConfig: {
    aspectRatio: "3:4",
    columns: 3,
    imageFit: "cover",
    showDetails: true,
    sortBy: "createdAt",
    sortDirection: "desc",
    spacing: "normal",
    visibleFieldIds: ["title"],
  },
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.update.mockResolvedValue({ status: "success" });
  mocks.impact.mockResolvedValue({
    status: "success",
    data: { affectedItemCount: 2 },
  });
  mocks.remove.mockResolvedValue({ status: "success" });
  mocks.create.mockResolvedValue({
    status: "success",
    data: { id: "00000000-0000-4000-8000-000000000002" },
  });
});

describe("Collection Settings Add Field step", () => {
  const field = {
    id: "00000000-0000-4000-8000-000000000003",
    name: "Author",
    type: "text" as const,
    required: false,
    position: 0,
    options: [],
  };
  it("edits in the same modal, preserves settings, and guards pending saves", async () => {
    const user = userEvent.setup(),
      close = vi.fn(),
      request = Promise.withResolvers<{ status: "error" }>();
    render(
      <SettingsModal
        collection={{ ...collection, fields: [field] }}
        onClose={close}
      />,
    );
    const dialog = screen.getByRole("dialog");
    await user.type(screen.getByLabelText("Collection name"), " draft");
    expect(screen.queryByRole("button", { name: "Delete Author" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Edit Author" }));
    expect(screen.getAllByRole("dialog", { hidden: true })).toHaveLength(1);
    expect(screen.getByRole("dialog", { name: "Edit Author" })).toBe(dialog);
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("button", { name: "Edit Author" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Edit Author" }));
    await user.clear(screen.getByLabelText("Field name"));
    await user.type(screen.getByLabelText("Field name"), "Writer");
    mocks.update.mockReturnValueOnce(request.promise);
    await user.click(screen.getByRole("button", { name: "Save field" }));
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Close" })).toBeDisabled();
    await act(async () => {
      request.resolve({ status: "error" });
    });
    expect(await screen.findByRole("alert")).toBeVisible();
    expect(screen.getByLabelText("Field name")).toHaveValue("Writer");
    await user.click(screen.getByRole("button", { name: "Save field" }));
    expect(screen.getByRole("dialog", { name: "Collection settings" })).toBe(
      dialog,
    );
    expect(screen.getByLabelText("Collection name")).toHaveValue("Books draft");
    expect(close).not.toHaveBeenCalled();
  });
  it("deletes from the editor's danger section with impact confirmation", async () => {
    const user = userEvent.setup();
    render(
      <SettingsModal
        collection={{ ...collection, fields: [field] }}
        onClose={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Edit Author" }));
    expect(screen.getByRole("heading", { name: "Delete field" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Delete Author" }));
    expect(await screen.findByText(/2 items have a value/)).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Delete permanently" }),
    );
    expect(
      await screen.findByRole("dialog", { name: "Collection settings" }),
    ).toBeVisible();
    expect(mocks.remove).toHaveBeenCalledExactlyOnceWith({
      collectionId: collection.id,
      fieldId: field.id,
    });
  });
  it("reuses one modal and fixed footer, then restores the unsaved settings draft and focus", async () => {
    const user = userEvent.setup();
    render(<SettingsModal collection={collection} onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog", { name: "Collection settings" }),
      url = window.location.href;
    await user.clear(screen.getByLabelText("Collection name"));
    await user.type(screen.getByLabelText("Collection name"), "Unsaved books");
    await user.click(screen.getByRole("button", { name: "Add field" }));
    expect(screen.getAllByRole("dialog", { hidden: true })).toHaveLength(1);
    expect(document.querySelectorAll(".dialog-overlay")).toHaveLength(1);
    expect(screen.getByRole("dialog", { name: "Add custom field" })).toBe(
      dialog,
    );
    expect(screen.getByLabelText("Field name")).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Save changes" })).toBeNull();
    expect(
      screen
        .getByRole("button", { name: "Create field" })
        .closest("[data-modal-footer]"),
    ).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("dialog", { name: "Collection settings" })).toBe(
      dialog,
    );
    expect(screen.getByLabelText("Collection name")).toHaveValue(
      "Unsaved books",
    );
    expect(screen.getByLabelText("Description (optional)")).toHaveValue(
      "Keep this draft",
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Add field" })).toHaveFocus(),
    );
    expect(mocks.create).not.toHaveBeenCalled();
    expect(window.location.href).toBe(url);
  });

  it("blocks Back and dismissal while saving and preserves a failed Field draft", async () => {
    const user = userEvent.setup(),
      close = vi.fn();
    const request = Promise.withResolvers<{ status: "error" }>();
    mocks.create.mockReturnValueOnce(request.promise);
    render(<SettingsModal collection={collection} onClose={close} />);
    await user.click(screen.getByRole("button", { name: "Add field" }));
    await user.type(screen.getByLabelText("Field name"), "Category");
    await user.click(screen.getByRole("button", { name: "Create field" }));
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Close" })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(close).not.toHaveBeenCalled();
    await act(() => request.resolve({ status: "error" }));
    expect(await screen.findByRole("alert")).toBeVisible();
    expect(screen.getByLabelText("Field name")).toHaveValue("Category");
    expect(screen.getByLabelText("Field name")).toHaveFocus();
    expect(screen.getAllByRole("dialog", { hidden: true })).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(
      screen.getByRole("dialog", { name: "Collection settings" }),
    ).toBeVisible();
  });

  it("returns to Settings after creating a Field without closing the modal", async () => {
    const user = userEvent.setup(),
      close = vi.fn();
    render(<SettingsModal collection={collection} onClose={close} />);
    const dialog = screen.getByRole("dialog");
    await user.click(screen.getByRole("button", { name: "Add field" }));
    await user.type(screen.getByLabelText("Field name"), "Author");
    await user.click(screen.getByRole("button", { name: "Create field" }));
    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: "Collection settings" })).toBe(
        dialog,
      ),
    );
    expect(mocks.create).toHaveBeenCalledExactlyOnceWith({
      collectionId: collection.id,
      name: "Author",
      required: false,
      type: "text",
    });
    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(close).not.toHaveBeenCalled();
  });
});
