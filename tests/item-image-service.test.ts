import { describe, expect, it, vi } from "vitest";

import {
  attachItemImage,
  removeItemImage,
  replaceItemImage,
  type ItemImageGateway,
} from "@/features/items/image-service";

const scope = {
  collectionId: "31000000-0000-4000-8000-000000000001",
  itemId: "32000000-0000-4000-8000-000000000001",
  userId: "30000000-0000-4000-8000-000000000001",
};
const newPath = `${scope.userId}/${scope.collectionId}/${scope.itemId}/33000000-0000-4000-8000-000000000001.png`;
const oldPath = `${scope.userId}/${scope.collectionId}/${scope.itemId}/33000000-0000-4000-8000-000000000002.jpg`;

function gateway(overrides: Partial<ItemImageGateway> = {}): ItemImageGateway {
  return {
    clearImagePath: vi.fn(async () => ({ cleanupJobId: "job-1", oldPath })),
    completeCleanup: vi.fn(async () => undefined),
    createPath: vi.fn(() => newPath),
    getImagePath: vi.fn(async () => null),
    queueCleanup: vi.fn(async () => undefined),
    removeObject: vi.fn(async () => undefined),
    replaceImagePath: vi.fn(async () => ({ cleanupJobId: "job-1", oldPath })),
    setImagePath: vi.fn(async () => true),
    uploadObject: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe("Item image lifecycle", () => {
  it("uploads and attaches a new private image", async () => {
    const store = gateway();
    await expect(
      attachItemImage(
        scope,
        { bytes: new Uint8Array([1]), mimeType: "image/png" },
        store,
      ),
    ).resolves.toEqual({ imagePath: newPath, status: "success" });
    expect(store.uploadObject).toHaveBeenCalledWith(
      newPath,
      expect.any(Uint8Array),
      "image/png",
    );
    expect(store.setImagePath).toHaveBeenCalledWith(scope, newPath);
  });

  it("removes a new object and queues cleanup when the database attach fails", async () => {
    const store = gateway({
      removeObject: vi.fn(async () => {
        throw Object.assign(new Error("remove failed"), {
          code: "REMOVE_FAILED",
        });
      }),
      setImagePath: vi.fn(async () => false),
    });
    await expect(
      attachItemImage(
        scope,
        { bytes: new Uint8Array([1]), mimeType: "image/png" },
        store,
      ),
    ).resolves.toMatchObject({ status: "error" });
    expect(store.queueCleanup).toHaveBeenCalledWith(
      scope,
      newPath,
      "REMOVE_FAILED",
    );
  });

  it("attempts cleanup when an upload response fails after choosing its path", async () => {
    const store = gateway({
      uploadObject: vi.fn(async () => {
        throw Object.assign(new Error("upload failed"), {
          code: "UPLOAD_FAILED",
        });
      }),
    });
    await expect(
      attachItemImage(
        scope,
        { bytes: new Uint8Array([1]), mimeType: "image/png" },
        store,
      ),
    ).resolves.toEqual({ status: "error" });
    expect(store.removeObject).toHaveBeenCalledWith(newPath);
  });

  it("keeps an attached object when a committed database response is lost", async () => {
    const store = gateway({
      getImagePath: vi.fn(async () => newPath),
      setImagePath: vi.fn(async () => {
        throw new Error("response lost");
      }),
    });
    await expect(
      attachItemImage(
        scope,
        { bytes: new Uint8Array([1]), mimeType: "image/png" },
        store,
      ),
    ).resolves.toEqual({ imagePath: newPath, status: "success" });
    expect(store.removeObject).not.toHaveBeenCalled();
  });

  it("keeps a replacement when a committed database response is lost", async () => {
    const store = gateway({
      getImagePath: vi.fn(async () => newPath),
      replaceImagePath: vi.fn(async () => {
        throw new Error("response lost");
      }),
    });
    await expect(
      replaceItemImage(
        scope,
        { bytes: new Uint8Array([1]), mimeType: "image/png" },
        store,
      ),
    ).resolves.toEqual({
      imagePath: newPath,
      status: "success",
      warning: "cleanup_pending",
    });
    expect(store.removeObject).not.toHaveBeenCalled();
  });

  it("queues reconciliation when the database outcome cannot be read", async () => {
    const store = gateway({
      getImagePath: vi.fn(async () => {
        throw new Error("read unavailable");
      }),
      setImagePath: vi.fn(async () => {
        throw new Error("response lost");
      }),
    });
    await expect(
      attachItemImage(
        scope,
        { bytes: new Uint8Array([1]), mimeType: "image/png" },
        store,
      ),
    ).resolves.toEqual({ status: "error" });
    expect(store.queueCleanup).toHaveBeenCalledWith(
      scope,
      newPath,
      "AMBIGUOUS_COMMIT_STATE",
    );
    expect(store.removeObject).not.toHaveBeenCalled();
  });

  it("replaces the path before deleting the old object and records cleanup failure", async () => {
    const store = gateway({
      removeObject: vi.fn(async (path) => {
        if (path === oldPath)
          throw Object.assign(new Error("failed"), {
            code: "OLD_DELETE_FAILED",
          });
      }),
    });
    await expect(
      replaceItemImage(
        scope,
        { bytes: new Uint8Array([1]), mimeType: "image/png" },
        store,
      ),
    ).resolves.toEqual({
      imagePath: newPath,
      status: "success",
      warning: "cleanup_pending",
    });
    expect(store.replaceImagePath).toHaveBeenCalledWith(scope, newPath);
    expect(store.completeCleanup).not.toHaveBeenCalled();
  });

  it("clears the database path before removing the old object", async () => {
    const store = gateway();
    await expect(removeItemImage(scope, store)).resolves.toEqual({
      status: "success",
    });
    expect(store.clearImagePath).toHaveBeenCalledWith(scope);
    expect(store.removeObject).toHaveBeenCalledWith(oldPath);
    expect(store.completeCleanup).toHaveBeenCalledWith("job-1");
  });
});
