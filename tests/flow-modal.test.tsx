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
  ModalActions,
  useFlowBusy,
} from "@/components/shared/flow-modal";
import { Select } from "@/components/ui/form-control";
import { chooseOption } from "./helpers/select-option";
import { useState } from "react";
const router = vi.hoisted(() => ({
  back: vi.fn(),
  replace: vi.fn(),
  push: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
beforeEach(() => vi.clearAllMocks());

describe("local modal flows", () => {
  it("waits for every pending operation before allowing dismissal", async () => {
    const user = userEvent.setup(),
      close = vi.fn();
    function Busy({ pending }: { pending: boolean }) {
      useFlowBusy(pending);
      return null;
    }
    const view = (first: boolean, second: boolean) => (
      <FlowModal title="Settings" onClose={close}>
        <Busy pending={first} />
        <Busy pending={second} />
      </FlowModal>
    );
    const { rerender } = render(view(true, true));
    rerender(view(false, true));
    expect(screen.getByRole("button", { name: "Close" })).toBeDisabled();
    rerender(view(false, false));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(close).toHaveBeenCalledOnce();
  });
  it.each(["close", "escape", "backdrop"])(
    "opens immediately without navigation and dismisses with %s",
    async (method) => {
      const user = userEvent.setup();
      function Screen() {
        const [open, setOpen] = useState(false);
        return (
          <>
            <button onClick={() => setOpen(true)}>Open</button>
            {open ? (
              <FlowModal title="Settings" onClose={() => setOpen(false)}>
                <label>
                  Name
                  <input defaultValue="Books" />
                </label>
              </FlowModal>
            ) : null}
          </>
        );
      }
      const url = window.location.href;
      render(<Screen />);
      const trigger = screen.getByRole("button", { name: "Open" });
      await user.click(trigger);
      expect(screen.getByRole("dialog", { name: "Settings" })).toBeVisible();
      expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
      if (method === "close")
        await user.click(screen.getByRole("button", { name: "Close" }));
      else if (method === "escape") await user.keyboard("{Escape}");
      else {
        const overlay = document.querySelector(".dialog-overlay");
        if (!overlay) throw Error("Missing backdrop");
        await user.click(overlay);
      }
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expect(trigger).toHaveFocus();
      expect(window.location.href).toBe(url);
      expect(router.push).not.toHaveBeenCalled();
      expect(router.replace).not.toHaveBeenCalled();
      expect(router.back).not.toHaveBeenCalled();
    },
  );
  it("submits from a fixed footer outside the scrolling body", async () => {
    const user = userEvent.setup(),
      save = vi.fn();
    render(
      <FlowModal title="Add item" onClose={vi.fn()}>
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
    const button = within(screen.getByRole("dialog")).getByRole("button", {
      name: "Save",
    });
    expect(button.closest("[data-modal-footer]")).not.toBeNull();
    expect(button.closest(".flow-modal-body")).toBeNull();
    await user.click(button);
    expect(save).toHaveBeenCalledExactlyOnceWith("Memory");
  });
  it("routes every dismissal through the dirty guard and blocks them while saving", async () => {
    const user = userEvent.setup(),
      guard = vi.fn(),
      close = vi.fn();
    const view = (busy: boolean) => (
      <FlowModal title="Settings" onClose={close}>
        <FlowGuard onClose={guard} busy={busy} />
      </FlowModal>
    );
    const { rerender } = render(view(false));
    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.keyboard("{Escape}");
    const overlay = document.querySelector(".dialog-overlay");
    if (!overlay) throw Error("Missing backdrop");
    await user.click(overlay);
    expect(guard).toHaveBeenCalledTimes(3);
    expect(close).not.toHaveBeenCalled();
    rerender(view(true));
    expect(screen.getByRole("button", { name: "Close" })).toBeDisabled();
    await user.keyboard("{Escape}");
    await user.click(overlay);
    expect(guard).toHaveBeenCalledTimes(3);
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
