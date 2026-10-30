import type { ItemImageScope } from "@/lib/supabase/storage";

export type ItemImageInput = {
  bytes: Uint8Array;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
};
type CleanupResult = { cleanupJobId: string | null; oldPath: string | null };
export type ItemImageGateway = {
  clearImagePath: (scope: ItemImageScope) => Promise<CleanupResult>;
  completeCleanup: (jobId: string) => Promise<void>;
  createPath: (
    scope: ItemImageScope,
    mimeType: ItemImageInput["mimeType"],
  ) => string;
  getImagePath: (scope: ItemImageScope) => Promise<string | null>;
  queueCleanup: (
    scope: ItemImageScope,
    path: string,
    errorCode: string,
  ) => Promise<void>;
  removeObject: (path: string) => Promise<void>;
  replaceImagePath: (
    scope: ItemImageScope,
    path: string,
  ) => Promise<CleanupResult>;
  setImagePath: (scope: ItemImageScope, path: string) => Promise<boolean>;
  uploadObject: (
    path: string,
    bytes: Uint8Array,
    mimeType: ItemImageInput["mimeType"],
  ) => Promise<void>;
};

function errorCode(error: unknown) {
  return typeof error === "object" && error && "code" in error
    ? String(error.code)
    : "UNEXPECTED";
}

async function discardNewObject(
  scope: ItemImageScope,
  path: string,
  gateway: ItemImageGateway,
) {
  try {
    await gateway.removeObject(path);
  } catch (error) {
    await gateway.queueCleanup(scope, path, errorCode(error));
  }
}

async function finishOldCleanup(
  result: CleanupResult,
  gateway: ItemImageGateway,
) {
  if (!result.oldPath) return undefined;
  try {
    await gateway.removeObject(result.oldPath);
    if (result.cleanupJobId) await gateway.completeCleanup(result.cleanupJobId);
    return undefined;
  } catch {
    return "cleanup_pending" as const;
  }
}

export async function attachItemImage(
  scope: ItemImageScope,
  image: ItemImageInput,
  gateway: ItemImageGateway,
) {
  let path: string | undefined;
  try {
    path = gateway.createPath(scope, image.mimeType);
    await gateway.uploadObject(path, image.bytes, image.mimeType);
  } catch {
    if (path) await discardNewObject(scope, path, gateway);
    return { status: "error" as const };
  }
  try {
    if (!(await gateway.setImagePath(scope, path))) {
      await discardNewObject(scope, path, gateway);
      return { status: "error" as const };
    }
    return { imagePath: path, status: "success" as const };
  } catch {
    try {
      if ((await gateway.getImagePath(scope)) === path)
        return { imagePath: path, status: "success" as const };
      await discardNewObject(scope, path, gateway);
    } catch {
      // The commit state is ambiguous. Never delete an object the database may reference.
      try {
        await gateway.queueCleanup(scope, path, "AMBIGUOUS_COMMIT_STATE");
      } catch {
        // The action still reports failure if durable reconciliation is unavailable.
      }
    }
    return { status: "error" as const };
  }
}

export async function replaceItemImage(
  scope: ItemImageScope,
  image: ItemImageInput,
  gateway: ItemImageGateway,
) {
  let path: string | undefined;
  try {
    path = gateway.createPath(scope, image.mimeType);
    await gateway.uploadObject(path, image.bytes, image.mimeType);
  } catch {
    if (path) await discardNewObject(scope, path, gateway);
    return { status: "error" as const };
  }
  try {
    const result = await gateway.replaceImagePath(scope, path);
    const warning = await finishOldCleanup(result, gateway);
    return {
      imagePath: path,
      status: "success" as const,
      ...(warning ? { warning } : {}),
    };
  } catch {
    try {
      if ((await gateway.getImagePath(scope)) === path)
        return {
          imagePath: path,
          status: "success" as const,
          warning: "cleanup_pending" as const,
        };
      await discardNewObject(scope, path, gateway);
    } catch {
      // The commit state is ambiguous. Never delete an object the database may reference.
      try {
        await gateway.queueCleanup(scope, path, "AMBIGUOUS_COMMIT_STATE");
      } catch {
        // The action still reports failure if durable reconciliation is unavailable.
      }
    }
    return { status: "error" as const };
  }
}

export async function removeItemImage(
  scope: ItemImageScope,
  gateway: ItemImageGateway,
) {
  try {
    const result = await gateway.clearImagePath(scope);
    const warning = await finishOldCleanup(result, gateway);
    return { status: "success" as const, ...(warning ? { warning } : {}) };
  } catch {
    return { status: "error" as const };
  }
}
