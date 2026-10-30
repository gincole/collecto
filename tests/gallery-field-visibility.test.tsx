import { useState, type ComponentProps } from "react";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { DragEndEvent } from "@dnd-kit/core";
import { GalleryFieldVisibility } from "@/features/gallery/gallery-field-visibility";

const handlers = vi.hoisted(() => {
  const value: { drop?: (event: DragEndEvent) => void } = {};
  return value;
});
vi.mock("@dnd-kit/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@dnd-kit/core")>();
  return {
    ...actual,
    DndContext: (props: ComponentProps<typeof actual.DndContext>) => {
      handlers.drop = props.onDragEnd;
      return <actual.DndContext {...props} />;
    },
  };
});
const fields = [
  { id: "title", name: "Title" },
  { id: "description", name: "Description" },
  { id: "notes", name: "Notes" },
  { id: "other", name: "Other" },
];
function Harness({
  initial = ["title", "description"],
  disabled = false,
}: {
  initial?: string[];
  disabled?: boolean;
}) {
  const [value, setValue] = useState(initial);
  return (
    <GalleryFieldVisibility
      fields={fields}
      value={value}
      onChange={setValue}
      disabled={disabled}
    />
  );
}
function drop(id: string, target: string | null) {
  const event: DragEndEvent = {
    active: {
      id,
      data: { current: {} },
      rect: { current: { initial: null, translated: null } },
    },
    over: target
      ? {
          id: target,
          data: { current: {} },
          disabled: false,
          rect: {
            top: 0,
            left: 0,
            right: 100,
            bottom: 44,
            width: 100,
            height: 44,
          },
        }
      : null,
    activatorEvent: new Event("pointerdown"),
    collisions: null,
    delta: { x: 0, y: 0 },
  };
  act(() => handlers.drop?.(event));
}
function visible() {
  return within(screen.getByRole("list", { name: "Visible" }))
    .getAllByRole("listitem")
    .map((row) => row.textContent);
}

describe("Gallery field drag targets", () => {
  it("uses icons on list headings and has no eye buttons or separator", () => {
    render(<Harness />);
    expect(
      screen.getByRole("heading", { name: "Visible" }).querySelector("svg"),
    ).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Hidden" }).querySelector("svg"),
    ).not.toBeNull();
    expect(screen.queryByRole("separator")).toBeNull();
    expect(screen.queryByRole("button", { name: /^(Show|Hide) / })).toBeNull();
  });
  it("moves with keyboard shortcuts without eye buttons", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    screen
      .getByRole("button", { name: "Drag Title to change visibility or order" })
      .focus();
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(visible()).toEqual(["Description"]);
    expect(
      screen.getByRole("button", {
        name: "Drag Title to change visibility or order",
      }),
    ).toHaveFocus();
    screen
      .getByRole("button", { name: "Drag Title to change visibility or order" })
      .focus();
    await user.keyboard("{Alt>}{ArrowUp}{/Alt}");
    expect(visible()).toEqual(["Description", "Title"]);
  });
  it("reorders over rows and the Visible container", () => {
    render(<Harness />);
    drop("description", "title");
    expect(visible()).toEqual(["Description", "Title"]);
    drop("description", "gallery-Visible");
    expect(visible()).toEqual(["Title", "Description"]);
  });
  it("moves between populated and empty lists", () => {
    render(<Harness initial={[]} />);
    drop("notes", "gallery-Visible");
    expect(visible()).toEqual(["Notes"]);
    drop("notes", "gallery-Hidden");
    expect(visible()).toEqual(["Drag fields here"]);
    drop("title", "gallery-Visible");
    drop("description", "title");
    expect(visible()).toEqual(["Description", "Title"]);
  });
  it("rejects a fourth field and ignores outside or disabled drops", () => {
    const { rerender } = render(
      <Harness initial={["title", "description", "notes"]} />,
    );
    drop("other", "gallery-Visible");
    expect(visible()).toEqual(["Title", "Description", "Notes"]);
    expect(
      screen.getByRole("status", { name: "Field visibility" }),
    ).toHaveTextContent("Choose up to three");
    drop("title", null);
    expect(visible()).toEqual(["Title", "Description", "Notes"]);
    rerender(<Harness disabled />);
    drop("title", "gallery-Hidden");
    expect(visible()).toEqual(["Title", "Description", "Notes"]);
  });
});
