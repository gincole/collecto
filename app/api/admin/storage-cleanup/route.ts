import { NextResponse } from "next/server";

import { authorizeCleanupRequest } from "@/features/collections/cleanup-auth";
import { getSafeCleanupErrorCode } from "@/features/collections/cleanup";
import { retryPendingStorageCleanup } from "@/features/collections/cleanup-runner";
import { serverEnv } from "@/lib/env/server";

export async function POST(request: Request) {
  if (
    !authorizeCleanupRequest(
      request.headers.get("authorization"),
      serverEnv.STORAGE_CLEANUP_SECRET,
    )
  ) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    return NextResponse.json(await retryPendingStorageCleanup());
  } catch (error) {
    console.error("Storage cleanup failed", {
      errorCode: getSafeCleanupErrorCode(error),
      operation: "retry-storage-cleanup",
    });
    return NextResponse.json(
      { error: "Cleanup could not be completed." },
      { status: 500 },
    );
  }
}
