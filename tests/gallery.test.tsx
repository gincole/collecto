import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));
vi.mock("@/features/gallery/actions", () => ({
  saveGalleryConfigAction: vi.fn(),
}));

import CollectionLoading from "@/app/(app)/collections/[id]/loading";
import type { CollectionRecord } from "@/features/collections/models";
import { galleryConfigSchema } from "@/features/collections/schemas";
import {
  CollectionGallery,
  CollectionHeader,
} from "@/features/gallery/collection-gallery";
import { GalleryError } from "@/features/gallery/gallery-error";
import { GalleryGrid } from "@/features/gallery/gallery-grid";
import {
  getGalleryDisplayValues,
  sortGalleryItems,
} from "@/features/gallery/model";
import type { ItemFieldDefinition, ItemRecord } from "@/features/items/types";

const collectionId = "00000000-0000-4000-8000-000000000001";

function item(id: string, title: string, createdAt: string): ItemRecord {
  return {
    collectionId,
    createdAt,
    description: null,
    id,
    imagePath: null,
    title,
    updatedAt: createdAt,
    values: {},
  };
}

const earlier = item(
  "00000000-0000-4000-8000-000000000010",
  "Zebra",
  "2026-01-01T00:00:00.000Z",
);
const laterA = item(
  "00000000-0000-4000-8000-000000000011",
  "apple",
  "2026-02-01T00:00:00.000Z",
);
const laterB = item(
  "00000000-0000-4000-8000-000000000012",
  "Apple",
  "2026-02-01T00:00:00.000Z",
);

const selectFieldId = "00000000-0000-4000-8000-000000000020";
const ratingFieldId = "00000000-0000-4000-8000-000000000021";
const optionId = "00000000-0000-4000-8000-000000000030";
const fields: ItemFieldDefinition[] = [
  {
    id: selectFieldId,
    name: "Status",
    options: [{ id: optionId, label: "Remembered", position: 0 }],
    position: 0,
    required: false,
    type: "select",
  },
  {
    id: ratingFieldId,
    name: "Rating",
    options: [],
    position: 1,
    required: false,
    type: "rating",
  },
];

const baseConfig = {
  aspectRatio: "3:4" as const,
  columns: 3,
  imageFit: "cover" as const,
  showDetails: true,
  sortBy: "createdAt" as const,
  sortDirection: "desc" as const,
  spacing: "normal" as const,
  visibleFieldIds: ["title"] as ("title" | "description" | string)[],
};

const collection: CollectionRecord = {
  createdAt: "2026-01-01T00:00:00.000Z",
  description: "Stories worth keeping",
  fields,
  id: collectionId,
  imageCount: 0,
  itemCount: 2,
  name: "My Books",
  presetKey: "book",
  updatedAt: "2026-01-01T00:00:00.000Z",
  viewConfig: baseConfig,
};

describe("gallery sorting", () => {
  it("sorts newest and oldest with deterministic ID tie-breakers", () => {
    expect(
      sortGalleryItems([laterB, earlier, laterA], "createdAt", "desc").map(
        ({ id }) => id,
      ),
    ).toEqual([laterA.id, laterB.id, earlier.id]);

    expect(
      sortGalleryItems([laterB, earlier, laterA], "createdAt", "asc").map(
        ({ id }) => id,
      ),
    ).toEqual([earlier.id, laterA.id, laterB.id]);
  });

  it("sorts titles with browser-locale comparison then timestamp and ID", () => {
    expect(
      sortGalleryItems([laterB, earlier, laterA], "title", "asc").map(
        ({ id }) => id,
      ),
    ).toEqual([laterA.id, laterB.id, earlier.id]);

    expect(
      sortGalleryItems([laterB, earlier, laterA], "title", "desc").map(
        ({ id }) => id,
      ),
    ).toEqual([earlier.id, laterA.id, laterB.id]);
  });

  it("returns a new array without mutating query results", () => {
    const original = [laterB, earlier, laterA];
    const snapshot = [...original];

    sortGalleryItems(original, "createdAt", "desc");

    expect(original).toEqual(snapshot);
  });
});

