import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import {
  createItemImagePath,
  ITEM_IMAGE_BUCKET,
  type ItemImageScope,
} from "@/lib/supabase/storage";

import type { ItemImageGateway } from "./image-service";

type ImagePathResult = {
  cleanup_job_id: string | null;
  old_path: string | null;
};

export function createItemImageGateway(
  client: SupabaseClient<Database>,
): ItemImageGateway {
  async function setPath(scope: ItemImageScope, path: string | null) {
    const { data, error } = await client.rpc("set_item_image_path", {
      p_collection_id: scope.collectionId,
      p_image_path: path,
      p_item_id: scope.itemId,
    });
    if (error) throw error;
    const result = data as ImagePathResult | null;
    return result
      ? {
          cleanupJobId: result.cleanup_job_id,
          oldPath: result.old_path,
        }
      : null;
  }

  return {
    async clearImagePath(scope) {
      const result = await setPath(scope, null);
      if (!result) throw new Error("Item not found");
      return result;
    },
    async completeCleanup(jobId) {
      const { error } = await client.rpc("complete_item_image_cleanup", {
        p_job_id: jobId,
      });
      if (error) throw error;
    },
    createPath(scope, mimeType) {
      return createItemImagePath({ ...scope, mimeType });
    },
    async getImagePath(scope) {
      const { data, error } = await client
        .from("items")
        .select("image_path, collections!inner(owner_id)")
        .eq("id", scope.itemId)
        .eq("collection_id", scope.collectionId)
        .eq("collections.owner_id", scope.userId)
        .maybeSingle();
      if (error) throw error;
      return data?.image_path ?? null;
    },
    async queueCleanup(scope, path, errorCode) {
      const { error } = await client.rpc("queue_item_image_cleanup", {
        p_collection_id: scope.collectionId,
        p_error_code: errorCode,
        p_item_id: scope.itemId,
        p_object_path: path,
      });
      if (error) throw error;
    },
    async removeObject(path) {
      const { data, error } = await client.storage
        .from(ITEM_IMAGE_BUCKET)
        .remove([path]);
      if (error) throw error;
      if (!data.some((entry) => entry.name === path))
        throw Object.assign(new Error("Image was not removed"), {
          code: "STORAGE_REMOVE_INCOMPLETE",
        });
    },
    async replaceImagePath(scope, path) {
      const result = await setPath(scope, path);
      if (!result) throw new Error("Item not found");
      return result;
    },
    async setImagePath(scope, path) {
      return Boolean(await setPath(scope, path));
    },
    async uploadObject(path, bytes, mimeType) {
      const { error } = await client.storage
        .from(ITEM_IMAGE_BUCKET)
        .upload(path, bytes, { contentType: mimeType, upsert: false });
      if (error) throw error;
    },
  };
}
