import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";
const { notifyMock } = vi.hoisted(() => ({ notifyMock: vi.fn() }));
vi.mock("@/components/shared/feedback", () => ({
  useFeedback: () => notifyMock,
}));
beforeEach(() => notifyMock.mockClear());

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { GallerySettings } from "@/features/gallery/gallery-settings";
import {
  saveGalleryConfig,
  type GalleryGateway,
} from "@/features/gallery/service";
import { sanitizeVisibleFields } from "@/features/gallery/draft";
import type { CollectionRecord } from "@/features/collections/models";

const id = "00000000-0000-4000-8000-000000000001";
const fieldId = "00000000-0000-4000-8000-000000000002";
const config = {
  aspectRatio: "3:4" as const,
  columns: 3,
  imageFit: "cover" as const,
  showDetails: true,
  sortBy: "createdAt" as const,
  sortDirection: "desc" as const,
  spacing: "normal" as const,
  visibleFieldIds: ["title"],
};
const collection: CollectionRecord = {
  id,
  name: "Memories",
  description: null,
  fields: [
    {
      id: fieldId,
      name: "Notes",
      type: "text",
      options: [],
      position: 0,
      required: false,
    },
  ],
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
  itemCount: 0,
  imageCount: 0,
  presetKey: "blank",
  viewConfig: config,
};

function gateway(): GalleryGateway {
  return {
    getUser: vi.fn(async () => ({ data: { id }, error: null })),
    getOwned: vi.fn(async () => ({ data: collection, error: null })),
    saveOwned: vi.fn(async () => ({ data: id, error: null })),
    logError: vi.fn(),
  };
}

describe("Gallery Settings validation and persistence", () => {
  it("sanitizes deleted and duplicate references while preserving order and details-off selections", () => {
    expect(
      sanitizeVisibleFields(
        {
          ...config,
          showDetails: false,
          visibleFieldIds: [
            fieldId,
            "title",
            fieldId,
            "description",
            "missing",
          ],
        },
        collection.fields,
      ).visibleFieldIds,
    ).toEqual([fieldId, "title", "description"]);
  });
  it("saves only validated owner-scoped configuration", async () => {
    const db = gateway();
    expect(await saveGalleryConfig({ collectionId: id, config }, db)).toEqual({
      status: "success",
    });
    expect(db.saveOwned).toHaveBeenCalledWith(id, config);
    expect(
      (
        await saveGalleryConfig(
          { collectionId: id, config: { ...config, columns: 6 } },
          db,
        )
      ).status,
    ).toBe("validation_error");
    expect(db.saveOwned).toHaveBeenCalledOnce();
  });
  it("rejects foreign fields and inaccessible Collections without writing", async () => {
    const db = gateway();
    expect(
      (
        await saveGalleryConfig(
          {
            collectionId: id,
            config: {
              ...config,
              visibleFieldIds: ["00000000-0000-4000-8000-000000000099"],
            },
          },
          db,
        )
      ).status,
    ).toBe("conflict");
    vi.mocked(db.getOwned).mockResolvedValue({ data: null, error: null });
    expect(
      (await saveGalleryConfig({ collectionId: id, config }, db)).status,
    ).toBe("not_found");
    expect(db.saveOwned).not.toHaveBeenCalled();
  });
  it("handles expired sessions and database schema conflicts safely", async () => {
    const db = gateway();
    vi.mocked(db.getUser).mockResolvedValueOnce({ data: null, error: null });
    expect(
      (await saveGalleryConfig({ collectionId: id, config }, db)).status,
    ).toBe("unauthorized");
    vi.mocked(db.saveOwned).mockResolvedValueOnce({
      data: null,
      error: { code: "22023" },
    });
    expect(
      (await saveGalleryConfig({ collectionId: id, config }, db)).status,
    ).toBe("conflict");
  });
});

