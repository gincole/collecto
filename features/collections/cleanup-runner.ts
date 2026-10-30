import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { serverEnv } from "@/lib/env/server";
import type { Database } from "@/lib/supabase/database.types";

import { retryStorageCleanupJobs, type StorageCleanupGateway } from "./cleanup";

const IMAGE_BUCKET = "item-images";

export function createStorageCleanupGateway(
  client: SupabaseClient<Database>,
): StorageCleanupGateway {
  return {
    async claimRetryable(limit) {
      const staleBefore = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data, error } = await client.rpc("claim_storage_cleanup_jobs", {
        p_limit: limit,
        p_stale_before: staleBefore,
      });
      if (error) throw error;
      return (data ?? []).map((job) => ({
        attemptCount: job.attempt_count,
        id: job.id,
        objectPath: job.object_path,
      }));
    },
    async markComplete(jobId) {
      const { error } = await client
        .from("storage_cleanup_jobs")
        .update({ last_error_code: null, status: "complete" })
        .eq("id", jobId);
      if (error) throw error;
    },
    async isObjectReferenced(objectPath) {
      const { count, error } = await client
        .from("items")
        .select("id", { count: "exact", head: true })
        .eq("image_path", objectPath);
      if (error) throw error;
      return (count ?? 0) > 0;
    },
    async markFailed(jobId, errorCode) {
      const { error } = await client
        .from("storage_cleanup_jobs")
        .update({ last_error_code: errorCode, status: "failed" })
        .eq("id", jobId);
      if (error) throw error;
    },
    async removeObject(objectPath) {
      const { error } = await client.storage
        .from(IMAGE_BUCKET)
        .remove([objectPath]);
      if (error) throw error;
    },
  };
}

export async function retryPendingStorageCleanup(limit = 50) {
  if (!serverEnv.SUPABASE_SECRET_KEY) {
    throw new Error("Storage cleanup requires server credentials.");
  }

  const client = createClient<Database>(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SECRET_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  return retryStorageCleanupJobs(createStorageCleanupGateway(client), limit);
}
