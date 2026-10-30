import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  DeleteButton,
  DeleteMenuLink,
} from "@/components/shared/delete-button";

describe("destructive action controls", () => {
  it("uses a named, labelled danger control instead of varying icon-only triggers", () => {
    const click = vi.fn();
    render(<DeleteButton aria-label="Delete Rating" onClick={click} />);
    const button = screen.getByRole("button", { name: "Delete Rating" });
    expect(button).toHaveTextContent("Delete");
    expect(button).toHaveClass(
      "h-11",
      "text-sm",
      "px-4",
      "shrink-0",
      "border-destructive",
      "text-destructive",
    );
    expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    fireEvent.click(button);
    expect(click).toHaveBeenCalledOnce();
  });
  it("uses the same sizing with an explicit permanent confirmation and pending guard", () => {
    const click = vi.fn();
    const { rerender } = render(<DeleteButton confirm onClick={click} />);
    expect(
      screen.getByRole("button", { name: "Delete permanently" }),
    ).toHaveClass("h-11", "text-sm", "px-4", "bg-destructive");
    rerender(<DeleteButton confirm pending onClick={click} />);
    const pending = screen.getByRole("button", { name: "Deleting…" });
    expect(pending).toBeDisabled();
    expect(pending).toHaveAttribute("aria-busy", "true");
    fireEvent.click(pending);
    expect(click).not.toHaveBeenCalled();
  });
  it("retains the same named danger action in contextual menus", () => {
    render(<DeleteMenuLink href="/library" aria-label="Delete Books" />);
    expect(
      screen.getByRole("link", { name: "Delete Books" }),
    ).toHaveTextContent("Delete");
    expect(screen.getByRole("link")).toHaveClass(
      "h-11",
      "text-sm",
      "text-destructive",
    );
    expect(screen.getByRole("link").querySelector("svg")).toBeInTheDocument();
  });
});
