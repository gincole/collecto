import assert from "node:assert/strict";
import { execFileSync, execSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

function getLocalSupabaseStatus() {
  if (
    process.env.LOCAL_SUPABASE_URL &&
    process.env.LOCAL_SUPABASE_PUBLISHABLE_KEY &&
    process.env.LOCAL_SUPABASE_SECRET_KEY
  ) {
    return {
      API_URL: process.env.LOCAL_SUPABASE_URL,
      PUBLISHABLE_KEY: process.env.LOCAL_SUPABASE_PUBLISHABLE_KEY,
      SECRET_KEY: process.env.LOCAL_SUPABASE_SECRET_KEY,
    };
  }

  const options = {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  };
  const output =
    process.platform === "win32"
      ? execSync("corepack pnpm dlx supabase status -o json", options)
      : execFileSync(
          "corepack",
          ["pnpm", "dlx", "supabase", "status", "-o", "json"],
          options,
        );

  return JSON.parse(output);
}

const localStatus = getLocalSupabaseStatus();
const admin = createClient(localStatus.API_URL, localStatus.SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const cookieJar = new Map();
const password = `Local-${randomUUID()}-Aa1!`;
const email = `ssr-session-${randomUUID()}@example.test`;
let userId;

function createSsrClient() {
  return createServerClient(localStatus.API_URL, localStatus.PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return [...cookieJar.values()].map(({ name, value }) => ({
          name,
          value,
        }));
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          if (cookie.value) {
            cookieJar.set(cookie.name, cookie);
          } else {
            cookieJar.delete(cookie.name);
          }
        }
      },
    },
  });
}

try {
  const createdUser = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
  });
  assert.ifError(createdUser.error);
  assert(createdUser.data.user, "Failed to create the SSR test user");
  userId = createdUser.data.user.id;

  const signInResult = await createSsrClient().auth.signInWithPassword({
    email,
    password,
  });
  assert.ifError(signInResult.error);
  assert(cookieJar.size > 0, "Sign-in must persist session cookies");

  const requestAfterRefresh = createSsrClient();
  const currentUser = await requestAfterRefresh.auth.getUser();
  assert.ifError(currentUser.error);
  assert.equal(currentUser.data.user?.id, userId);
  const currentClaims = await requestAfterRefresh.auth.getClaims();
  assert.ifError(currentClaims.error);
  assert.equal(currentClaims.data.claims?.sub, userId);

  const refreshResult = await requestAfterRefresh.auth.refreshSession();
  assert.ifError(refreshResult.error);
  assert.equal(refreshResult.data.user?.id, userId);

  const nextRequest = await createSsrClient().auth.getUser();
  assert.ifError(nextRequest.error);
  assert.equal(
    nextRequest.data.user?.id,
    userId,
    "A refreshed cookie session must survive a new server request",
  );

  console.log(
    "Supabase SSR cookies passed sign-in, refresh, and subsequent-request checks.",
  );
} finally {
  if (userId) {
    await admin.auth.admin.deleteUser(userId);
  }
}
