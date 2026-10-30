import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getLocalSupabaseStatus } from "./local-status.mjs";

const status = getLocalSupabaseStatus();
const options = { auth: { autoRefreshToken: false, persistSession: false } };
const client = () =>
  createClient(status.API_URL, status.PUBLISHABLE_KEY, options);
const admin = createClient(status.API_URL, status.SECRET_KEY, options);
const users = [];
const password = `Local-${randomUUID()}-Aa1!`;
const config = {
  columns: 3,
  aspectRatio: "3:4",
  imageFit: "cover",
  showDetails: true,
  visibleFieldIds: ["title"],
  spacing: "normal",
  sortBy: "createdAt",
  sortDirection: "desc",
};

function ok(result, operation) {
  // Do not let assertion formatting expose credentials, JWTs, signed URLs or response bodies.
  assert(!result.error, `${operation} failed`);
  return result.data;
}

async function createUser(label) {
  const email = `security-${label}-${randomUUID()}@example.test`;
  const data = ok(
    await admin.auth.admin.createUser({ email, password, email_confirm: true }),
    "create fixture user",
  );
  assert(data.user);
  users.push(data.user.id);
  return { email, id: data.user.id };
}

async function signIn(user) {
  const session = client();
  ok(
    await session.auth.signInWithPassword({ email: user.email, password }),
    "sign in fixture session",
  );
  return session;
}

async function rpc(session, name, args) {
  return ok(await session.rpc(name, args), name);
}

try {
  const owner = await createUser("owner");
  const stranger = await createUser("stranger");
  const [a, b, foreign] = await Promise.all([
    signIn(owner),
    signIn(owner),
    signIn(stranger),
  ]);
  const tokenA = ok(await a.auth.getSession(), "read first session").session
    ?.access_token;
  const tokenB = ok(await b.auth.getSession(), "read second session").session
    ?.access_token;
  assert(
    tokenA && tokenB && tokenA !== tokenB,
    "Expected two independently authenticated sessions",
  );

  const requestId = randomUUID();
  const fieldId = randomUUID();
  const optionId = randomUUID();
  const creation = {
    p_request_id: requestId,
    p_name: "Shared writable fixture",
    p_description: null,
    p_preset_key: "blank",
    p_view_config: config,
    p_fields: [
      {
        id: fieldId,
        name: "Status",
        type: "select",
        required: false,
        position: 0,
        options: [{ id: optionId, label: "Kept", position: 0 }],
      },
    ],
  };
  const created = await Promise.all([
    rpc(a, "create_collection_with_schema", creation),
    rpc(b, "create_collection_with_schema", creation),
  ]);
  assert(
    created[0] && created[0] === created[1],
    "Concurrent duplicate creation must return one owned Collection",
  );
  const collectionId = created[0];
  assert.equal(
    ok(
      await b
        .from("collections")
        .select("id")
        .eq("creation_request_id", requestId),
      "read shared collection",
    ).length,
    1,
  );
  const itemId = await rpc(a, "create_item_with_values", {
    p_collection_id: collectionId,
    p_title: "First",
    p_description: null,
    p_values: { [fieldId]: optionId },
  });

  for (const table of [
    "collections",
    "field_definitions",
    "field_options",
    "items",
  ]) {
    const id = {
      collections: collectionId,
      field_definitions: fieldId,
      field_options: optionId,
      items: itemId,
    }[table];
    assert.deepEqual(
      ok(
        await foreign.from(table).select("id").eq("id", id),
        "cross-owner direct read",
      ),
      [],
      `${table} must be private`,
    );
  }
  const forged = await foreign
    .from("collections")
    .insert({ name: "Forged", owner_id: owner.id });
  assert(forged.error, "Forged owner insertion must be rejected");
  const crossUpdate = await foreign.rpc("update_item_with_values", {
    p_collection_id: collectionId,
    p_item_id: itemId,
    p_title: "Intrusion",
    p_description: null,
    p_values: {},
  });
  assert(
    crossUpdate.error || !crossUpdate.data,
    "Cross-owner RPC must not mutate",
  );

  // Different clients read the same snapshot; commit order determines the saved value.
  const [snapshotA, snapshotB] = await Promise.all([
    a.from("items").select("title").eq("id", itemId).single(),
    b.from("items").select("title").eq("id", itemId).single(),
  ]);
  assert.equal(ok(snapshotA, "first snapshot").title, "First");
  assert.equal(ok(snapshotB, "second snapshot").title, "First");
  for (const [session, title] of [
    [a, "Session A edit"],
    [b, "Session B last write"],
  ]) {
    await rpc(session, "update_item_with_values", {
      p_collection_id: collectionId,
      p_item_id: itemId,
      p_title: title,
      p_description: null,
      p_values: { [fieldId]: optionId },
    });
  }
  assert.equal(
    ok(
      await a.from("items").select("title").eq("id", itemId).single(),
      "refresh latest Item",
    ).title,
    "Session B last write",
  );

  await rpc(a, "delete_option_with_cleanup", {
    p_collection_id: collectionId,
    p_field_id: fieldId,
    p_option_id: optionId,
  });
  const stale = await b.rpc("update_item_with_values", {
    p_collection_id: collectionId,
    p_item_id: itemId,
    p_title: "Stale write",
    p_description: null,
    p_values: { [fieldId]: optionId },
  });
  assert(stale.error, "Stale option membership must be rejected");
  const recovered = ok(
    await b.from("items").select("title,values").eq("id", itemId).single(),
    "refresh after stale write",
  );
  assert.equal(recovered.title, "Session B last write");
  assert.deepEqual(recovered.values, {});

  await rpc(a, "delete_item_with_cleanup", {
    p_collection_id: collectionId,
    p_item_id: itemId,
  });
  const disappeared = await b.rpc("update_item_with_values", {
    p_collection_id: collectionId,
    p_item_id: itemId,
    p_title: "Deleted write",
    p_description: null,
    p_values: {},
  });
  assert(
    disappeared.error || !disappeared.data,
    "Stale deleted Item must not be recreated",
  );
  assert.deepEqual(
    ok(
      await b.from("items").select("id").eq("id", itemId),
      "refresh deleted Item",
    ),
    [],
  );

  ok(await a.auth.signOut({ scope: "local" }), "logout first session");
  assert.equal(
    ok(await a.auth.getSession(), "read logged-out session").session,
    null,
    "Local logout must clear the first session",
  );
  assert.equal(
    ok(await b.auth.getUser(), "validate other session").user.id,
    owner.id,
    "Local logout must preserve the other session",
  );
  console.log(
    "Security sessions passed: concurrent idempotency, two-owner isolation, forged owner rejection, shared last-write-wins, stale option/item recovery and local logout isolation.",
  );
} finally {
  let cleanupFailed = false;
  for (const userId of users.reverse()) {
    try {
      if ((await admin.auth.admin.deleteUser(userId)).error)
        cleanupFailed = true;
    } catch {
      cleanupFailed = true;
    }
  }
  assert(
    !cleanupFailed,
    "Could not remove every disposable fixture user; inspect local Auth fixtures",
  );
}
