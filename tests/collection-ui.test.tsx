import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { pushMock, refreshMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

import LibraryLoading from "@/app/(app)/library/loading";
import { CollectionWizard } from "@/features/collections/collection-wizard";
import { CollectionSettings } from "@/features/collections/collection-settings";
import { LibraryError } from "@/features/collections/library-error";
import { LibraryView } from "@/features/collections/library-view";
import type { CollectionRecord } from "@/features/collections/models";

const collection: CollectionRecord = {
  createdAt: "2026-10-29T00:00:00.000Z",
  description: "Stories worth keeping",
  fields: [],
  id: "00000000-0000-4000-8000-000000000001",
  imageCount: 3,
  itemCount: 8,
  name: "My Books",
  presetKey: "book",
  updatedAt: "2026-10-29T00:00:00.000Z",
  viewConfig: {
    aspectRatio: "2:3",
    columns: 3,
    imageFit: "cover",
    showDetails: true,
    sortBy: "createdAt",
    sortDirection: "desc",
    spacing: "normal",
    visibleFieldIds: ["title"],
  },
};

describe("Collection wizard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("has no detectable WCAG A or AA violations in preset selection", async () => {
    const { container } = render(<CollectionWizard createAction={vi.fn()} />);
    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
      },
    });

    expect(results.violations).toEqual([]);
  });

  it("requires a preset and exposes selection with more than color", async () => {
    const user = userEvent.setup();
    render(<CollectionWizard createAction={vi.fn()} />);

    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(continueButton).toBeDisabled();

    const books = screen.getByRole("button", { name: "Books preset" });
    books.focus();
    await user.keyboard("{Enter}");

    expect(books).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByText("Selected", { selector: ".sr-only" }),
    ).toBeInTheDocument();
    expect(continueButton).toBeEnabled();
  });

  it("shows the actual schema and preserves details across Back", async () => {
    const user = userEvent.setup();
    render(<CollectionWizard createAction={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Books preset" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      screen.getByRole("heading", { name: "Set up your collection" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Author", { selector: "li span" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Fiction · Nonfiction · Fantasy/),
    ).toBeInTheDocument();
    expect(screen.getByTestId("collection-details-layout")).toHaveClass(
      "lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]",
    );
    await user.type(screen.getByLabelText("Collection name"), "My favorites");
    await user.type(
      screen.getByLabelText("Description (optional)"),
      "Keep these close",
    );

    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByLabelText("Collection name")).toHaveValue(
      "My favorites",
    );
    expect(screen.getByLabelText("Description (optional)")).toHaveValue(
      "Keep these close",
    );
  });

  it("confirms cancel only after the wizard becomes dirty", async () => {
    const user = userEvent.setup();
    render(<CollectionWizard createAction={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Books preset" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.getByRole("alertdialog", { name: "Discard this collection?" }),
    ).toBeInTheDocument();
  });

  it("returns directly to the Library when canceling a clean wizard", async () => {
    const user = userEvent.setup();
    render(<CollectionWizard createAction={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(pushMock).toHaveBeenCalledWith("/library");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("keeps recoverable server errors visible and prevents repeat submission", async () => {
    const user = userEvent.setup();
    let finish:
      ((value: { message: string; status: "error" }) => void) | undefined;
    const createAction = vi.fn(
      () =>
        new Promise<{ message: string; status: "error" }>((resolve) => {
          finish = resolve;
        }),
    );
    render(<CollectionWizard createAction={createAction} />);

    await user.click(screen.getByRole("button", { name: "Blank preset" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(screen.getByLabelText("Collection name"), "Small joys");
    await user.click(screen.getByRole("button", { name: "Create collection" }));

    expect(
      screen.getByRole("button", { name: "Creating collection…" }),
    ).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: "Creating collection…" }),
    );
    expect(createAction).toHaveBeenCalledOnce();

    finish?.({
      message: "Could not create the collection. Try again.",
      status: "error",
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not create the collection",
    );
    expect(screen.getByLabelText("Collection name")).toHaveValue("Small joys");
  });

  it("focuses the first invalid field after server validation", async () => {
    const user = userEvent.setup();
    const createAction = vi.fn(async () => ({
      fieldErrors: { name: "Enter a Collection name." },
      status: "error" as const,
    }));
    render(<CollectionWizard createAction={createAction} />);

    await user.click(screen.getByRole("button", { name: "Blank preset" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Create collection" }));

    expect(await screen.findByText("Enter a Collection name.")).toBeVisible();
    expect(screen.getByLabelText("Collection name")).toHaveFocus();
  });
});

describe("Library view", () => {
  it("renders layout-preserving loading and retryable error states", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<LibraryLoading />);

    expect(
      screen.getByRole("status", { name: "Loading collections" }),
    ).toHaveAttribute("aria-busy", "true");

    rerender(<LibraryError />);
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(refreshMock).toHaveBeenCalledOnce();
  });

  it("renders a directed empty state without P1 search or sort", () => {
    render(<LibraryView collections={[]} />);

    expect(
      screen.getByRole("heading", { name: "No collections yet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Create your first collection" }),
    ).toHaveAttribute("href", "/collections/new");
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("renders navigable Collection cards, item counts, and contextual actions", () => {
    render(<LibraryView collections={[collection]} />);

    expect(screen.getByRole("link", { name: "Open My Books" })).toHaveAttribute(
      "href",
      `/collections/${collection.id}`,
    );
    expect(screen.getByText("8 items")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Collection actions for My Books"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Rename My Books" }),
    ).toHaveAttribute("href", `/collections/${collection.id}/settings`);
    expect(
      screen.getByRole("link", { name: "Delete My Books" }),
    ).toHaveAttribute(
      "href",
      `/collections/${collection.id}/settings#delete-collection`,
    );
  });
});

describe("Collection settings", () => {
  it("uses custom validation for an empty name rather than a browser popup", async () => {
    const user = userEvent.setup();
    const updateAction = vi.fn(async () => ({
      status: "error" as const,
      fieldErrors: { name: "Enter a Collection name." },
    }));
    render(
      <CollectionSettings
        collection={collection}
        updateAction={updateAction}
        deleteAction={vi.fn()}
      />,
    );
    expect(
      screen.getByLabelText("Collection name").closest("form"),
    ).toHaveAttribute("novalidate");
    await user.clear(screen.getByLabelText("Collection name"));
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(updateAction).toHaveBeenCalledOnce();
    expect(await screen.findByText("Enter a Collection name.")).toBeVisible();
    expect(screen.getByLabelText("Collection name")).toHaveFocus();
  });
  it("saves identity changes and preserves recoverable errors", async () => {
    const user = userEvent.setup();
    const updateAction = vi.fn(async () => ({
      message: "Could not save changes. Try again.",
      status: "error" as const,
    }));
    render(
      <CollectionSettings
        collection={collection}
        deleteAction={vi.fn()}
        updateAction={updateAction}
      />,
    );

    const name = screen.getByLabelText("Collection name");
    await user.clear(name);
    await user.type(name, "Renamed Books");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not save changes",
    );
    expect(name).toHaveValue("Renamed Books");
  });

  it("requires exact typed confirmation for populated deletion and returns focus", async () => {
    const user = userEvent.setup();
    render(
      <CollectionSettings
        collection={{ ...collection, itemCount: 2 }}
        deleteAction={vi.fn()}
        updateAction={vi.fn()}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Delete collection" });
    await user.click(trigger);
    const dialog = screen.getByRole("alertdialog", {
      name: "Permanently delete My Books?",
    });
    expect(dialog).toHaveTextContent("2 items");
    expect(dialog).toHaveTextContent("3 private images");
    const confirm = screen.getByRole("button", { name: "Delete permanently" });
    expect(confirm).toBeDisabled();
    await user.type(
      screen.getByLabelText("Type My Books to confirm"),
      "My Books",
    );
    expect(confirm).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(trigger).toHaveFocus();
  });

  it("allows retry with the current name after a concurrent rename", async () => {
    const user = userEvent.setup();
    const deleteAction = vi.fn(async () => ({
      fieldErrors: { confirmationName: "Type Renamed Elsewhere to confirm." },
      requiredConfirmationName: "Renamed Elsewhere",
      status: "error" as const,
    }));
    render(
      <CollectionSettings
        collection={{ ...collection, itemCount: 1 }}
        deleteAction={deleteAction}
        updateAction={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete collection" }));
    await user.type(
      screen.getByLabelText("Type My Books to confirm"),
      "My Books",
    );
    await user.click(
      screen.getByRole("button", { name: "Delete permanently" }),
    );

    expect(
      await screen.findByLabelText("Type Renamed Elsewhere to confirm"),
    ).toBeInTheDocument();
    await user.clear(
      screen.getByLabelText("Type Renamed Elsewhere to confirm"),
    );
    await user.type(
      screen.getByLabelText("Type Renamed Elsewhere to confirm"),
      "Renamed Elsewhere",
    );
    expect(
      screen.getByRole("button", { name: "Delete permanently" }),
    ).toBeEnabled();
  });

  it("does not require typed confirmation for an empty Collection", async () => {
    const user = userEvent.setup();
    render(
      <CollectionSettings
        collection={{ ...collection, itemCount: 0 }}
        deleteAction={vi.fn()}
        updateAction={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Delete collection" }));
    expect(
      screen.queryByRole("textbox", { name: /confirm/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete permanently" }),
    ).toBeEnabled();
  });

  it("reveals typed confirmation when an empty Collection becomes populated", async () => {
    const user = userEvent.setup();
    const deleteAction = vi.fn(async () => ({
      fieldErrors: { confirmationName: "Type My Books to confirm." },
      requiredConfirmationName: "My Books",
      status: "error" as const,
    }));
    render(
      <CollectionSettings
        collection={{ ...collection, itemCount: 0 }}
        deleteAction={deleteAction}
        updateAction={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete collection" }));
    await user.click(
      screen.getByRole("button", { name: "Delete permanently" }),
    );

    expect(
      await screen.findByLabelText("Type My Books to confirm"),
    ).toBeInTheDocument();
  });
});