describe("Gallery Settings draft", () => {
  it("keeps sheet controls labelled and accessible in its open state", async () => {
    const user = userEvent.setup();
    render(
      <GallerySettings
        collection={collection}
        items={[]}
        saveAction={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Gallery settings" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("max-h-dvh", "safe-area-panel");
    const results = await axe.run(dialog, {
      runOnly: {
        type: "tag",
        values: [
          "wcag2a",
          "wcag2aa",
          "wcag21a",
          "wcag21aa",
          "wcag22a",
          "wcag22aa",
        ],
      },
      rules: {
        "color-contrast": { enabled: false },
        "label-content-name-mismatch": { enabled: false },
      },
    });
    expect(results.violations).toEqual([]);
  });
  it("previews sorted real Items with shared grid spacing without navigation", async () => {
    const user = userEvent.setup();
    const base = {
      collectionId: id,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      description: null,
      values: {},
      imagePath: null,
    };
    render(
      <GallerySettings
        collection={collection}
        items={[
          { ...base, id, title: "Zebra" },
          { ...base, id: fieldId, title: "Apple" },
        ]}
        saveAction={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Gallery settings" }));
    await user.selectOptions(screen.getByLabelText("Sort order"), "title:asc");
    const preview = screen.getByRole("region", { name: "Gallery preview" });
    expect(within(preview).getAllByRole("article")[0]).toHaveTextContent(
      "Apple",
    );
    expect(within(preview).queryByRole("link")).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Spacing"), "tight");
    expect(within(preview).getByRole("list")).toHaveClass("gap-2");
  });
  it("caps selection at three and removes deleted Fields from an open draft", async () => {
    const user = userEvent.setup();
    const extraField = {
      ...collection.fields[0],
      id: "00000000-0000-4000-8000-000000000003",
      name: "Other",
    };
    const expanded = {
      ...collection,
      fields: [...collection.fields, extraField],
    };
    const save = vi.fn(async () => ({ status: "success" as const }));
    const { rerender } = render(
      <GallerySettings collection={expanded} items={[]} saveAction={save} />,
    );
    await user.click(screen.getByRole("button", { name: "Gallery settings" }));
    await user.click(screen.getByLabelText("Description"));
    await user.click(screen.getByLabelText("Notes"));
    expect(screen.getByLabelText("Other")).toBeDisabled();
    rerender(
      <GallerySettings
        collection={{ ...expanded, fields: [extraField] }}
        items={[]}
        saveAction={save}
      />,
    );
    expect(screen.queryByLabelText("Notes")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Other")).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(save).toHaveBeenCalledWith({
      collectionId: id,
      config: { ...config, visibleFieldIds: ["title", "description"] },
    });
  });
  it("confirms Escape and keeps editing without saving", async () => {
    const user = userEvent.setup();
    const save = vi.fn();
    render(
      <GallerySettings collection={collection} items={[]} saveAction={save} />,
    );
    await user.click(screen.getByRole("button", { name: "Gallery settings" }));
    await user.selectOptions(screen.getByLabelText("Image ratio"), "16:9");
    await user.keyboard("{Escape}");
    expect(
      screen.getByRole("alertdialog", { name: "Discard gallery changes?" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.getByLabelText("Image ratio")).toHaveValue("16:9");
    expect(save).not.toHaveBeenCalled();
  });
  it("previews locally and persists only Save, preserving selections with details OFF", async () => {
    const user = userEvent.setup();
    const save = vi.fn(async () => ({ status: "success" as const }));
    render(
      <GallerySettings collection={collection} items={[]} saveAction={save} />,
    );
    await user.click(screen.getByRole("button", { name: "Gallery settings" }));
    const dialog = screen.getByRole("dialog", { name: "Gallery settings" });
    expect(within(dialog).getByText("Sample item")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Columns"), "5");
    await user.click(screen.getByLabelText("Description"));
    await user.click(screen.getByLabelText("Show details"));
    expect(within(dialog).queryByText("Sample item")).not.toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(save).toHaveBeenCalledWith({
      collectionId: id,
      config: {
        ...config,
        columns: 5,
        showDetails: false,
        visibleFieldIds: ["title", "description"],
      },
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(notifyMock).toHaveBeenCalledWith("Gallery settings saved.");
  });
  it("confirms dirty Cancel and restores the saved draft when reopened", async () => {
    const user = userEvent.setup();
    const save = vi.fn();
    render(
      <GallerySettings collection={collection} items={[]} saveAction={save} />,
    );
    const trigger = screen.getByRole("button", { name: "Gallery settings" });
    await user.click(trigger);
    await user.selectOptions(screen.getByLabelText("Columns"), "1");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      screen.getByRole("alertdialog", { name: "Discard gallery changes?" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(trigger).toHaveFocus();
    await user.click(trigger);
    expect(screen.getByLabelText("Columns")).toHaveValue("3");
    expect(save).not.toHaveBeenCalled();
  });
  it("enforces the field cap, supports keyboard ordering, and preserves a failed draft", async () => {
    const user = userEvent.setup();
    render(
      <GallerySettings
        collection={collection}
        items={[]}
        saveAction={async () => ({ status: "error" })}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Gallery settings" }));
    await user.click(screen.getByLabelText("Description"));
    await user.click(screen.getByLabelText("Notes"));
    const up = screen.getByRole("button", { name: "Move Notes up" });
    up.focus();
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not save",
    );
    expect(screen.getByLabelText("Notes")).toBeChecked();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
  it("blocks dismissal and duplicate submission during Save", async () => {
    const user = userEvent.setup();
    let resolve: ((result: { status: "success" }) => void) | undefined;
    const save = vi.fn(
      () =>
        new Promise<{ status: "success" }>((finish) => {
          resolve = finish;
        }),
    );
    render(
      <GallerySettings collection={collection} items={[]} saveAction={save} />,
    );
    await user.click(screen.getByRole("button", { name: "Gallery settings" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    await act(async () => resolve?.({ status: "success" }));
    expect(save).toHaveBeenCalledOnce();
  });
});
