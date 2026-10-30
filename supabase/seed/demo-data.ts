import { randomUUID } from "node:crypto";

type Field = {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "rating" | "select";
  required: boolean;
  position: number;
  options: { id: string; label: string; position: number }[];
};

export function buildDemoData() {
  return [
    {
      name: "My Books",
      preset: "book",
      ratio: "2:3",
      fields: ["Author:text", "Genre:select", "Status:select", "Rating:rating"],
      options: {
        Genre: ["Fiction", "Nonfiction"],
        Status: ["To Read", "Reading", "Finished"],
      },
      titles: [
        "The Paper Observatory",
        "A Map of Quiet Streets",
        "Letters from Willow Bay",
        "The Midnight Seed Shop",
        "Small Lessons in Wonder",
        "An Atlas of Imaginary Islands",
      ],
    },
    {
      name: "Food Memories",
      preset: "meal",
      ratio: "4:3",
      fields: ["Restaurant:text", "Price:number", "Date:date", "Rating:rating"],
      options: {},
      titles: [
        "Lemon rice at Juniper Table",
        "Sunday garden soup",
        "Peach toast at Cloud Kitchen",
        "Miso noodles after the rain",
        "Rosemary picnic bread",
        "Cocoa at Lantern Corner",
      ],
    },
    {
      name: "My Collectibles",
      preset: "merch",
      ratio: "1:1",
      fields: [
        "Category:select",
        "Price:number",
        "Status:select",
        "Source:text",
      ],
      options: {
        Category: ["Accessories", "Home", "Collectibles"],
        Status: ["Wanted", "Ordered", "Owned"],
      },
      titles: [
        "Tiny brass lighthouse",
        "Blue enamel moon pin",
        "Handmade cloud cup",
        "Wooden fox token",
        "Paper garden postcard",
        "Miniature train ticket",
      ],
    },
  ].map((entry, collectionIndex) => {
    const fields: Field[] = entry.fields.map((definition, position) => {
      const [name = "", type] = definition.split(":");
      if (
        type !== "text" &&
        type !== "number" &&
        type !== "date" &&
        type !== "rating" &&
        type !== "select"
      )
        throw new Error("Invalid seed field type");
      const labels: string[] =
        Object.entries(entry.options).find(([key]) => key === name)?.[1] ?? [];
      return {
        id: randomUUID(),
        name,
        type,
        required: false,
        position,
        options: labels.map((label, position) => ({
          id: randomUUID(),
          label,
          position,
        })),
      };
    });
    return {
      id: randomUUID(),
      name: entry.name,
      description:
        "Fictional examples for the shared demo. Feel free to explore and edit.",
      presetKey: entry.preset,
      viewConfig: {
        columns: 3,
        aspectRatio: entry.ratio,
        imageFit: "cover",
        showDetails: true,
        visibleFieldIds: [
          "title",
          ...fields.slice(0, 2).map((field) => field.id),
        ],
        spacing: "normal",
        sortBy: "createdAt",
        sortDirection: "desc",
      },
      fields,
      items: entry.titles.map((title, index) => ({
        id: randomUUID(),
        title,
        description: "A fictional memory created for this demo.",
        values: Object.fromEntries(
          fields.flatMap((field) => {
            // Keep missing optional values to demonstrate Uncategorized and omitted metadata.
            if (index === 5 && field.type === "select") return [];
            const value =
              field.type === "select"
                ? field.options[index % field.options.length]?.id
                : field.type === "rating"
                  ? (index % 5) + 1
                  : field.type === "number"
                    ? 12 + index * 7.5
                    : field.type === "date"
                      ? `2026-10-${String(index + 1).padStart(2, "0")}`
                      : `${field.name === "Author" ? "Fictional writer" : field.name === "Restaurant" ? "Imaginary café" : "Fictional market"} ${collectionIndex + 1}-${index + 1}`;
            return value === undefined ? [] : [[field.id, value]];
          }),
        ),
      })),
    };
  });
}
