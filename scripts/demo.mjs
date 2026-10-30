import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { buildDemoData } from "../supabase/seed/demo-data.ts";

async function run() {
  const config = z
    .object({
      NEXT_PUBLIC_SUPABASE_URL: z.url(),
      SUPABASE_SECRET_KEY: z.string().min(1),
      DEMO_USER_ID: z.uuid(),
      DEMO_USER_EMAIL: z.email(),
    })
    .safeParse(process.env);
  if (!config.success)
    throw new Error(
      "Set the Supabase URL, server-only key, DEMO_USER_ID and DEMO_USER_EMAIL in your private environment.",
    );
  const args = process.argv.slice(2);
  const reset = args.includes("--reset");
  if (
    args.some((arg) => arg !== "--reset" && !arg.startsWith("--confirm-owner="))
  )
    throw new Error("Unknown demo command argument.");
  const confirmed = args
    .find((arg) => arg.startsWith("--confirm-owner="))
    ?.slice("--confirm-owner=".length);
  if (reset && confirmed !== config.data.DEMO_USER_ID)
    throw new Error(
      "Reset requires --confirm-owner=<DEMO_USER_ID>. It deletes all Collections and Items for that demo user.",
    );
  const admin = createClient(
    config.data.NEXT_PUBLIC_SUPABASE_URL,
    config.data.SUPABASE_SECRET_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const user = await admin.auth.admin.getUserById(config.data.DEMO_USER_ID);
  if (
    user.error ||
    user.data.user?.email?.toLowerCase() !==
      config.data.DEMO_USER_EMAIL.toLowerCase()
  )
    throw new Error("Demo account ID/email verification failed.");
  const result = await admin.rpc("seed_demo_library", {
    p_owner_id: config.data.DEMO_USER_ID,
    p_expected_email: config.data.DEMO_USER_EMAIL,
    p_collections: buildDemoData(),
    p_reset: reset,
    p_confirm_owner_id: reset ? confirmed : null,
  });
  if (result.error)
    throw new Error(
      "Demo seed/reset failed. Check the migration, admin key and configured owner. Existing data is rolled back on failure.",
    );
  console.log(
    result.data?.status === "unchanged"
      ? "Demo was already seeded; no data changed."
      : "Demo seeded: 3 Collections, 18 fictional Items. Image cleanup is queued where needed.",
  );
}
run().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Demo operation failed.",
  );
  process.exitCode = 1;
});
