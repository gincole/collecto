import { chooseOption } from "./helpers/select-option";
import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

import {
  FieldManager,
  type FieldManagerActions,
} from "@/features/fields/field-manager";
import type { CollectionRecord } from "@/features/collections/models";
import { useFieldOrder } from "@/features/fields/use-field-order";

const collectionId = "00000000-0000-4000-8000-000000000001";
const genreId = "00000000-0000-4000-8000-000000000010";
const ratingId = "00000000-0000-4000-8000-000000000011";
const finishedId = "00000000-0000-4000-8000-000000000020";
const plannedId = "00000000-0000-4000-8000-000000000021";

const fields: CollectionRecord["fields"] = [
  {
    id: genreId,
    name: "Genre",
    options: [
      { id: finishedId, label: "Finished", position: 0 },
      { id: plannedId, label: "Planned", position: 1 },
    ],
    position: 0,
    required: false,
    type: "select",
  },
  {
    id: ratingId,
    name: "Rating",
    options: [],
    position: 1,
    required: true,
    type: "rating",
  },
];

function createActions(
  overrides: Partial<FieldManagerActions> = {},
): FieldManagerActions {
  const success = async () => ({ status: "success" as const });
  return {
    createField: vi.fn(async () => ({
      data: { id: "00000000-0000-4000-8000-000000000030" },
      status: "success" as const,
    })),
    createOption: vi.fn(success),
    deleteField: vi.fn(success),
    deleteOption: vi.fn(success),
    getFieldImpact: vi.fn(async () => ({
      data: { affectedItemCount: 2 },
      status: "success" as const,
    })),
    getOptionImpact: vi.fn(async () => ({
      data: { affectedItemCount: 3 },
      status: "success" as const,
    })),
    reorderFields: vi.fn(success),
    reorderOptions: vi.fn(success),
    updateField: vi.fn(success),
    updateOption: vi.fn(success),
    ...overrides,
  };
}

