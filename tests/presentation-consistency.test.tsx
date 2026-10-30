import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DisplayName } from "@/components/shared/display-name";
import { cn } from "@/lib/utils/cn";
import { Input } from "@/components/ui/form-control";

describe("shared presentation consistency", () => {
  it.each([
    "ui",
    "input",
    "modal-title",
    "card-title",
    "section-title-mobile",
    "label",
  ])("keeps semantic %s font sizing independent of text color", (role) => {
    expect(cn(`text-${role}`, "text-destructive")).toBe(
      `text-${role} text-destructive`,
    );
    expect(cn("text-foreground", `text-${role}`)).toBe(
      `text-foreground text-${role}`,
    );
  });
  it("ellipsizes names without losing the full accessible text", () => {
    const name = "A very long collection name ".repeat(8);
    render(<DisplayName as="h1">{name}</DisplayName>);
    expect(screen.getByRole("heading")).toHaveClass("min-w-0", "truncate");
    expect(screen.getByRole("heading")).toHaveAttribute("title", name);
    expect(screen.getByRole("heading").textContent).toBe(name);
  });
  it("keeps native date and text inputs within the same container and input type scale", () => {
    render(
      <>
        <Input type="date" aria-label="Date" />
        <Input aria-label="Text" />
      </>,
    );
    for (const name of ["Date", "Text"])
      expect(screen.getByLabelText(name)).toHaveClass(
        "w-full",
        "min-w-0",
        "max-w-full",
        "text-input",
      );
    expect(screen.getByLabelText("Date")).toHaveClass("native-date", "h-11");
    expect(screen.getByLabelText("Date")).toHaveAttribute("type", "date");
  });
});
