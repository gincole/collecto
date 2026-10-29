import "server-only";

import { z } from "zod";

import { parsePublicEnv } from "./public";

const privateEnvSchema = z.object({
  DEMO_USER_EMAIL: z.email().optional(),
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
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