describe("Field manager", () => {
  it("uses decorative Lucide icons with plain type labels and working typeahead", async () => {
    const user = userEvent.setup();
    render(
      <FieldManager
        fields={fields}
        collectionId={collectionId}
        actions={createActions()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Add field" }));
    const chooser = screen.getByLabelText("Field type");
    await user.click(chooser);
    for (const [value, label] of Object.entries({
      text: "Text",
      number: "Number",
      date: "Date",
      select: "Select",
      rating: "Rating",
      url: "URL",
    })) {
      const option = screen.getByRole("option", { name: label });
      expect(
        option.querySelector(`[data-field-type-icon="${value}"]`),
      ).toHaveAttribute("aria-hidden", "true");
    }
    await user.click(screen.getByRole("option", { name: "Text" }));
    chooser.focus();
    await user.keyboard("n");
    expect(chooser).toHaveTextContent("Number");
    expect(within(chooser).getByText("Number")).toHaveClass(
      "min-w-0",
      "truncate",
    );
    expect(
      chooser.querySelector('[data-field-type-icon="number"]'),
    ).not.toBeNull();
  });
  it("animates an arrow swap even before the first drag", async () => {
    mockRowRects();
    const user = userEvent.setup();
    render(
      <FieldManager
        fields={fields}
        collectionId={collectionId}
        actions={createActions()}
      />,
    );
    const styles: string[] = [];
    const observer = new MutationObserver((records) => {
      for (const record of records)
        if (record.oldValue) styles.push(record.oldValue);
    });
    observer.observe(screen.getByRole("region", { name: "Custom fields" }), {
      subtree: true,
      attributes: true,
      attributeFilter: ["style"],
      attributeOldValue: true,
    });
    await user.click(screen.getByRole("button", { name: "Move Genre down" }));
    observer.disconnect();
    expect(
      styles.some((style) => /translate3d\(0px, -?100px/.test(style)),
    ).toBe(true);
    const row = screen
      .getByRole("button", { name: "Edit Genre" })
      .closest("li");
    expect(row?.style.transition).toMatch(/transform (?!0ms)\d+ms/);
  });

  it("keeps arrow swaps unanimated when reduced motion is preferred", async () => {
    vi.stubGlobal("matchMedia", () => ({
      matches: true,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    mockRowRects();
    const user = userEvent.setup();
    render(
      <FieldManager
        fields={fields}
        collectionId={collectionId}
        actions={createActions()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Move Genre down" }));
    expect(visibleFieldOrder()).toEqual(["Edit Rating", "Edit Genre"]);
    expect(
      screen.getByRole("button", { name: "Edit Genre" }).closest("li")?.style
        .transition,
    ).toBe("");
  });

  it("keeps short actions together and truncates names with inline metadata", () => {
    const longName =
      "A very long custom field name that must never squeeze the arrow buttons";
    render(
      <FieldManager
        fields={[{ ...fields[0], name: longName, required: true }, fields[1]]}
        collectionId={collectionId}
        actions={createActions()}
      />,
    );
    const edit = screen.getByRole("button", { name: `Edit ${longName}` });
    expect(edit).toHaveTextContent(/^Edit$/);
    const actions = edit.closest("[data-field-actions]");
    expect(actions).not.toBeNull();
    expect(actions).toContainElement(
      screen.getByRole("button", { name: `Move ${longName} down` }),
    );
    const name = screen.getByText(longName);
    expect(name).toHaveClass("truncate");
    expect(name).toHaveAttribute("title", longName);
    const metadata = screen.getByText("Select (2)");
    expect(metadata.parentElement).toHaveTextContent("Required");
    expect(
      within(metadata.parentElement ?? document.body).getByText("Required"),
    ).not.toHaveClass("rounded-badge");
  });
  it("keeps a successful drop when a previous refresh arrived during the drag", async () => {
    const request = Promise.withResolvers<{ status: "success" }>();
    const actions = createActions({ reorderFields: () => request.promise });
    const hook = renderHook(
      ({ server, dragging }) =>
        useFieldOrder(server, collectionId, actions, dragging),
      { initialProps: { server: fields, dragging: true } },
    );
    const stale = [...fields];
    hook.rerender({ server: stale, dragging: true });
    const dropped = [fields[1], fields[0]];
    act(() => hook.result.current.saveOrder(dropped));
    hook.rerender({ server: stale, dragging: false });
    await act(async () => {
      request.resolve({ status: "success" });
    });
    expect(hook.result.current.fields.map((field) => field.id)).toEqual([
      ratingId,
      genreId,
    ]);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
  function mockRowRects() {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        const index = this.parentElement
          ? Array.from(this.parentElement.children).indexOf(this)
          : 0;
        return new DOMRect(
          0,
          this.hasAttribute("data-field-id") ? index * 100 : 0,
          600,
          80,
        );
      },
    );
  }
  it("moves a full-row overlay with the pointer and saves after dropping", async () => {
    mockRowRects();
    const actions = createActions(),
      user = userEvent.setup();
    render(
      <FieldManager
        fields={fields}
        collectionId={collectionId}
        actions={actions}
      />,
    );
    const handle = screen.getByRole("button", {
      name: "Drag Genre to reorder",
    });
    await user.pointer([
      { target: handle, keys: "[MouseLeft>]", coords: { x: 20, y: 20 } },
      { coords: { x: 20, y: 35 } },
      { coords: { x: 20, y: 140 } },
    ]);
    expect(
      document.querySelector("[data-field-drag-preview]"),
    ).toHaveTextContent("Edit");
    expect(actions.reorderFields).not.toHaveBeenCalled();
    await user.pointer({ keys: "[/MouseLeft]" });
    await waitFor(() =>
      expect(actions.reorderFields).toHaveBeenCalledExactlyOnceWith({
        collectionId,
        fieldIds: [ratingId, genreId],
      }),
    );
    expect(visibleFieldOrder()).toEqual(["Edit Rating", "Edit Genre"]);
    await waitFor(() =>
      expect(document.querySelector("[data-field-drag-preview]")).toBeNull(),
    );
  });
  it("sorts with the keyboard sensor and persists the dropped row", async () => {
    mockRowRects();
    const actions = createActions(),
      user = userEvent.setup();
    render(
      <FieldManager
        fields={fields}
        collectionId={collectionId}
        actions={actions}
      />,
    );
    screen.getByRole("button", { name: "Drag Genre to reorder" }).focus();
    await user.keyboard(" ");
    await user.keyboard("{ArrowDown}");
    await user.keyboard(" ");
    await waitFor(() =>
      expect(actions.reorderFields).toHaveBeenCalledExactlyOnceWith({
        collectionId,
        fieldIds: [ratingId, genreId],
      }),
    );
    expect(visibleFieldOrder()).toEqual(["Edit Rating", "Edit Genre"]);
    await waitFor(() =>
      expect(document.querySelector("[data-field-drag-preview]")).toBeNull(),
    );
  });
  it("lifts the complete row during keyboard dragging and cancels without a save", async () => {
    mockRowRects();
    const actions = createActions(),
      user = userEvent.setup();
    render(
      <FieldManager
        fields={fields}
        collectionId={collectionId}
        actions={actions}
      />,
    );
    screen.getByRole("button", { name: "Drag Genre to reorder" }).focus();
    await user.keyboard(" ");
    const preview = document.querySelector("[data-field-drag-preview]");
    expect(preview).toHaveTextContent("Genre");
    expect(preview).toHaveTextContent("Edit");
    expect(preview).toHaveTextContent("Delete");
    expect(preview).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Genre");
    expect(screen.getByRole("status")).not.toHaveTextContent(genreId);
    await user.keyboard("{Escape}");
    expect(actions.reorderFields).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(document.querySelector("[data-field-drag-preview]")).toBeNull(),
    );
  });

  function visibleFieldOrder() {
    const list = within(
      screen.getByRole("region", { name: "Custom fields" }),
    ).getByRole("list");
    return within(list)
      .getAllByRole("listitem")
      .map((row) =>
        within(row)
          .getByRole("button", { name: /^Edit / })
          .getAttribute("aria-label"),
      );
  }

  it("moves Fields immediately and bases the next arrow save on the displayed order", async () => {
    const request = Promise.withResolvers<{ status: "success" }>();
    const actions = createActions({
      reorderFields: vi
        .fn()
        .mockReturnValueOnce(request.promise)
        .mockResolvedValue({ status: "success" }),
    });
    const user = userEvent.setup();
    render(
      <FieldManager
        collectionId={collectionId}
        fields={fields}
        actions={actions}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Move Genre down" }));
    expect(visibleFieldOrder()).toEqual(["Edit Rating", "Edit Genre"]);
    await act(async () => {
      request.resolve({ status: "success" });
    });
    expect(visibleFieldOrder()).toEqual(["Edit Rating", "Edit Genre"]);
    await user.click(screen.getByRole("button", { name: "Move Genre up" }));
    expect(actions.reorderFields).toHaveBeenNthCalledWith(2, {
      collectionId,
      fieldIds: [genreId, ratingId],
    });
    expect(visibleFieldOrder()).toEqual(["Edit Genre", "Edit Rating"]);
  });

  it("restores Field order when a reorder fails", async () => {
    const user = userEvent.setup();
    render(
      <FieldManager
        collectionId={collectionId}
        fields={fields}
        actions={createActions({
          reorderFields: vi.fn().mockResolvedValue({ status: "error" }),
        })}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Move Genre down" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not save field order",
    );
    expect(visibleFieldOrder()).toEqual(["Edit Genre", "Edit Rating"]);
  });

  it("queues the latest order while a save is in flight without disabling reordering", async () => {
    const first = Promise.withResolvers<{ status: "success" }>();
    const last = Promise.withResolvers<{ status: "success" }>();
    const actions = createActions({
      reorderFields: vi
        .fn()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(last.promise),
    });
    const user = userEvent.setup();
    render(
      <FieldManager
        collectionId={collectionId}
        fields={fields}
        actions={actions}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Move Genre down" }));
    await user.click(screen.getByRole("button", { name: "Move Genre up" }));
    expect(visibleFieldOrder()).toEqual(["Edit Genre", "Edit Rating"]);
    expect(actions.reorderFields).toHaveBeenCalledOnce();
    await act(async () => {
      first.resolve({ status: "success" });
    });
    expect(actions.reorderFields).toHaveBeenNthCalledWith(2, {
      collectionId,
      fieldIds: [genreId, ratingId],
    });
    expect(
      screen.getByRole("button", { name: "Drag Genre to reorder" }),
    ).not.toBeDisabled();
    await act(async () => {
      last.resolve({ status: "success" });
    });
    expect(visibleFieldOrder()).toEqual(["Edit Genre", "Edit Rating"]);
    expect(refreshMock).toHaveBeenCalledOnce();
  });

  it("ignores an outdated save failure when a newer order is queued", async () => {
    const first = Promise.withResolvers<{ status: "error" }>();
    const actions = createActions({
      reorderFields: vi
        .fn()
        .mockReturnValueOnce(first.promise)
        .mockResolvedValue({ status: "success" }),
    });
    const user = userEvent.setup();
    render(
      <FieldManager
        fields={fields}
        collectionId={collectionId}
        actions={actions}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Move Genre down" }));
    await user.click(screen.getByRole("button", { name: "Move Genre up" }));
    await act(async () => {
      first.resolve({ status: "error" });
    });
    expect(visibleFieldOrder()).toEqual(["Edit Genre", "Edit Rating"]);
    expect(screen.queryByRole("alert")).toBeNull();
    // The desired order already matches the last confirmed order, so no second write.
    expect(actions.reorderFields).toHaveBeenCalledOnce();
  });

  it("rolls a failed final queued move back to the last successful order", async () => {
    const first = Promise.withResolvers<{ status: "success" }>();
    const actions = createActions({
      reorderFields: vi
        .fn()
        .mockReturnValueOnce(first.promise)
        .mockRejectedValue(new Error("network")),
    });
    const user = userEvent.setup();
    render(
      <FieldManager
        fields={fields}
        collectionId={collectionId}
        actions={actions}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Move Genre down" }));
    await user.click(screen.getByRole("button", { name: "Move Genre up" }));
    await act(async () => {
      first.resolve({ status: "success" });
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not save field order",
    );
    expect(visibleFieldOrder()).toEqual(["Edit Rating", "Edit Genre"]);
    expect(
      screen.getByRole("button", { name: "Move Genre up" }),
    ).not.toBeDisabled();
  });

  it("coalesces intermediate moves and ignores stale revalidated order during a save", async () => {
    const first = Promise.withResolvers<{ status: "success" }>();
    const actions = createActions({
      reorderFields: vi.fn().mockReturnValueOnce(first.promise),
    });
    const user = userEvent.setup();
    const view = render(
      <FieldManager
        fields={fields}
        collectionId={collectionId}
        actions={actions}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Move Genre down" }));
    await user.click(screen.getByRole("button", { name: "Move Genre up" }));
    await user.click(screen.getByRole("button", { name: "Move Genre down" }));
    view.rerender(
      <FieldManager
        fields={[...fields]}
        collectionId={collectionId}
        actions={actions}
      />,
    );
    expect(visibleFieldOrder()).toEqual(["Edit Rating", "Edit Genre"]);
    await act(async () => {
      first.resolve({ status: "success" });
    });
    expect(actions.reorderFields).toHaveBeenCalledOnce();
    expect(visibleFieldOrder()).toEqual(["Edit Rating", "Edit Genre"]);
  });

  it("accepts refreshed server Fields after a successful local move", async () => {
    const user = userEvent.setup();
    const actions = createActions();
    const view = render(
      <FieldManager
        collectionId={collectionId}
        fields={fields}
        actions={actions}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Move Genre down" }));
    expect(visibleFieldOrder()).toEqual(["Edit Rating", "Edit Genre"]);
    view.rerender(
      <FieldManager
        collectionId={collectionId}
        fields={fields.map((field) => ({
          ...field,
          name: field.name === "Genre" ? "Updated genre" : field.name,
        }))}
        actions={actions}
      />,
    );
    expect(visibleFieldOrder()).toEqual(["Edit Updated genre", "Edit Rating"]);
    expect(actions.reorderFields).toHaveBeenCalledOnce();
  });

  it("keeps reorder controls usable with quiet progress while saving", async () => {
    const request = Promise.withResolvers<{ status: "success" }>();
    const user = userEvent.setup();
    render(
      <FieldManager
        collectionId={collectionId}
        fields={fields}
        actions={createActions({
          reorderFields: () => request.promise,
        })}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Move Genre down" }));
    expect(screen.getByText("Updating field order…")).toHaveAttribute(
      "role",
      "status",
    );
    expect(
      screen.getByRole("button", { name: "Move Genre down" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Move Genre up" }),
    ).not.toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Drag Genre to reorder" }),
    ).not.toBeDisabled();
    expect(screen.getByText("Updating field order…")).toHaveClass("sr-only");
    await act(async () => request.resolve({ status: "success" }));
    expect(
      screen.queryByText(/Updating (?:field order|options)…/),
    ).not.toBeInTheDocument();
  });
  it("announces pending Option updates instead of only disabling controls", async () => {
    const request = Promise.withResolvers<{ status: "success" }>();
    const user = userEvent.setup();
    render(
      <FieldManager
        collectionId={collectionId}
        fields={fields}
        actions={createActions({
          updateOption: () => request.promise,
        })}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Edit Genre" }));
    await user.click(screen.getByRole("button", { name: "Save Finished" }));
    expect(screen.getByText("Updating options…")).toHaveAttribute(
      "role",
      "status",
    );
    await act(async () => request.resolve({ status: "success" }));
    expect(screen.queryByText("Updating options…")).not.toBeInTheDocument();
  });
  it("lets the user retry a failed destructive-impact check", async () => {
    const user = userEvent.setup();
    const actions = createActions({
      getFieldImpact: vi
        .fn()
        .mockResolvedValueOnce({ status: "error" })
        .mockResolvedValueOnce({
          status: "success",
          data: { affectedItemCount: 2 },
        }),
    });
    render(
      <FieldManager
        actions={actions}
        collectionId={collectionId}
        fields={fields}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Delete Genre" }));
    await user.click(await screen.findByRole("button", { name: "Try again" }));
    expect(await screen.findByText(/2 items have a value/)).toBeVisible();
  });
  beforeEach(() => vi.clearAllMocks());

  it("distinguishes built-in properties from ordered custom Fields", async () => {
    const { container } = render(
      <FieldManager
        actions={createActions()}
        collectionId={collectionId}
        fields={fields}
      />,
    );

    const builtIn = screen.getByRole("region", { name: "Built-in fields" });
    expect(within(builtIn).getByText("Title")).toBeInTheDocument();
    expect(within(builtIn).getByText("Description")).toBeInTheDocument();
    expect(within(builtIn).queryByRole("button")).toBeNull();
    for (const name of ["Title", "Description"]) {
      const row = within(builtIn).getByRole("group", {
        name: `${name} built-in field`,
      });
      expect(row).toHaveAttribute("aria-disabled", "true");
      expect(row).toHaveClass("bg-disabled-surface");
      expect(row?.querySelector("[data-field-actions]")).toBeNull();
      const lock = row?.querySelector(".lucide-lock-keyhole");
      expect(lock).not.toBeNull();
      expect(lock?.closest("button")).toBeNull();
      expect(lock?.parentElement).not.toHaveClass("bg-disabled-surface");
    }
    expect(within(builtIn).getAllByText("Text")).toHaveLength(2);
    expect(
      within(builtIn).queryByRole("button", { name: /^Drag / }),
    ).toBeNull();

    const custom = screen.getByRole("region", { name: "Custom fields" });
    expect(within(custom).getByText("Select (2)")).toBeVisible();
    expect(within(custom).getAllByText("Rating")[0]).toBeVisible();
    expect(within(custom).getByText("Required")).toBeVisible();

    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
      },
    });
    expect(results.violations).toEqual([]);
  });

  it("adds a Select Field with validated initial options", async () => {
    const user = userEvent.setup();
    const actions = createActions();
    render(
      <FieldManager
        actions={actions}
        collectionId={collectionId}
        fields={fields}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Add field" }));
    const editor = screen.getByRole("dialog", { name: "Add custom field" });
    expect(editor).toHaveClass("max-sm:h-dvh");
    await user.type(within(editor).getByLabelText("Field name"), "Mood");
    await chooseOption(
      user,
      within(editor).getByLabelText("Field type"),
      "select",
    );
    await user.click(within(editor).getByLabelText("Required field"));
    await user.type(within(editor).getByLabelText("Option 1"), "Happy");
    await user.click(
      within(editor).getByRole("button", { name: "Add option" }),
    );
    await user.type(within(editor).getByLabelText("Option 2"), "Quiet");
    await user.click(
      within(editor).getByRole("button", { name: "Create field" }),
    );

    expect(actions.createField).toHaveBeenCalledWith({
      collectionId,
      name: "Mood",
      required: true,
      type: "select",
    });
    expect(actions.createOption).toHaveBeenNthCalledWith(1, {
      collectionId,
      fieldId: "00000000-0000-4000-8000-000000000030",
      label: "Happy",
    });
    expect(actions.createOption).toHaveBeenNthCalledWith(2, {
      collectionId,
      fieldId: "00000000-0000-4000-8000-000000000030",
      label: "Quiet",
    });
    expect(refreshMock).toHaveBeenCalledOnce();
  });

  it("reorders Fields without requiring drag and drop", async () => {
    const user = userEvent.setup();
    const actions = createActions();
    render(
      <FieldManager
        actions={actions}
        collectionId={collectionId}
        fields={fields}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Move Rating up" }));
    expect(actions.reorderFields).toHaveBeenCalledWith({
      collectionId,
      fieldIds: [ratingId, genreId],
    });
    expect(refreshMock).toHaveBeenCalledOnce();
  });

  it("edits a Field while keeping its type immutable", async () => {
    const user = userEvent.setup();
    const actions = createActions();
    render(
      <FieldManager
        actions={actions}
        collectionId={collectionId}
        fields={fields}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Edit Rating" }));
    const editor = screen.getByRole("dialog", { name: "Edit Rating" });
    expect(editor.querySelector("[data-modal-header]")).toHaveClass(
      "border-b",
      "py-4",
    );
    expect(within(editor).getByRole("button", { name: "Close" })).toHaveClass(
      "border",
    );
    expect(
      within(editor)
        .getByRole("button", { name: "Save field" })
        .closest("[data-modal-footer]"),
    ).not.toBeNull();
    expect(
      within(editor).getByLabelText("Field name").closest("[data-modal-body]"),
    ).toHaveClass("pb-10");
    expect(within(editor).getByText("Rating").closest("dd")).toBeVisible();
    expect(within(editor).queryByLabelText("Field type")).toBeNull();
    await user.clear(within(editor).getByLabelText("Field name"));
    await user.type(within(editor).getByLabelText("Field name"), "Score");
    await user.click(within(editor).getByLabelText("Required field"));
    await user.click(
      within(editor).getByRole("button", { name: "Save field" }),
    );

    expect(actions.updateField).toHaveBeenCalledWith({
      collectionId,
      fieldId: ratingId,
      name: "Score",
      required: false,
    });
    expect(
      screen.queryByRole("dialog", { name: "Edit Rating" }),
    ).not.toBeInTheDocument();
  });

  it("manages Select options by stable ID and explicit order controls", async () => {
    const user = userEvent.setup();
    const actions = createActions();
    render(
      <FieldManager
        actions={actions}
        collectionId={collectionId}
        fields={fields}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Edit Genre" }));
    const editor = screen.getByRole("dialog", { name: "Edit Genre" });
    const finished = within(editor).getByLabelText("Option label: Finished");
    await user.clear(finished);
    await user.type(finished, "Completed");
    await user.click(
      within(editor).getByRole("button", { name: "Save Finished" }),
    );
    expect(actions.updateOption).toHaveBeenCalledWith({
      collectionId,
      fieldId: genreId,
      label: "Completed",
      optionId: finishedId,
    });

    await user.click(
      within(editor).getByRole("button", { name: "Move Finished down" }),
    );
    expect(actions.reorderOptions).toHaveBeenCalledWith({
      collectionId,
      fieldId: genreId,
      optionIds: [plannedId, finishedId],
    });
  });

  it("warns before deleting a populated option and clears it by stable ID", async () => {
    const user = userEvent.setup();
    const actions = createActions();
    render(
      <FieldManager
        actions={actions}
        collectionId={collectionId}
        fields={fields}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Edit Genre" }));
    await user.click(screen.getByRole("button", { name: "Delete Finished" }));
    expect(actions.getOptionImpact).toHaveBeenCalledWith({
      collectionId,
      fieldId: genreId,
      optionId: finishedId,
    });
    const dialog = await screen.findByRole("alertdialog", {
      name: "Delete Finished?",
    });
    expect(await within(dialog).findByText(/3 items/)).toBeVisible();
    expect(dialog).toHaveTextContent("Uncategorized");
    await user.click(
      await within(dialog).findByRole("button", { name: "Delete permanently" }),
    );
    expect(actions.deleteOption).toHaveBeenCalledWith({
      collectionId,
      fieldId: genreId,
      optionId: finishedId,
    });
  });

  it("preserves an Add Field draft when the server reports a conflict", async () => {
    const user = userEvent.setup();
    const actions = createActions({
      createField: vi.fn(async () => ({ status: "conflict" as const })),
    });
    render(
      <FieldManager
        actions={actions}
        collectionId={collectionId}
        fields={fields}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Add field" }));
    await user.type(screen.getByLabelText("Field name"), "Genre");
    await user.click(screen.getByRole("button", { name: "Create field" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("conflicts");
    expect(screen.getByLabelText("Field name")).toHaveValue("Genre");
    expect(screen.getByLabelText("Field name")).toHaveFocus();
  });

  it("finishes remaining initial options without creating a duplicate Field", async () => {
    const user = userEvent.setup();
    const actions = createActions({
      createOption: vi
        .fn()
        .mockResolvedValueOnce({ status: "success" as const })
        .mockResolvedValueOnce({ status: "error" as const })
        .mockResolvedValueOnce({ status: "success" as const }),
    });
    render(
      <FieldManager
        actions={actions}
        collectionId={collectionId}
        fields={fields}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Add field" }));
    await user.type(screen.getByLabelText("Field name"), "Mood");
    await chooseOption(user, screen.getByLabelText("Field type"), "select");
    await user.type(screen.getByLabelText("Option 1"), "Happy");
    await user.click(screen.getByRole("button", { name: "Add option" }));
    await user.type(screen.getByLabelText("Option 2"), "Quiet");
    await user.click(screen.getByRole("button", { name: "Create field" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Field was created",
    );
    const finishOptions = await screen.findByRole("button", {
      name: "Finish options",
    });
    expect(finishOptions).toBeEnabled();
    await user.click(finishOptions);

    expect(actions.createField).toHaveBeenCalledOnce();
    expect(actions.createOption).toHaveBeenCalledTimes(3);
    expect(
      screen.queryByRole("dialog", { name: "Add custom field" }),
    ).not.toBeInTheDocument();
  });

  it("keeps an invalid option draft focused after a recoverable conflict", async () => {
    const user = userEvent.setup();
    const actions = createActions({
      createOption: vi.fn(async () => ({ status: "conflict" as const })),
    });
    render(
      <FieldManager
        actions={actions}
        collectionId={collectionId}
        fields={fields}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Edit Genre" }));
    const input = screen.getByLabelText("New option label");
    await user.type(input, "Finished");
    await user.click(screen.getByRole("button", { name: "Add option" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("conflicts");
    expect(input).toHaveValue("Finished");
    expect(input).toHaveFocus();
  });

  it("cannot dismiss an editor while its mutation is pending", async () => {
    const user = userEvent.setup();
    let finish:
      | ((value: { data: { id: string }; status: "success" }) => void)
      | undefined;
    const actions = createActions({
      createField: vi.fn(
        () =>
          new Promise<{ data: { id: string }; status: "success" }>(
            (resolve) => {
              finish = resolve;
            },
          ),
      ),
    });
    render(
      <FieldManager
        actions={actions}
        collectionId={collectionId}
        fields={fields}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Add field" }));
    await user.type(screen.getByLabelText("Field name"), "Mood");
    await user.click(screen.getByRole("button", { name: "Create field" }));
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(
      screen.getByRole("dialog", { name: "Add custom field" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Close dialog" }),
    ).not.toBeInTheDocument();

    finish?.({
      data: { id: "00000000-0000-4000-8000-000000000030" },
      status: "success",
    });
    expect(
      await screen.findByRole("button", { name: "Add field" }),
    ).toBeVisible();
  });

  it("states exact destructive impact and returns focus after cancel", async () => {
    const user = userEvent.setup();
    const actions = createActions();
    render(
      <FieldManager
        actions={actions}
        collectionId={collectionId}
        fields={fields}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Delete Rating" });
    await user.click(trigger);
    expect(actions.getFieldImpact).toHaveBeenCalledWith({
      collectionId,
      fieldId: ratingId,
    });
    const dialog = await screen.findByRole("alertdialog", {
      name: "Delete Rating?",
    });
    expect(dialog).toHaveTextContent("2 items");
    expect(dialog).toHaveTextContent("permanently removed");
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    const reopened = await screen.findByRole("alertdialog", {
      name: "Delete Rating?",
    });
    await user.click(
      within(reopened).getByRole("button", { name: "Delete permanently" }),
    );
    expect(actions.deleteField).toHaveBeenCalledWith({
      collectionId,
      fieldId: ratingId,
    });
  });
});
