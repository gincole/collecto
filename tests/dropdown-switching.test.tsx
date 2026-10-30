import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Select } from "@/components/ui/form-control";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PageContainer } from "@/components/shared/page-container";
import { AuthShell } from "@/features/auth/auth-shell";
import { readFileSync } from "node:fs";
import axe from "axe-core";

function Choices() {
  return (
    <>
      <label htmlFor="columns">Columns</label>
      <Select id="columns" name="columns" defaultValue="3">
        <option value="3">Three</option>
        <option value="4">Four</option>
      </Select>
      <label htmlFor="ratio">Ratio</label>
      <Select id="ratio" defaultValue="square">
        <option value="square">Square</option>
        <option value="wide">Wide</option>
      </Select>
    </>
  );
}

describe("dropdown switching", () => {
  it("makes the exiting popup inert and keeps focus in the new popup through animation completion", async () => {
    const user = userEvent.setup();
    render(
      <>
        <style>{`.dropdown-content[data-state="open"] {animation-name: none;} .dropdown-content[data-state="closed"] {animation-name: popup-exit; animation-duration: 150ms;}`}</style>
        <Choices />
      </>,
    );
    await user.click(screen.getByRole("combobox", { name: "Columns" }));
    const oldPopup = screen.getByRole("listbox");
    await user.click(screen.getByRole("combobox", { name: "Ratio" }));
    expect(oldPopup).toHaveAttribute("data-state", "closed");
    expect(oldPopup).toHaveAttribute("inert");
    expect(oldPopup).toHaveAttribute("aria-hidden", "true");
    expect(screen.getAllByRole("listbox")).toHaveLength(1);
    const end = new Event("animationend", { bubbles: true });
    Object.defineProperty(end, "animationName", { value: "popup-exit" });
    fireEvent(oldPopup, end);
    await waitFor(() => expect(oldPopup).not.toBeInTheDocument());
    expect(screen.getByRole("option", { name: "Square" })).toHaveFocus();
  });
  it("preserves ArrowUp opening, collapsed typeahead and valid popup labeling", async () => {
    const user = userEvent.setup();
    render(<Choices />);
    const first = screen.getByRole("combobox", { name: "Columns" });
    first.focus();
    await user.keyboard("f");
    expect(first).toHaveTextContent("Four");
    await user.keyboard("{ArrowUp}");
    const popup = screen.getByRole("listbox");
    expect(popup).toHaveAttribute("aria-labelledby", first.id);
    const labelId = popup.getAttribute("aria-labelledby");
    expect(labelId ? document.getElementById(labelId) : null).toBe(first);
    expect(screen.getByRole("option", { name: "Four" })).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(first).toHaveFocus());
  });
  it("closes the previous Select and opens the next with one click inside a dialog", async () => {
    const user = userEvent.setup();
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gallery settings</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <DialogDescription>Choose appearance</DialogDescription>
            <Choices />
          </DialogBody>
        </DialogContent>
      </Dialog>,
    );
    const first = screen.getByRole("combobox", { name: "Columns" }),
      second = screen.getByRole("combobox", { name: "Ratio" });
    await user.click(first);
    expect(screen.getByRole("option", { name: "Three" })).toBeVisible();
    expect(screen.getByRole("listbox").closest('[role="dialog"]')).toBe(
      screen.getByRole("dialog"),
    );
    const audit = await axe.run(screen.getByRole("dialog"), {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(audit.violations).toEqual([]);
    await user.click(second);
    await waitFor(() =>
      expect(first).toHaveAttribute("aria-expanded", "false"),
    );
    expect(second).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByRole("option", { name: "Three" })).toBeNull();
    expect(screen.getByRole("option", { name: "Square" })).toBeVisible();
    expect(screen.getAllByRole("listbox")).toHaveLength(1);
    await user.click(screen.getByRole("option", { name: "Wide" }));
    expect(second).toHaveTextContent("Wide");
    await waitFor(() => expect(second).toHaveFocus());
    await user.click(first);
    expect(screen.getByRole("listbox")).toHaveClass("dropdown-content");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(first).toHaveTextContent("Four");
  });

  it("switches between shared action menus and Select without overlapping popups", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Choices />
        <DropdownMenu>
          <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Settings</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>,
    );
    const select = screen.getByRole("combobox", { name: "Columns" });
    await user.click(select);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getByRole("menu")).toHaveClass("dropdown-content");
    await user.click(select);
    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.getAllByRole("listbox")).toHaveLength(1);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(select).toHaveFocus());
  });
});

describe("page bottom spacing", () => {
  it("doubles only bottom padding and animates both popup states with reduced-motion support", () => {
    const css = readFileSync("app/globals.css", "utf8");
    expect(css).toContain("--spacing-page-block-mobile: 2rem");
    expect(css).toContain("--spacing-page-block-desktop: 3rem");
    expect(css).toContain("padding-top: var(--page-block-space)");
    expect(css).toMatch(
      /padding-bottom:\s*max\(\s*calc\(var\(--page-block-space\) \* 2\),\s*env\(safe-area-inset-bottom\)\s*\)/,
    );
    expect(css).toContain('.dropdown-content[data-state="open"]');
    expect(css).toContain('.dropdown-content[data-state="closed"]');
    expect(css).toContain("@keyframes dropdown-show");
    expect(css).toContain("@keyframes dropdown-hide");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });
  it("uses the shared doubled-bottom spacing on standard and authentication pages", () => {
    const { unmount } = render(
      <PageContainer as="main">Library</PageContainer>,
    );
    expect(screen.getByRole("main")).toHaveClass("page-block-space");
    unmount();
    render(<AuthShell>Login</AuthShell>);
    expect(screen.getByRole("main")).toHaveClass("page-block-space");
  });
});
