import "server-only";

export type StorageCleanupJob = {
  attemptCount: number;
  id: string;
  objectPath: string;
};

export type StorageCleanupGateway = {
  claimRetryable: (limit: number) => Promise<StorageCleanupJob[]>;
  isObjectReferenced: (objectPath: string) => Promise<boolean>;
  markComplete: (jobId: string) => Promise<void>;
  markFailed: (jobId: string, errorCode: string) => Promise<void>;
  removeObject: (objectPath: string) => Promise<void>;
};

export function getSafeCleanupErrorCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    error.code.length > 0
  ) {
    return error.code.slice(0, 100);
  }
  return "STORAGE_DELETE_FAILED";
}

export async function retryStorageCleanupJobs(
  gateway: StorageCleanupGateway,
  limit: number,
) {
  const jobs = await gateway.claimRetryable(Math.max(1, Math.min(limit, 100)));
  const result = { completed: 0, failed: 0 };

  for (const job of jobs) {
    try {
      if (await gateway.isObjectReferenced(job.objectPath)) {
        await gateway.markComplete(job.id);
        result.completed += 1;
        continue;
      }
      await gateway.removeObject(job.objectPath);
      await gateway.markComplete(job.id);
      result.completed += 1;
    } catch (error) {
      await gateway.markFailed(job.id, getSafeCleanupErrorCode(error));
      result.failed += 1;
    }
  }

  return result;
}
