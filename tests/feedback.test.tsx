import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

vi.mock("next/navigation", () => ({
  usePathname: () => "/library",
  useSearchParams: () => new URLSearchParams(window.location.search),
  useRouter: () => ({ refresh: vi.fn() }),
}));
import {
  FeedbackProvider,
  FeedbackRegion,
  useFeedback,
} from "@/components/shared/feedback";
import {
  feedbackHref,
  feedbackMessage,
} from "@/components/shared/feedback-messages";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FormLoading } from "@/components/shared/form-loading";
import { PageLoadError } from "@/components/shared/page-load-error";
import { fieldActionsWithFeedback } from "@/features/fields/feedback-actions";
import type {
  ActionResult,
  FieldManagerActions,
} from "@/features/fields/field-manager-contract";

function Harness() {
  const notify = useFeedback();
  return (
    <>
      <FeedbackRegion />
      <button onClick={() => notify("Field saved.", "success")}>
        Complete
      </button>
      <button onClick={() => notify("Could not save. Try again.", "error")}>
        Fail
      </button>
    </>
  );
}

describe("application feedback", () => {
  afterEach(() => vi.useRealTimers());
  it("slides out and automatically dismisses, pausing while hovered", () => {
    vi.useFakeTimers();
    render(
      <FeedbackProvider>
        <Harness />
      </FeedbackProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Complete" }));
    expect(screen.getByTestId("notification-toast")).toHaveAttribute(
      "data-state",
      "open",
    );
    fireEvent.mouseEnter(screen.getByTestId("notification-toast"));
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByRole("status")).toBeInTheDocument();
    fireEvent.mouseLeave(screen.getByTestId("notification-toast"));
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByTestId("notification-toast")).toHaveAttribute(
      "data-state",
      "closed",
    );
    act(() => vi.advanceTimersByTime(180));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
  it("keeps an error readable while keyboard focus is inside the toast", () => {
    vi.useFakeTimers();
    render(
      <FeedbackProvider>
        <Harness />
      </FeedbackProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Fail" }));
    fireEvent.focus(
      screen.getByRole("button", { name: "Dismiss notification" }),
    );
    act(() => vi.advanceTimersByTime(20000));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.blur(
      screen.getByRole("button", { name: "Dismiss notification" }),
    );
    act(() => vi.advanceTimersByTime(6000));
    act(() => vi.advanceTimersByTime(180));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("announces redirect feedback once and removes only its query parameter", () => {
    window.history.replaceState(
      {},
      "",
      "/library?feedback=item-created&keep=value",
    );
    // This harness exercises the live URL through the navigation hook below.
    render(
      <FeedbackProvider>
        <FeedbackRegion />
      </FeedbackProvider>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Item created.");
    expect(window.location.search).toBe("?keep=value");
    window.history.replaceState({}, "", "/");
  });
  it("announces outcomes with distinct live roles and lets the user dismiss them", async () => {
    render(
      <FeedbackProvider>
        <Harness />
      </FeedbackProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Complete" }));
    expect(screen.getByRole("status")).toHaveTextContent("Field saved.");
    fireEvent.click(screen.getByRole("button", { name: "Fail" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Could not save. Try again.",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss notification" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    );
  });
  it("uses allowlisted navigation messages without reflecting arbitrary URL text", () => {
    expect(feedbackHref("/library", "collection-deleted")).toBe(
      "/library?feedback=collection-deleted",
    );
    expect(feedbackMessage("item-created")).toBe("Item created.");
    expect(feedbackMessage("<script>bad</script>")).toBeUndefined();
  });
  it("keeps action labels from shrinking and leaves typography to design utilities", () => {
    render(<Button variant="destructive">Delete collection</Button>);
    expect(screen.getByRole("button")).toHaveClass("shrink-0", "max-w-full");
    const css = readFileSync("app/globals.css", "utf8");
    expect(css).not.toMatch(
      /button,\s*input,\s*textarea,\s*select\s*\{\s*font:\s*inherit/,
    );
  });
  it("keeps destructive confirmations open while a mutation is pending", () => {
    const close = vi.fn();
    render(
      <ConfirmDialog
        open
        isPending
        title="Delete Item?"
        description="This cannot be undone."
        confirmLabel="Delete"
        onOpenChange={close}
        onConfirm={vi.fn()}
      />,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(close).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Working…" })).toBeDisabled();
  });
  it("renders distinct form loading and a recoverable page failure", () => {
    const { rerender } = render(<FormLoading label="Loading Item" image />);
    expect(
      screen.getByRole("status", { name: "Loading Item" }),
    ).toHaveAttribute("aria-busy", "true");
    rerender(<PageLoadError />);
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to My Library" }),
    ).toHaveAttribute("href", "/library");
  });
  it("reports Field outcomes and converts thrown requests into retryable structured errors", async () => {
    const operation = vi.fn(async (): Promise<ActionResult> => ({
      status: "success",
    }));
    const actions: FieldManagerActions = {
      createField: operation,
      createOption: operation,
      deleteField: operation,
      deleteOption: operation,
      getFieldImpact: operation,
      getOptionImpact: operation,
      reorderFields: operation,
      reorderOptions: operation,
      updateField: operation,
      updateOption: operation,
    };
    const notify = vi.fn();
    const safe = fieldActionsWithFeedback(actions, notify);
    const input = {
      collectionId: "00000000-0000-4000-8000-000000000001",
      fieldId: "00000000-0000-4000-8000-000000000002",
      name: "Changed",
    };
    await safe.updateField(input);
    expect(notify).toHaveBeenCalledWith("Field saved.", "success");
    operation.mockRejectedValueOnce(new Error("Network failure"));
    expect(await safe.updateField(input)).toEqual({ status: "error" });
    expect(notify).toHaveBeenLastCalledWith(
      "Could not save field. Try again.",
      "error",
    );
  });
});