describe("gallery values", () => {
  it("resolves ordered built-in and custom values while omitting missing data", () => {
    expect(
      getGalleryDisplayValues(
        {
          ...laterA,
          description: "A small memory",
          values: { [ratingFieldId]: 4, [selectFieldId]: optionId },
        },
        fields,
        ["title", selectFieldId, "description"],
      ),
    ).toEqual(["apple", "Remembered", "A small memory"]);

    expect(
      getGalleryDisplayValues(laterA, fields, [
        ratingFieldId,
        selectFieldId,
        "description",
      ]),
    ).toEqual([]);
  });
});

describe("responsive gallery", () => {
  it("uses cover/contain and keeps image failure inside the reserved ratio", () => {
    const imageItem = { ...earlier, imagePath: "private/image.jpg" };
    const { rerender } = render(
      <GalleryGrid
        collectionId={collectionId}
        config={baseConfig}
        fields={fields}
        items={[imageItem]}
      />,
    );
    expect(document.querySelector("img")).toHaveClass(
      "object-cover",
      "absolute",
    );
    rerender(
      <GalleryGrid
        collectionId={collectionId}
        config={{ ...baseConfig, imageFit: "contain", spacing: "tight" }}
        fields={fields}
        items={[imageItem]}
      />,
    );
    expect(document.querySelector("img")).toHaveClass("object-contain");
    expect(screen.getByRole("list")).toHaveClass("gap-2");
    const image = document.querySelector("img");
    if (!image) throw new Error("Expected the private image");
    fireEvent.error(image);
    expect(document.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getByTestId("gallery-image")).toHaveClass("aspect-[3/4]");
  });
  it("maps every saved column preference to a capped responsive grid", () => {
    const expectedClasses = {
      1: "grid-cols-1",
      2: "@[20.5rem]:grid-cols-2",
      3: "@[42rem]:grid-cols-3",
      4: "@[56rem]:grid-cols-4",
      5: "@[68rem]:grid-cols-5",
    } as const;

    for (const columns of [1, 2, 3, 4, 5] as const) {
      const { unmount } = render(
        <GalleryGrid
          collectionId={collectionId}
          config={{ ...baseConfig, columns }}
          fields={fields}
          items={[earlier]}
        />,
      );
      expect(screen.getByRole("list")).toHaveClass(expectedClasses[columns]);
      unmount();
    }
  });

  it("renders one-column cards horizontally and all five reserved image ratios", () => {
    const ratios = {
      "1:1": "aspect-square",
      "2:3": "aspect-[2/3]",
      "3:4": "aspect-[3/4]",
      "4:3": "aspect-[4/3]",
      "16:9": "aspect-video",
    } as const;

    for (const [aspectRatio, ratioClass] of Object.entries(ratios)) {
      const { unmount } = render(
        <GalleryGrid
          collectionId={collectionId}
          config={{
            ...baseConfig,
            aspectRatio: aspectRatio as keyof typeof ratios,
            columns: 1,
          }}
          fields={fields}
          items={[earlier]}
        />,
      );
      expect(screen.getByRole("article")).toHaveAttribute(
        "data-layout",
        "horizontal",
      );
      expect(screen.getByTestId("gallery-image")).toHaveClass(ratioClass);
      unmount();
    }
  });

  it("hides every visible label when details are off and keeps the card named", () => {
    render(
      <GalleryGrid
        collectionId={collectionId}
        config={{ ...baseConfig, columns: 1, showDetails: false }}
        fields={fields}
        items={[earlier]}
      />,
    );

    expect(screen.queryByText("Zebra")).not.toBeInTheDocument();
    expect(screen.getByRole("article")).toHaveAttribute(
      "data-layout",
      "horizontal",
    );
    expect(screen.getByRole("link", { name: "Open Zebra" })).toHaveAttribute(
      "href",
      `/collections/${collectionId}/items/${earlier.id}`,
    );
  });

  it("uses horizontal cards when narrow screens reduce the effective count to one", () => {
    render(
      <GalleryGrid
        collectionId={collectionId}
        config={baseConfig}
        fields={fields}
        items={[earlier]}
      />,
    );
    expect(screen.getByRole("article")).toHaveClass(
      "@max-[20.5rem]:grid",
      "@max-[20.5rem]:grid-cols-[minmax(6rem,35%)_minmax(0,1fr)]",
    );
  });

  it("sorts cards, truncates ordered details, and renders a missing-image state", () => {
    render(
      <GalleryGrid
        collectionId={collectionId}
        config={{ ...baseConfig, sortBy: "title", sortDirection: "asc" }}
        fields={fields}
        items={[earlier, laterB, laterA]}
      />,
    );

    const cards = screen.getAllByRole("listitem");
    expect(within(cards[0]).getByRole("link")).toHaveAccessibleName(
      "Open apple",
    );
    expect(screen.getAllByText("No image")).toHaveLength(3);
    expect(screen.getByText("apple")).toHaveClass("line-clamp-2");
  });

  it("has no detectable unit-level WCAG A or AA violations", async () => {
    const { container } = render(
      <GalleryGrid
        collectionId={collectionId}
        config={baseConfig}
        fields={fields}
        items={[earlier, laterA]}
      />,
    );

    const result = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
      },
    });
    expect(result.violations).toEqual([]);
  });
});

