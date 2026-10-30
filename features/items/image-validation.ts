import "server-only";

import sharp from "sharp";

export const ITEM_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const formatsByMimeType = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type ValidatedItemImage = {
  byteLength: number;
  bytes: Uint8Array;
  mimeType: keyof typeof formatsByMimeType;
};

export async function validateItemImage(
  file: File,
): Promise<ValidatedItemImage> {
  if (!(file.type in formatsByMimeType))
    throw new Error("Choose a JPEG, PNG, or WebP image.");
  if (file.size === 0) throw new Error("Choose a valid image.");
  if (file.size > ITEM_IMAGE_MAX_BYTES)
    throw new Error("Image must be 5 MB or smaller.");

  const mimeType = file.type as keyof typeof formatsByMimeType;
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    const metadata = await sharp(bytes).metadata();
    if (
      metadata.format !== formatsByMimeType[mimeType] ||
      !metadata.width ||
      !metadata.height
    )
      throw new Error("invalid");
    await sharp(bytes).raw().toBuffer();
  } catch {
    throw new Error("Choose a valid image.");
  }

  return { byteLength: bytes.byteLength, bytes, mimeType };
}
