import { describe, expect, it } from "vitest";

import {
  buildCollectionCreatePayload,
  collectionCreateSchema,
  collectionUpdateSchema,
  galleryConfigSchema,
  getCollectionPreset,
  listCollectionPresets,
} from "@/features/collections";

const ids = Array.from(
  { length: 20 },
  (_, index) =>
    `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
);

describe("Collection preset contracts", () => {
  it("exposes the approved stable keys and labels", () => {
    expect(
      listCollectionPresets().map(({ key, label }) => [key, label]),
    ).toEqual([
      ["book", "Books"],
      ["movie", "Movies"],
      ["song", "Music"],
      ["merch", "Collectibles"],
      ["shopping", "Shopping"],
      ["meal", "Meals"],
      ["travel", "Travel"],
      ["favorites", "Favorites"],
      ["blank", "Blank"],
    ]);
  });

  it("defines the approved fields, options, and ratios", () => {
    expect(getCollectionPreset("book")).toMatchObject({
      aspectRatio: "2:3",
      fields: [
        { name: "Author", type: "text" },
        {
          name: "Genre",
          options: [
            "Fiction",
            "Nonfiction",
            "Fantasy",
            "Mystery",
            "Romance",
            "Sci-Fi",
            "Other",
          ],
          type: "select",
        },
        {
          name: "Status",
          options: ["To Read", "Reading", "Finished"],
          type: "select",
        },
        { name: "Rating", type: "rating" },
      ],
    });
    expect(getCollectionPreset("movie").aspectRatio).toBe("2:3");
    expect(getCollectionPreset("song").aspectRatio).toBe("1:1");
    expect(getCollectionPreset("merch").aspectRatio).toBe("1:1");
    expect(getCollectionPreset("shopping").aspectRatio).toBe("1:1");
    expect(getCollectionPreset("meal").aspectRatio).toBe("4:3");
    expect(getCollectionPreset("travel").aspectRatio).toBe("4:3");
    expect(getCollectionPreset("favorites").aspectRatio).toBe("1:1");
    expect(getCollectionPreset("blank")).toMatchObject({
      aspectRatio: "3:4",
      fields: [],
    });

    expect(
      Object.fromEntries(
        listCollectionPresets().map((preset) => [
          preset.key,
          preset.fields.map(({ name, type }) => `${name}:${type}`),
        ]),
      ),
    ).toEqual({
      blank: [],
      book: ["Author:text", "Genre:select", "Status:select", "Rating:rating"],
      favorites: ["Category:select", "Notes:text", "Rating:rating"],
      meal: ["Restaurant:text", "Price:number", "Date:date", "Rating:rating"],
      merch: [
        "Category:select",
        "Price:number",
        "Status:select",
        "Source:text",
      ],
      movie: [
        "Genre:select",
        "Status:select",
        "Watched Date:date",
        "Rating:rating",
      ],
      shopping: ["Price:number", "Store:text", "Status:select", "URL:url"],
      song: ["Artist:text", "Album:text", "Genre:select", "Rating:rating"],
      travel: ["Location:text", "Date:date", "Notes:text", "Rating:rating"],
    });

    expect(
      Object.fromEntries(
        listCollectionPresets().map((preset) => [
          preset.key,
          Object.fromEntries(
            preset.fields
              .filter((field) => field.options)
              .map((field) => [field.name, field.options]),
          ),
        ]),
      ),
    ).toEqual({
      blank: {},
      book: {
        Genre: [
          "Fiction",
          "Nonfiction",
          "Fantasy",
          "Mystery",
          "Romance",
          "Sci-Fi",
          "Other",
        ],
        Status: ["To Read", "Reading", "Finished"],
      },
      favorites: {
        Category: ["Books", "Movies", "Music", "Food", "Places", "Other"],
      },
      meal: {},
      merch: {
        Category: ["Apparel", "Accessories", "Home", "Collectibles", "Other"],
        Status: ["Wanted", "Ordered", "Owned"],
      },
      movie: {
        Genre: [
          "Action",
          "Comedy",
          "Drama",
          "Fantasy",
          "Horror",
          "Romance",
          "Sci-Fi",
          "Other",
        ],
        Status: ["To Watch", "Watching", "Watched"],
      },
      shopping: { Status: ["Idea", "Planned", "Purchased"] },
      song: {
        Genre: [
          "Pop",
          "Rock",
          "Hip-Hop",
          "Electronic",
          "Jazz",
          "Classical",
          "Other",
        ],
      },
      travel: {},
    });
  });

  it("returns detached preset data so selection cannot alter the catalog", () => {
    const selected = getCollectionPreset("book");
    selected.fields[0]!.name = "Changed";

    expect(getCollectionPreset("book").fields[0]!.name).toBe("Author");
  });

  it("builds an independent schema and Title-primary gallery defaults", () => {
    let nextId = 0;
    const payload = buildCollectionCreatePayload(
      {
        description: "  Favorite reads  ",
        name: "  My Books  ",
        presetKey: "book",
        requestId: "00000000-0000-4000-8000-000000000000",
      },
      () => ids[nextId++]!,
    );

    expect(payload.name).toBe("My Books");
    expect(payload.requestId).toBe("00000000-0000-4000-8000-000000000000");
    expect(payload.description).toBe("Favorite reads");
    expect(payload.fields).toHaveLength(4);
    expect(payload.fields[1]!.options).toHaveLength(7);
    expect(
      payload.fields.flatMap((field) => [
        field.id,
        ...field.options.map((option) => option.id),
      ]),
    ).toHaveLength(14);
    expect(payload.viewConfig).toEqual({
      aspectRatio: "2:3",
      columns: 3,
      imageFit: "cover",
      showDetails: true,
      sortBy: "createdAt",
      sortDirection: "desc",
      spacing: "normal",
      visibleFieldIds: ["title", ids[0], ids[1]],
    });

    payload.fields[1]!.options[0]!.label = "Changed";
    expect(getCollectionPreset("book").fields[1]!.options![0]).toBe("Fiction");
  });
});

describe("Collection mutation schemas", () => {
  it("normalizes optional descriptions and validates create input", () => {
    expect(
      collectionCreateSchema.parse({
        description: "   ",
        name: "  New collection ",
        presetKey: "blank",
        requestId: "00000000-0000-4000-8000-000000000000",
      }),
    ).toEqual({
      description: null,
      name: "New collection",
      presetKey: "blank",
      requestId: "00000000-0000-4000-8000-000000000000",
    });
  });

  it("requires at least one editable field on update", () => {
    expect(
      collectionUpdateSchema.safeParse({
        collectionId: "00000000-0000-4000-8000-000000000000",
      }).success,
    ).toBe(false);
  });

  it("supports the approved gallery field and sorting contract", () => {
    const base = {
      aspectRatio: "3:4",
      columns: 3,
      imageFit: "cover",
      showDetails: true,
      sortBy: "title",
      sortDirection: "asc",
      spacing: "normal",
    };

    expect(
      galleryConfigSchema.safeParse({ ...base, visibleFieldIds: [] }).success,
    ).toBe(true);
    expect(
      galleryConfigSchema.safeParse({
        ...base,
        visibleFieldIds: ["description", "title"],
      }).success,
    ).toBe(true);
    expect(
      galleryConfigSchema.safeParse({
        ...base,
        sortBy: "rating",
        visibleFieldIds: [],
      }).success,
    ).toBe(false);
  });
});
