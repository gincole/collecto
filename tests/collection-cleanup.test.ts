import { describe, expect, it, vi } from "vitest";

import {
  getSafeCleanupErrorCode,
  retryStorageCleanupJobs,
  type StorageCleanupGateway,
} from "@/features/collections/cleanup";

const firstJob = {
  attemptCount: 0,
  id: "00000000-0000-4000-8000-000000000001",
  objectPath: "owner/collection/item/first.webp",
};
const secondJob = {
  attemptCount: 2,
  id: "00000000-0000-4000-8000-000000000002",
  objectPath: "owner/collection/item/second.webp",
};

function gateway(
  overrides: Partial<StorageCleanupGateway> = {},
): StorageCleanupGateway {
  return {
    claimRetryable: vi.fn(async () => [firstJob, secondJob]),
    isObjectReferenced: vi.fn(async () => false),
    markComplete: vi.fn(async () => undefined),
    markFailed: vi.fn(async () => undefined),
    removeObject: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe("Collection image cleanup retry", () => {
  it("keeps objects that became a committed Item image", async () => {
    const store = gateway({ isObjectReferenced: vi.fn(async () => true) });

    await expect(retryStorageCleanupJobs(store, 10)).resolves.toEqual({
      completed: 2,
      failed: 0,
    });
    expect(store.removeObject).not.toHaveBeenCalled();
    expect(store.markComplete).toHaveBeenCalledTimes(2);
  });

  it("sanitizes errors for structured logging", () => {
    expect(getSafeCleanupErrorCode({ code: "storage_unavailable" })).toBe(
      "storage_unavailable",
    );
    expect(getSafeCleanupErrorCode(new Error("private object path"))).toBe(
      "STORAGE_DELETE_FAILED",
    );
  });
  it("completes claimed pending jobs after private object deletion", async () => {
    const store = gateway();

    await expect(retryStorageCleanupJobs(store, 10)).resolves.toEqual({
      completed: 2,
      failed: 0,
    });
    expect(store.removeObject).toHaveBeenCalledWith(firstJob.objectPath);
    expect(store.markComplete).toHaveBeenCalledWith(firstJob.id);
  });

  it("records a safe failure code and leaves the job retryable", async () => {
    const store = gateway({
      removeObject: vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce({ code: "storage_unavailable", secret: "omit" }),
    });

    await expect(retryStorageCleanupJobs(store, 10)).resolves.toEqual({
      completed: 1,
      failed: 1,
    });
    expect(store.markFailed).toHaveBeenCalledWith(
      secondJob.id,
      "storage_unavailable",
    );
  });

  it("returns cleanly when another worker claimed every retryable job", async () => {
    const store = gateway({ claimRetryable: vi.fn(async () => []) });

    await expect(retryStorageCleanupJobs(store, 10)).resolves.toEqual({
      completed: 0,
      failed: 0,
    });
    expect(store.removeObject).not.toHaveBeenCalled();
  });
});
