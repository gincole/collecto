import { chooseOption } from "./helpers/select-option";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import { CollectionWizard } from "@/features/collections/collection-wizard";
import type { CollectionWizardAction } from "@/features/collections/wizard-state";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("Collection schema draft wizard", () => {
  it("groups fields by name and type with compact labelled options", async () => {
    const user = userEvent.setup();
    render(<CollectionWizard modal createAction={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Books preset" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    const author = screen.getByRole("group", { name: "Author" });
    expect(within(author).getAllByText("Text")[0]).toBeVisible();
    expect(author.closest("li")).toHaveClass("border-t");
    const genre = screen.getByRole("group", { name: "Genre" });
    const option = within(genre).getByLabelText("Option 1 for field 2");
    expect(option.closest("li")).toHaveClass(
      "sm:grid-cols-[minmax(0,1fr)_auto]",
    );
    expect(
      within(genre).getByRole("button", { name: "Remove option Fiction" }),
    ).toHaveClass("size-11");
  });
  it("has no detectable WCAG A/AA violations in the populated draft editor", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <main>
        <CollectionWizard createAction={vi.fn()} />
      </main>,
    );
    await user.click(screen.getByRole("button", { name: "Books preset" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    const results = await axe.run(container, {
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
  it("preserves independent preset drafts and Select options while changing draft types", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    render(<CollectionWizard createAction={action} />);
    await user.click(screen.getByRole("button", { name: "Books preset" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      screen.getByRole("heading", { name: "Custom fields", level: 2 }),
    ).toBeInTheDocument();
    await chooseOption(user, screen.getByLabelText("Field 2 type"), "text");
    expect(screen.queryByDisplayValue("Fiction")).not.toBeInTheDocument();
    await chooseOption(user, screen.getByLabelText("Field 2 type"), "select");
    expect(screen.getByDisplayValue("Fiction")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Field 1 name"));
    await user.type(screen.getByLabelText("Field 1 name"), "Writer");
    await user.click(screen.getByRole("button", { name: "Change preset" }));
    await user.click(screen.getByRole("button", { name: "Custom preset" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.queryByLabelText("Field 1 name")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Change preset" }));
    await user.click(screen.getByRole("button", { name: "Books preset" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByLabelText("Field 1 name")).toHaveValue("Writer");
    expect(action).not.toHaveBeenCalled();
  });
  it("edits a preset locally, preserves edits through Back, and submits only the final draft", async () => {
    const user = userEvent.setup();
    const action = vi.fn<CollectionWizardAction>(async () => ({
      status: "error" as const,
      message: "Try again.",
    }));
    render(<CollectionWizard createAction={action} />);
    await user.click(screen.getByRole("button", { name: "Books preset" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(screen.getByLabelText("Collection name"), "My books");
    await user.clear(screen.getByLabelText("Field 1 name"));
    await user.type(screen.getByLabelText("Field 1 name"), "Creator");
    await chooseOption(user, screen.getByLabelText("Field 1 type"), "url");
    await user.click(screen.getByLabelText("Required field 1"));
    await user.click(
      screen.getByRole("button", { name: "Remove field Rating" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Move Field Creator down" }),
    );
    await user.clear(screen.getByLabelText("Option 1 for field 1"));
    await user.type(screen.getByLabelText("Option 1 for field 1"), "Literary");
    await user.click(
      screen.getByRole("button", { name: "Move Option Literary down" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Remove option Other" }),
    );
    expect(action).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByLabelText("Field 2 name")).toHaveValue("Creator");
    await user.click(screen.getByRole("button", { name: "Create collection" }));
    await screen.findByText("Try again.");
    const submitted = action.mock.calls.at(0);
    const data: unknown = submitted?.[1];
    expect(data).toBeInstanceOf(FormData);
    if (!(data instanceof FormData))
      throw new Error("Expected submitted form data");
    expect(JSON.parse(String(data.get("fields")))).toEqual([
      {
        name: "Genre",
        type: "select",
        required: false,
        options: [
          "Nonfiction",
          "Literary",
          "Fantasy",
          "Mystery",
          "Romance",
          "Sci-Fi",
        ],
      },
      { name: "Creator", type: "url", required: true, options: [] },
      {
        name: "Status",
        type: "select",
        required: false,
        options: ["To Read", "Reading", "Finished"],
      },
    ]);
  });

  it("adds fields/options to Blank, blocks invalid drafts, and disables editing during creation", async () => {
    const user = userEvent.setup();
    const request = Promise.withResolvers<{
      status: "error";
      message: string;
    }>();
    const action = vi.fn(() => request.promise);
    render(<CollectionWizard createAction={action} />);
    await user.click(screen.getByRole("button", { name: "Custom preset" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(screen.getByLabelText("Collection name"), "Things");
    await user.click(screen.getByRole("button", { name: "Add field" }));
    await user.click(screen.getByRole("button", { name: "Create collection" }));
    expect(await screen.findByText("Enter a field name.")).toBeVisible();
    expect(screen.getByLabelText("Field 1 name")).toHaveFocus();
    expect(action).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText("Field 1 name"), "Category");
    await chooseOption(user, screen.getByLabelText("Field 1 type"), "select");
    await user.click(
      screen.getByRole("button", { name: "Add option to field 1" }),
    );
    await user.type(screen.getByLabelText("Option 1 for field 1"), "Keepsake");
    await user.click(screen.getByRole("button", { name: "Create collection" }));
    expect(
      within(
        screen.getByRole("region", { name: "Custom fields" }),
      ).getByLabelText("Field 1 name"),
    ).toBeDisabled();
    await act(async () =>
      request.resolve({ status: "error", message: "Unavailable" }),
    );
    expect(screen.getByLabelText("Option 1 for field 1")).toHaveValue(
      "Keepsake",
    );
  });
});
