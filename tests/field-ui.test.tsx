import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

import {
  FieldManager,
  type FieldManagerActions,
} from "@/features/fields/field-manager";
import type { CollectionRecord } from "@/features/collections/models";

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
    expect(
      within(builtIn).queryByRole("button", { name: /delete/i }),
    ).toBeNull();

    const custom = screen.getByRole("region", { name: "Custom fields" });
    expect(within(custom).getByText("Select · 2 options")).toBeVisible();
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
    await user.selectOptions(
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
    expect(
      within(editor).getByText("Rating", { selector: "dd" }),
    ).toBeVisible();
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
    expect(dialog).toHaveTextContent("3 items");
    expect(dialog).toHaveTextContent("Uncategorized");
    await user.click(
      within(dialog).getByRole("button", { name: "Delete option" }),
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
    await user.selectOptions(screen.getByLabelText("Field type"), "select");
    await user.type(screen.getByLabelText("Option 1"), "Happy");
    await user.click(screen.getByRole("button", { name: "Add option" }));
    await user.type(screen.getByLabelText("Option 2"), "Quiet");
    await user.click(screen.getByRole("button", { name: "Create field" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Field was created",
    );
    expect(
      screen.getByRole("button", { name: "Finish options" }),
    ).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Finish options" }));

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
      within(reopened).getByRole("button", { name: "Delete field" }),
    );
    expect(actions.deleteField).toHaveBeenCalledWith({
      collectionId,
      fieldId: ratingId,
    });
  });
});
