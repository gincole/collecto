import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { serverEnv } from "@/lib/env/server";
import type { Database } from "@/lib/supabase/database.types";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<Awaited<ReturnType<typeof cookies>>["set"]>[2];
};

export type SupabaseCookieStore = {
  getAll: () => Array<{ name: string; value: string }>;
  set: (name: string, value: string, options?: CookieToSet["options"]) => void;
};

export function createClientWithCookieStore(cookieStore: SupabaseCookieStore) {
  return createServerClient<Database>(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, options, value }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components cannot write cookies; the proxy refreshes them.
          }
        },
      },
    },
  );
}

export async function createClient() {
  return createClientWithCookieStore(await cookies());
}
