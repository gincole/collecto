import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FlowGuard,
  FlowModal,
  InterceptedFlows,
  ModalActions,
} from "@/components/shared/flow-modal";
import { Select } from "@/components/ui/form-control";
import { chooseOption } from "./helpers/select-option";
import { useState } from "react";
import NavigationLink from "@/components/shared/navigation-link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const router = vi.hoisted(() => ({ back: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
beforeEach(() => vi.clearAllMocks());

describe("modal flows", () => {
  it.each(["Collection settings", "Rename My Books"])(
    "restores the menu opener after %s",
    async (label) => {
      const user = userEvent.setup();
      function Screen() {
        const [open, setOpen] = useState(false);
        return (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <NavigationLink
                    href="/collections/new"
                    onClick={(event) => {
                      event.preventDefault();
                      setOpen(true);
                    }}
                  >
                    {label}
                  </NavigationLink>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {open ? (
              <InterceptedFlows>
                <FlowModal title={label} returnTo="/library">
                  <FlowGuard onBack={() => setOpen(false)} busy={false} />
                </FlowModal>
              </InterceptedFlows>
            ) : null}
          </>
        );
      }
      render(<Screen />);
      const opener = screen.getByRole("button", { name: "Actions" });
      await user.click(opener);
      await user.click(screen.getByRole("menuitem", { name: label }));
      await user.click(screen.getByRole("button", { name: "Back" }));
      await waitFor(() => expect(opener).toHaveFocus());
    },
  );
  it("submits the form from a footer outside the scrolling body", async () => {
    const user = userEvent.setup();
    const save = vi.fn();
    render(
      <FlowModal title="Add item" returnTo="/library">
        <form
          id="item"
          onSubmit={(event) => {
            event.preventDefault();
            save(new FormData(event.currentTarget).get("title"));
          }}
        >
          <label>
            Title
            <input name="title" defaultValue="Memory" />
          </label>
          <ModalActions>
            <button type="submit" form="item">
              Save
            </button>
          </ModalActions>
        </form>
      </FlowModal>,
    );
    const dialog = screen.getByRole("dialog", { name: "Add item" });
    const saveButton = within(dialog).getByRole("button", { name: "Save" });
    expect(saveButton.closest("[data-modal-footer]")).not.toBeNull();
    expect(saveButton.closest(".flow-modal-body")).toBeNull();
    await user.click(saveButton);
    expect(save).toHaveBeenCalledExactlyOnceWith("Memory");
  });

  it("uses the canonical return path on a direct load and history when intercepted", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <FlowModal title="Settings" returnTo="/library">
        Fields
      </FlowModal>,
    );
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(router.replace).toHaveBeenCalledWith("/library");
    unmount();
    render(
      <InterceptedFlows>
        <FlowModal title="Settings" returnTo="/library">
          Fields
        </FlowModal>
      </InterceptedFlows>,
    );
    await user.keyboard("{Escape}");
    expect(router.back).toHaveBeenCalledOnce();
  });

  it("respects a dirty guard and prevents leaving during a mutation", async () => {
    const user = userEvent.setup();
    const guard = vi.fn();
    const view = (busy: boolean) => (
      <FlowModal title="Settings" returnTo="/library">
        <FlowGuard onBack={guard} busy={busy} />
      </FlowModal>
    );
    const { rerender } = render(view(false));
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(guard).toHaveBeenCalledOnce();
    expect(router.replace).not.toHaveBeenCalled();
    rerender(view(true));
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(guard).toHaveBeenCalledOnce();
  });

  it("serializes a shared Select and preserves its controlled draft after action resets", async () => {
    const user = userEvent.setup();
    function Form() {
      const [value, setValue] = useState("");
      return (
        <form aria-label="Draft">
          <label htmlFor="kind">Kind</label>
          <Select
            id="kind"
            name="kind"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          >
            <option value="">Choose</option>
            <option value="book">Book</option>
          </Select>
        </form>
      );
    }
    render(<Form />);
    await chooseOption(
      user,
      screen.getByRole("combobox", { name: "Kind" }),
      "book",
    );
    const form = screen.getByRole("form", { name: "Draft" });
    if (!(form instanceof HTMLFormElement)) throw new Error("Missing form");
    expect(new FormData(form).getAll("kind")).toEqual(["book"]);
    fireEvent.reset(form);
    await waitFor(() =>
      expect(screen.getByRole("combobox")).toHaveTextContent("Book"),
    );
    expect(new FormData(form).get("kind")).toBe("book");
  });
});
