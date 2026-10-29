import "server-only";

import { z } from "zod";

import { parsePublicEnv } from "./public";

const privateEnvSchema = z.object({
  STORAGE_CLEANUP_SECRET: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(16).optional(),
  ),
  DEMO_USER_EMAIL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.email().optional(),
  ),
  SUPABASE_SECRET_KEY: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(1).optional(),
  ),
});

export function parseServerEnv(input: Record<string, string | undefined>) {
  const publicEnv = parsePublicEnv(input);
  const privateResult = privateEnvSchema.safeParse(input);

  if (!privateResult.success) {
    const variableNames = [
      ...new Set(
        privateResult.error.issues.map((issue) => String(issue.path[0])),
      ),
    ].sort();

    throw new Error(
      `Invalid environment configuration: ${variableNames.join(", ")}`,
    );
  }

  return { ...publicEnv, ...privateResult.data };
}

export const serverEnv = parseServerEnv(process.env);
