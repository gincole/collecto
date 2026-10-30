import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageContainer } from "@/components/shared/page-container";
import { PresetArtwork } from "@/components/shared/preset-artwork";
import { Button } from "@/components/ui/button";

describe("shared components", () => {
  it("provides visible pressed feedback with a reduced-motion fallback", () => {
    render(<Button type="button">Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveClass(
      "active:scale-[0.98]",
      "motion-reduce:active:scale-100",
    );
  });

  it("renders a responsive page container using the requested semantic element", () => {
    render(<PageContainer as="main">Page content</PageContainer>);

    const container = screen.getByRole("main");

    expect(container).toHaveTextContent("Page content");
    expect(container).toHaveClass("w-full", "min-w-0");
  });

  it("renders an empty state with a semantic heading and optional action", () => {
    render(
      <EmptyState
        action={<button type="button">Create collection</button>}
        description="Start by creating your first collection."
        title="No collections yet"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "No collections yet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create collection" }),
    ).toBeInTheDocument();
  });

  it("adapts an empty-state heading to its surrounding document outline", () => {
    render(
      <EmptyState
        description="This folder does not contain items."
        headingLevel={4}
        title="No items here"
      />,
    );

    expect(
      screen.getByRole("heading", { level: 4, name: "No items here" }),
    ).toBeInTheDocument();
  });

  it("offers a retry action for recoverable errors", () => {
    const onRetry = vi.fn();

    render(
      <ErrorState
        description="The collections could not be loaded."
        onRetry={onRetry}
        title="Something went wrong"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("treats preset artwork as decorative and maps approved preset keys", () => {
    const { rerender } = render(
      <PresetArtwork presetKey="book" size="sm" variant="tile" />,
    );

    const artwork = screen.getByTestId("preset-artwork");

    expect(artwork).toHaveAttribute("aria-hidden", "true");
    expect(artwork).toHaveAttribute("data-preset", "book");
    expect(artwork).toHaveClass("bg-art-lavender");
    expect(artwork.querySelector("svg")).toBeInTheDocument();

    rerender(<PresetArtwork presetKey="blank" size="lg" variant="icon" />);

    expect(screen.getByTestId("preset-artwork")).toHaveAttribute(
      "data-preset",
      "blank",
    );
  });

  it("announces loading without exposing decorative skeleton blocks", () => {
    render(<LoadingSkeleton label="Loading collections" lines={3} />);

    const status = screen.getByRole("status", { name: "Loading collections" });

    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status.querySelectorAll('[aria-hidden="true"]')).toHaveLength(3);
  });

  it("confirms or cancels a destructive dialog with explicit actions", () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <ConfirmDialog
        confirmLabel="Delete collection"
        description="This permanently deletes the collection and its items."
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
        open
        title="Delete Books?"
        variant="destructive"
      />,
    );

    expect(
      screen.getByRole("alertdialog", { name: "Delete Books?" }),
    ).toHaveAccessibleDescription(
      "This permanently deletes the collection and its items.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));
    expect(onConfirm).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("allows a keyboard user to dismiss a confirmation dialog", () => {
    const onOpenChange = vi.fn();

    render(
      <ConfirmDialog
        confirmLabel="Leave"
        description="Unsaved changes will be discarded."
        onConfirm={vi.fn()}
        onOpenChange={onOpenChange}
        open
        title="Discard changes?"
      />,
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("traps focus and restores it to the confirmation trigger", async () => {
    const user = userEvent.setup();

    function DialogHarness() {
      const [open, setOpen] = useState(false);

      return (
        <ConfirmDialog
          confirmLabel="Delete collection"
          description="This permanently deletes the collection."
          onConfirm={vi.fn()}
          onOpenChange={setOpen}
          open={open}
          title="Delete Books?"
          trigger={<button type="button">Open delete confirmation</button>}
          variant="destructive"
        />
      );
    }

    render(<DialogHarness />);

    const trigger = screen.getByRole("button", {
      name: "Open delete confirmation",
    });
    await user.click(trigger);

    const cancel = screen.getByRole("button", { name: "Cancel" });
    const confirm = screen.getByRole("button", { name: "Delete permanently" });

    const back = screen.getByRole("button", { name: "Back" });
    expect(back).toHaveFocus();
    await user.tab();
    expect(cancel).toHaveFocus();
    await user.tab();
    expect(confirm).toHaveFocus();
    await user.tab();
    expect(back).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
  });
});
