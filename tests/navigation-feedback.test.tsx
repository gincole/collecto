import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const status = vi.hoisted(() => ({ pending: false }));
vi.mock("next/link", async (original) => ({
  ...(await original<typeof import("next/link")>()),
  useLinkStatus: () => status,
}));

import Link from "@/components/shared/navigation-link";
import { ErrorState } from "@/components/shared/error-state";
import { GalleryImage } from "@/features/gallery/gallery-image";
import { LoadingImage } from "@/components/shared/loading-image";
import RootLoading from "@/app/loading";

describe("async interaction feedback", () => {
  it("shows navigation progress only while a link is pending", () => {
    const { rerender } = render(<Link href="/library">My Library</Link>);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    status.pending = true;
    rerender(<Link href="/library">My Library</Link>);
    expect(screen.getByRole("status")).toHaveTextContent("Loading page");
    expect(screen.getByRole("link")).toHaveAttribute("href", "/library");
    status.pending = false;
    rerender(<Link href="/library">My Library</Link>);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows retry progress and blocks repeated requests until recovery completes", async () => {
    const request = Promise.withResolvers<void>();
    const retry = vi.fn(() => request.promise);
    render(
      <ErrorState
        title="Unavailable"
        description="Try again"
        onRetry={retry}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    const button = screen.getByRole("button", { name: "Retrying…" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    fireEvent.click(button);
    expect(retry).toHaveBeenCalledTimes(1);
    await act(async () => request.resolve());
    expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
  });

  it("keeps image space reserved with a skeleton until load or failure", () => {
    render(
      <GalleryImage
        aspectRatio="3:4"
        imageFit="cover"
        item={{
          id: "item",
          collectionId: "collection",
          title: "Book",
          description: null,
          imagePath: "private/image",
          values: {},
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        }}
      />,
    );
    expect(
      screen.getByRole("status", { name: "Loading image" }),
    ).toBeInTheDocument();
    const img = screen.getByRole("presentation");
    fireEvent.load(img);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    fireEvent.error(img);
    expect(screen.getByText("No image")).toBeInTheDocument();
  });

  it("starts a new image skeleton when its source changes", () => {
    const { rerender } = render(<LoadingImage alt="Preview" src="/first" />);
    fireEvent.load(screen.getByRole("img", { name: "Preview" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    rerender(<LoadingImage alt="Preview" src="/second" />);
    expect(
      screen.getByRole("status", { name: "Loading image" }),
    ).toBeInTheDocument();
    fireEvent.error(screen.getByRole("img", { name: "Preview" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("covers initial layout and session loading with the root skeleton", () => {
    render(<RootLoading />);
    expect(
      screen.getByRole("status", { name: "Loading page" }),
    ).toHaveAttribute("aria-busy", "true");
  });
});
