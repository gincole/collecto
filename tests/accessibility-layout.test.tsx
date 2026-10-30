import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SkipLink } from "@/components/shared/skip-link";
import { PageContainer } from "@/components/shared/page-container";
import { AuthShell } from "@/features/auth/auth-shell";
import { AppHeader } from "@/components/shared/app-header";
import { ItemForm } from "@/features/items/item-form";
import RootNotFound from "@/app/not-found";
import { CollectionSchemaEditor } from "@/features/collections/collection-schema-editor";
import { Input, Select } from "@/components/ui/form-control";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

describe("accessible shared layout", () => {
  it("includes the visible checkbox label in its accessible name", () => {
    render(
      <CollectionSchemaEditor
        fields={[
          {
            key: "draft",
            name: "Author",
            type: "text",
            required: false,
            options: [],
          },
        ]}
        disabled={false}
        errors={{}}
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole("checkbox")).toHaveAccessibleName(/Required field/);
  });
  it("retains the skip target on unmatched routes", () => {
    render(<RootNotFound />);
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
  });
  it("keeps Item actions in document flow rather than overlaying mobile fields", () => {
    render(
      <ItemForm
        collectionId="collection"
        fields={[]}
        mode="create"
        action={async () => ({ status: "idle" })}
      />,
    );
    const actions = screen.getByRole("button", {
      name: "Save item",
    }).parentElement;
    expect(actions).not.toHaveClass("fixed");
    expect(actions).not.toHaveClass("sticky");
  });
  it("keeps primary navigation below the top safe area", () => {
    render(
      <AppHeader
        email="owner@example.invalid"
        logoutAction={async () => ({ status: "idle" })}
      />,
    );
    expect(screen.getByRole("banner")).toHaveClass(
      "pt-[env(safe-area-inset-top)]",
    );
  });
  it("provides a first keyboard stop pointing to the focusable main landmark", async () => {
    const user = userEvent.setup();
    render(
      <>
        <SkipLink />
        <button>Navigation</button>
        <PageContainer as="main">Content</PageContainer>
      </>,
    );
    await user.tab();
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveFocus();
    expect(screen.getByRole("link")).toHaveAttribute("href", "#main-content");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.getByRole("main")).toHaveAttribute("tabindex", "-1");
  });
  it("uses the same skip target on authentication pages", () => {
    render(<AuthShell>Log in</AuthShell>);
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.getByRole("main")).toHaveAttribute("tabindex", "-1");
  });
  it("constrains long dialogs to the viewport and provides a contained scroll region", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Long confirmation</DialogTitle>
          <DialogDescription>{"Long name ".repeat(30)}</DialogDescription>
          <button>Cancel</button>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByRole("dialog")).toHaveClass(
      "max-h-[calc(100dvh-2rem)]",
      "overflow-y-auto",
      "overscroll-contain",
      "break-words",
    );
  });
  it("allows native controls to shrink inside narrow grid columns", () => {
    render(
      <>
        <Input aria-label="Date" type="date" />
        <Select aria-label="Category">
          <option>{"Long label".repeat(7)}</option>
        </Select>
      </>,
    );
    expect(screen.getByLabelText("Date")).toHaveClass("min-w-0");
    expect(screen.getByLabelText("Category")).toHaveClass("min-w-0");
  });
});
