import "server-only";

import { timingSafeEqual } from "node:crypto";

export function authorizeCleanupRequest(
  authorization: string | null,
  configuredSecret: string | undefined,
) {
  if (!configuredSecret || !authorization?.startsWith("Bearer ")) return false;

  const provided = authorization.slice("Bearer ".length);
  const expectedBuffer = Buffer.from(configuredSecret);
  const providedBuffer = Buffer.from(provided);
  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  );
}
