"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createCollectionGateway } from "@/features/collections/gateway";
import { gallerySaveSchema, saveGalleryConfig } from "./service";

export async function saveGalleryConfigAction(input: unknown) {
  const client = await createClient();
  const collections = createCollectionGateway(client);
  const result = await saveGalleryConfig(input, {
    getUser: collections.getUser,
    getOwned: collections.getOwned,
    logError: collections.logError,
    async saveOwned(collectionId, config) {
      return client.rpc("update_gallery_config", {
        p_collection_id: collectionId,
        p_config: config,
      });
    },
  });
  if (result.status === "success") {
    const parsed = gallerySaveSchema.parse(input);
    revalidatePath(`/collections/${parsed.collectionId}`);
    revalidatePath("/library");
  }
  return result;
}