describe("gallery configuration validation", () => {
  it("rejects unsupported settings and duplicate or excess visible fields", () => {
    for (const change of [
      { columns: 0 },
      { columns: 6 },
      { aspectRatio: "9:16" },
      { imageFit: "stretch" },
      { showDetails: "false" },
      { spacing: "wide" },
      { sortBy: "rating" },
      { sortDirection: "up" },
      { visibleFieldIds: ["title", "title"] },
      {
        visibleFieldIds: ["title", "description", selectFieldId, ratingFieldId],
      },
    ]) {
      expect(
        galleryConfigSchema.safeParse({ ...baseConfig, ...change }).success,
      ).toBe(false);
    }
  });
});

describe("Collection gallery states", () => {
  it("renders Collection identity, item count, Add Item, and contextual actions", () => {
    render(<CollectionHeader collection={collection} />);

    expect(
      screen.getByRole("heading", { name: "My Books" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Stories worth keeping")).toBeInTheDocument();
    expect(screen.getByText("2 items")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add item" })).toHaveAttribute(
      "href",
      `/collections/${collectionId}/items/new`,
    );
    expect(
      screen.getByRole("link", { name: "Collection settings" }),
    ).toHaveAttribute("href", `/collections/${collectionId}/settings`);
    expect(
      screen.getByRole("link", { name: "Delete collection" }),
    ).toHaveAttribute(
      "href",
      `/collections/${collectionId}/settings#delete-collection`,
    );
  });

  it("directs an empty Collection to Add Item", () => {
    render(
      <CollectionGallery
        collection={{ ...collection, itemCount: 0 }}
        items={[]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "No items yet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Add your first item" }),
    ).toHaveAttribute("href", `/collections/${collectionId}/items/new`);
  });

  it("offers a retry for gallery query failures", async () => {
    const user = userEvent.setup();
    render(
      <GalleryError
        description="Items could not be loaded."
        title="Could not load Items"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(refreshMock).toHaveBeenCalledOnce();
  });

  it("renders a layout-preserving Collection gallery loading state", () => {
    render(<CollectionLoading />);

    expect(
      screen.getByRole("status", { name: "Loading collection gallery" }),
    ).toHaveAttribute("aria-busy", "true");
    expect(screen.getAllByTestId("gallery-card-skeleton")).toHaveLength(6);
  });
});
