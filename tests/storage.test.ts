import { describe, expect, it } from "vitest";

import {
  assertItemImagePathScope,
  authorizeItemImagePath,
  createSignedItemImageUrl,
  createItemImagePath,
  ITEM_IMAGE_BUCKET,
  parseItemImagePath,
  SIGNED_IMAGE_URL_TTL_SECONDS,
} from "@/lib/supabase/storage";

const scope = {
  collectionId: "31000000-0000-4000-8000-000000000001",
  itemId: "32000000-0000-4000-8000-000000000001",
  userId: "30000000-0000-4000-8000-000000000001",
};

describe("item image storage helpers", () => {
  it("generates an owner-scoped path without an original filename", () => {
    const path = createItemImagePath({
      ...scope,
      mimeType: "image/jpeg",
      objectId: "33000000-0000-4000-8000-000000000001",
    });

    expect(path).toBe(
      "30000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000001/32000000-0000-4000-8000-000000000001/33000000-0000-4000-8000-000000000001.jpg",
    );
    expect(path).not.toContain("holiday-photo");
  });

  it.each([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
  ] as const)("maps %s to a generated %s object", (mimeType, extension) => {
    expect(
      createItemImagePath({
        ...scope,
        mimeType,
        objectId: "33000000-0000-4000-8000-000000000001",
      }),
    ).toMatch(new RegExp(`\\.${extension}$`));
  });

  it("parses a valid path and authorizes the expected scope", () => {
    const path = `${scope.userId}/${scope.collectionId}/${scope.itemId}/33000000-0000-4000-8000-000000000001.webp`;

    expect(parseItemImagePath(path)).toEqual({
      ...scope,
      extension: "webp",
      objectId: "33000000-0000-4000-8000-000000000001",
    });
    expect(assertItemImagePathScope(path, scope)).toEqual(
      parseItemImagePath(path),
    );
  });

  it("rejects malformed paths, unsupported formats, and mismatched owners", () => {
    expect(() => parseItemImagePath("not/a/valid/path.gif")).toThrow(
      "Invalid item image path",
    );

    const path = `${scope.userId}/${scope.collectionId}/${scope.itemId}/33000000-0000-4000-8000-000000000001.png`;

    expect(() =>
      assertItemImagePathScope(path, {
        ...scope,
        userId: "30000000-0000-4000-8000-000000000002",
      }),
    ).toThrow("Unauthorized item image path");
  });

  it("keeps the bucket private and signed access short-lived", () => {
    expect(ITEM_IMAGE_BUCKET).toBe("item-images");
    expect(SIGNED_IMAGE_URL_TTL_SECONDS).toBeGreaterThan(0);
    expect(SIGNED_IMAGE_URL_TTL_SECONDS).toBeLessThanOrEqual(300);
  });

  it("derives the authenticated user and verifies Collection ownership", async () => {
    const path = `${scope.userId}/${scope.collectionId}/${scope.itemId}/33000000-0000-4000-8000-000000000001.webp`;
    const ownershipChecks: unknown[] = [];

    await expect(
      authorizeItemImagePath(path, {
        getAuthenticatedUserId: async () => scope.userId,
        ownsCollection: async (input) => {
          ownershipChecks.push(input);
          return true;
        },
      }),
    ).resolves.toEqual(parseItemImagePath(path));
    expect(ownershipChecks).toEqual([
      { collectionId: scope.collectionId, userId: scope.userId },
    ]);

    await expect(
      authorizeItemImagePath(path, {
        getAuthenticatedUserId: async () =>
          "30000000-0000-4000-8000-000000000002",
        ownsCollection: async () => true,
      }),
    ).rejects.toThrow("Unauthorized item image path");
  });

  it("signs only after authorization and always uses the fixed TTL", async () => {
    const path = `${scope.userId}/${scope.collectionId}/${scope.itemId}/33000000-0000-4000-8000-000000000001.webp`;
    const signingCalls: unknown[] = [];

    await expect(
      createSignedItemImageUrl(path, {
        createSignedUrl: async (input) => {
          signingCalls.push(input);
          return "https://signed.example.invalid/item";
        },
        getAuthenticatedUserId: async () => scope.userId,
        ownsCollection: async () => true,
      }),
    ).resolves.toBe("https://signed.example.invalid/item");
    expect(signingCalls).toEqual([
      {
        bucket: ITEM_IMAGE_BUCKET,
        expiresIn: SIGNED_IMAGE_URL_TTL_SECONDS,
        path,
      },
    ]);
  });
});
