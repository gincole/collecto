import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function parsePublicEnv(
  input: Record<string, string | undefined>,
): PublicEnv {
  const result = publicEnvSchema.safeParse(input);

  if (!result.success) {
    const variableNames = [
      ...new Set(result.error.issues.map((issue) => String(issue.path[0]))),
    ].sort();

    throw new Error(
      `Invalid environment configuration: ${variableNames.join(", ")}`,
    );
  }

  return result.data;
}
