import { z } from "zod";
import type { CollectionGateway } from "@/features/collections/service";
import {
  galleryConfigSchema,
  type GalleryConfig,
} from "@/features/collections/schemas";

export const gallerySaveSchema = z.object({
  collectionId: z.uuid(),
  config: galleryConfigSchema,
});
export type GallerySaveInput = z.infer<typeof gallerySaveSchema>;
export type GallerySaveResult = {
  status:
    | "success"
    | "validation_error"
    | "unauthorized"
    | "not_found"
    | "conflict"
    | "error";
};
export type GalleryGateway = Pick<
  CollectionGateway,
  "getUser" | "getOwned" | "logError"
> & {
  saveOwned: (
    collectionId: string,
    config: GalleryConfig,
  ) => Promise<{ data: string | null; error: { code?: string } | null }>;
};

export async function saveGalleryConfig(
  input: unknown,
  gateway: GalleryGateway,
): Promise<GallerySaveResult> {
  const parsed = gallerySaveSchema.safeParse(input);
  if (!parsed.success) return { status: "validation_error" };
  try {
    const auth = await gateway.getUser();
    if (auth.error) {
      gateway.logError("gallery-auth", auth.error);
      return { status: "error" };
    }
    if (!auth.data) return { status: "unauthorized" };
    const owned = await gateway.getOwned(
      auth.data.id,
      parsed.data.collectionId,
    );
    if (owned.error) {
      gateway.logError("gallery-read", owned.error);
      return { status: "error" };
    }
    if (!owned.data) return { status: "not_found" };
    const allowed = new Set([
      "title",
      "description",
      ...owned.data.fields.map(({ id }) => id),
    ]);
    if (parsed.data.config.visibleFieldIds.some((id) => !allowed.has(id)))
      return { status: "conflict" };
    const result = await gateway.saveOwned(
      parsed.data.collectionId,
      parsed.data.config,
    );
    if (result.error?.code === "22023") return { status: "conflict" };
    if (result.error) {
      gateway.logError("gallery-save", result.error);
      return { status: "error" };
    }
    return { status: result.data ? "success" : "not_found" };
  } catch (error) {
    gateway.logError("gallery-save", error);
    return { status: "error" };
  }
}
