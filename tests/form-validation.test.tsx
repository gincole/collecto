import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ItemForm } from "@/features/items/item-form";
import { AuthForm } from "@/features/auth/auth-form";

describe("custom form validation", () => {
  it.each(["number", "rating", "date"] as const)(
    "does not serialize unfinished optional %s input as an empty saved value",
    async (type) => {
      const user = userEvent.setup();
      const collectionId = "00000000-0000-4000-8000-000000000001";
      const fieldId = "00000000-0000-4000-8000-000000000002";
      const action = vi.fn(async () => ({ status: "idle" as const }));
      render(
        <ItemForm
          collectionId={collectionId}
          mode="edit"
          action={action}
          fields={[
            {
              id: fieldId,
              name: "Value",
              type,
              required: false,
              position: 0,
              options: [],
            },
          ]}
          item={{
            id: fieldId,
            collectionId,
            title: "Keep existing value",
            description: null,
            values: { [fieldId]: type === "date" ? "2026-01-01" : 4 },
            createdAt: "2026-01-01",
            updatedAt: "2026-01-01",
          }}
        />,
      );
      const input = screen.getByLabelText("Value");
      fireEvent.change(input, { target: { value: "" } });
      // Browsers expose unfinished native number/date input through badInput while serializing it as empty.
      Object.defineProperty(input, "validity", {
        configurable: true,
        value: { badInput: true },
      });
      await user.click(screen.getByRole("button", { name: "Save changes" }));
      expect(await screen.findByText("Enter a valid value.")).toBeVisible();
      expect(input).toHaveFocus();
      expect(action).not.toHaveBeenCalled();
    },
  );
  it("submits an empty required Select to custom validation and focuses its inline error", async () => {
    const user = userEvent.setup();
    const fieldId = "00000000-0000-4000-8000-000000000002";
    const action = vi.fn(async () => ({
      status: "error" as const,
      fieldErrors: { [`values.${fieldId}`]: "Choose a Type." },
    }));
    render(
      <ItemForm
        collectionId="00000000-0000-4000-8000-000000000001"
        mode="create"
        action={action}
        fields={[
          {
            id: fieldId,
            name: "Type",
            type: "select",
            required: true,
            position: 0,
            options: [],
          },
        ]}
      />,
    );
    expect(screen.getByLabelText("Type").closest("form")).toHaveAttribute(
      "novalidate",
    );
    await user.type(screen.getByLabelText("Title"), "Keep my title");
    await user.click(screen.getByRole("button", { name: "Save item" }));
    expect(action).toHaveBeenCalledOnce();
    expect(await screen.findByText("Choose a Type.")).toBeVisible();
    expect(screen.getByLabelText("Type")).toHaveFocus();
    expect(screen.getByLabelText("Title")).toHaveValue("Keep my title");
  });
  it("uses custom Auth errors instead of native email/password popups", async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => ({
      status: "error" as const,
      fieldErrors: { email: "Enter a valid email." },
    }));
    render(<AuthForm action={action} mode="login" />);
    expect(screen.getByLabelText("Email").closest("form")).toHaveAttribute(
      "novalidate",
    );
    await user.type(screen.getByLabelText("Email"), "invalid-email");
    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(action).toHaveBeenCalledOnce();
    expect(await screen.findByText("Enter a valid email.")).toBeVisible();
    expect(screen.getByLabelText("Email")).toHaveFocus();
    expect(screen.getByLabelText("Email")).toHaveValue("invalid-email");
  });
});
