vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ItemForm } from "@/features/items/item-form";
import { ItemDetails } from "@/features/items/item-details";

const collectionId = "00000000-0000-4000-8000-000000000001";
const fieldId = "00000000-0000-4000-8000-000000000010";

describe("Item form", () => {
  it("renders schema fields in order and focuses the first server error", async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => ({
      fieldErrors: { [`values.${fieldId}`]: "Enter Rating." },
      status: "error" as const,
    }));
    render(
      <ItemForm
        action={action}
        collectionId={collectionId}
        fields={[
          {
            id: fieldId,
            name: "Rating",
            options: [],
            position: 0,
            required: true,
            type: "rating",
          },
        ]}
        mode="create"
      />,
    );

    expect(screen.getByLabelText("Title")).toBeRequired();
    expect(screen.getByLabelText("Rating")).toHaveAttribute(
      "inputmode",
      "numeric",
    );
    await user.type(screen.getByLabelText("Title"), "A memory");
    await user.type(screen.getByLabelText("Rating"), "4");
    await user.click(screen.getByRole("button", { name: "Save item" }));
    expect(await screen.findByText("Enter Rating.")).toBeVisible();
    expect(screen.getByLabelText("Rating")).toHaveFocus();
  });

  it("preserves values and blocks duplicate submission during a recoverable failure", async () => {
    Object.defineProperties(URL, {
      createObjectURL: { configurable: true, value: vi.fn(() => "blob:test") },
      revokeObjectURL: { configurable: true, value: vi.fn() },
    });
    const user = userEvent.setup();
    let finish:
      ((value: { message: string; status: "error" }) => void) | undefined;
    const action = vi.fn(
      () =>
        new Promise<{ message: string; status: "error" }>((resolve) => {
          finish = resolve;
        }),
    );
    render(
      <ItemForm
        action={action}
        collectionId={collectionId}
        fields={[]}
        mode="create"
      />,
    );
    await user.type(screen.getByLabelText("Title"), "Kept value");
    const image = new File([new Uint8Array([1])], "kept.png", {
      type: "image/png",
    });
    await user.upload(screen.getByLabelText("Item image"), image);
    await user.click(screen.getByRole("button", { name: "Save item" }));
    expect(screen.getByRole("button", { name: "Saving item…" })).toBeDisabled();
    expect(action).toHaveBeenCalledOnce();
    finish?.({
      message: "Could not save the Item. Try again.",
      status: "error",
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not save",
    );
    expect(screen.getByLabelText("Title")).toHaveValue("Kept value");
    expect(
      screen.getByLabelText<HTMLInputElement>("Item image").files?.[0],
    ).toBe(image);
  });
});

describe("Item details", () => {
  it("distinguishes image load failure from missing images and offers a fresh retry", async () => {
    const user = userEvent.setup();
    render(
      <ItemDetails
        collectionId={collectionId}
        fields={[]}
        item={{
          id: "00000000-0000-4000-8000-000000000002",
          collectionId,
          title: "Retry memory",
          description: null,
          imagePath: "private/image.jpg",
          values: {},
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        }}
      />,
    );
    fireEvent.error(screen.getByRole("img", { name: "Retry memory" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Image could not be loaded",
    );
    expect(screen.queryByText("No image")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try image again" }));
    expect(screen.getByRole("img", { name: "Retry memory" })).toHaveAttribute(
      "src",
      expect.stringContaining("?retry=1"),
    );
  });
  it("shows a neutral no-image state and secondary edit/delete actions", () => {
    render(
      <ItemDetails
        collectionId={collectionId}
        fields={[]}
        item={{
          collectionId,
          createdAt: "2026-10-30T00:00:00Z",
          description: null,
          id: "00000000-0000-4000-8000-000000000002",
          imagePath: null,
          title: "A memory",
          updatedAt: "2026-10-30T00:00:00Z",
          values: {},
        }}
      />,
    );
    expect(screen.getByText("No image")).toBeVisible();
    expect(screen.getByRole("link", { name: "Edit item" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Delete item" })).toBeVisible();
  });

  it("keeps deletion failures perceivable inside the confirmation dialog", async () => {
    const user = userEvent.setup();
    render(
      <ItemDetails
        collectionId={collectionId}
        deleteAction={vi.fn(async () => ({
          message: "Could not delete the Item. Try again.",
          status: "error" as const,
        }))}
        fields={[]}
        item={{
          collectionId,
          createdAt: "2026-10-30T00:00:00Z",
          description: null,
          id: "00000000-0000-4000-8000-000000000002",
          imagePath: null,
          title: "A memory",
          updatedAt: "2026-10-30T00:00:00Z",
          values: {},
        }}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Delete item" }));
    const dialog = screen.getByRole("alertdialog");
    await user.click(
      screen.getByRole("button", { name: "Delete permanently" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not delete",
    );
    expect(dialog).toBeVisible();
  });
});
