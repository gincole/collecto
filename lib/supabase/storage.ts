import "server-only";

import { randomUUID } from "node:crypto";
import { z } from "zod";

export const ITEM_IMAGE_BUCKET = "item-images";
export const SIGNED_IMAGE_URL_TTL_SECONDS = 60;

const uuidSchema = z.uuid();
const imageMimeTypeSchema = z.enum(["image/jpeg", "image/png", "image/webp"]);
const imageExtensionSchema = z.enum(["jpg", "png", "webp"]);

const extensionByMimeType = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const satisfies Record<
  z.infer<typeof imageMimeTypeSchema>,
  z.infer<typeof imageExtensionSchema>
>;

const itemImageScopeSchema = z.object({
  collectionId: uuidSchema,
  itemId: uuidSchema,
  userId: uuidSchema,
});

const createItemImagePathSchema = itemImageScopeSchema.extend({
  mimeType: imageMimeTypeSchema,
  objectId: uuidSchema.optional(),
});

export type ItemImageScope = z.infer<typeof itemImageScopeSchema>;

export type ItemImageAuthorizationGateway = {
  getAuthenticatedUserId: () => Promise<string | null>;
  ownsCollection: (scope: {
    collectionId: string;
    userId: string;
  }) => Promise<boolean>;
};

export type ItemImageSigningGateway = ItemImageAuthorizationGateway & {
  createSignedUrl: (input: {
    bucket: typeof ITEM_IMAGE_BUCKET;
    expiresIn: typeof SIGNED_IMAGE_URL_TTL_SECONDS;
    path: string;
  }) => Promise<string>;
};

export function createItemImagePath(
  input: z.input<typeof createItemImagePathSchema>,
) {
  const { collectionId, itemId, mimeType, objectId, userId } =
    createItemImagePathSchema.parse(input);
  const generatedObjectId = objectId ?? randomUUID();

  return `${userId}/${collectionId}/${itemId}/${generatedObjectId}.${extensionByMimeType[mimeType]}`;
}

export function parseItemImagePath(path: string) {
  const segments = path.split("/");

  if (segments.length !== 4) {
    throw new Error("Invalid item image path");
  }

  const [userId, collectionId, itemId, filename] = segments;
  const filenameParts = filename?.split(".");

  if (filenameParts?.length !== 2) {
    throw new Error("Invalid item image path");
  }

  const [objectId, extension] = filenameParts;
  const result = itemImageScopeSchema
    .extend({
      extension: imageExtensionSchema,
      objectId: uuidSchema,
    })
    .safeParse({ collectionId, extension, itemId, objectId, userId });

  if (!result.success) {
    throw new Error("Invalid item image path");
  }

  return result.data;
}

export function assertItemImagePathScope(
  path: string,
  expectedScope: ItemImageScope,
) {
  const parsedPath = parseItemImagePath(path);
  const scope = itemImageScopeSchema.parse(expectedScope);

  if (
    parsedPath.userId !== scope.userId ||
    parsedPath.collectionId !== scope.collectionId ||
    parsedPath.itemId !== scope.itemId
  ) {
    throw new Error("Unauthorized item image path");
  }

  return parsedPath;
}

export async function authorizeItemImagePath(
  path: string,
  gateway: ItemImageAuthorizationGateway,
) {
  const parsedPath = parseItemImagePath(path);
  const authenticatedUserId = await gateway.getAuthenticatedUserId();
  const userResult = uuidSchema.safeParse(authenticatedUserId);

  if (!userResult.success || parsedPath.userId !== userResult.data) {
    throw new Error("Unauthorized item image path");
  }

  const ownsCollection = await gateway.ownsCollection({
    collectionId: parsedPath.collectionId,
    userId: userResult.data,
  });

  if (!ownsCollection) {
    throw new Error("Unauthorized item image path");
  }

  return parsedPath;
}

export async function createSignedItemImageUrl(
  path: string,
  gateway: ItemImageSigningGateway,
) {
  await authorizeItemImagePath(path, gateway);

  return gateway.createSignedUrl({
    bucket: ITEM_IMAGE_BUCKET,
    expiresIn: SIGNED_IMAGE_URL_TTL_SECONDS,
    path,
  });
}
