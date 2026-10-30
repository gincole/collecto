import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { getLocalSupabaseStatus } from "./local-status.mjs";
import { buildDemoData } from "../seed/demo-data.ts";

const status = getLocalSupabaseStatus();
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(status.API_URL, status.SECRET_KEY, options);
const users = [];
const password = `Local-${randomUUID()}-Aa1!`;
const ok = (result, operation) => {
  assert(!result.error, `${operation} failed`);
  return result.data;
};
try {
  const email = `demo-seed-${randomUUID()}@example.test`;
  const owner = ok(
    await admin.auth.admin.createUser({ email, password, email_confirm: true }),
    "create demo fixture",
  ).user;
  assert(owner);
  users.push(owner.id);
  const other = ok(
    await admin.auth.admin.createUser({
      email: `demo-other-${randomUUID()}@example.test`,
      password,
      email_confirm: true,
    }),
    "create isolation fixture",
  ).user;
  assert(other);
  users.push(other.id);
  const sentinel = ok(
    await admin
      .from("collections")
      .insert({ owner_id: other.id, name: "Keep other owner data" })
      .select("id")
      .single(),
    "create sentinel",
  );
  const sessionA = createClient(
    status.API_URL,
    status.PUBLISHABLE_KEY,
    options,
  );
  const sessionB = createClient(
    status.API_URL,
    status.PUBLISHABLE_KEY,
    options,
  );
  for (const session of [sessionA, sessionB])
    ok(
      await session.auth.signInWithPassword({ email, password }),
      "login fixture session",
    );
  const payload = {
    p_owner_id: owner.id,
    p_expected_email: email,
    p_collections: buildDemoData(),
  };
  assert(
    (await sessionA.rpc("seed_demo_library", payload)).error,
    "Visitors must not seed or reset",
  );
  assert(
    (
      await createClient(status.API_URL, status.PUBLISHABLE_KEY, options).rpc(
        "seed_demo_library",
        payload,
      )
    ).error,
    "Anonymous callers must not seed",
  );
  assert(
    (
      await admin.rpc("seed_demo_library", {
        ...payload,
        p_expected_email: "wrong@example.test",
      })
    ).error,
    "Email confirmation must match",
  );
  assert.equal(
    ok(await admin.rpc("seed_demo_library", payload), "seed").status,
    "seeded",
  );
  assert.equal(
    ok(
      await admin.rpc("seed_demo_library", {
        ...payload,
        p_collections: buildDemoData(),
      }),
      "idempotent seed",
    ).status,
    "unchanged",
  );
  const before = ok(
    await sessionA
      .from("collections")
      .select("id,items(id,title)")
      .order("name"),
    "read demo collections",
  );
  assert.equal(before.length, 3);
  assert(before.every((c) => c.items.length === 6));
  const item = before[0].items[0];
  ok(
    await sessionA
      .from("items")
      .update({ title: "Session A change" })
      .eq("id", item.id),
    "first shared edit",
  );
  assert.equal(
    ok(
      await sessionB.from("items").select("title").eq("id", item.id).single(),
      "other session read",
    ).title,
    "Session A change",
  );
  ok(
    await sessionB
      .from("items")
      .update({ title: "Session B last write" })
      .eq("id", item.id),
    "second shared edit",
  );
  assert.equal(
    ok(
      await sessionA.from("items").select("title").eq("id", item.id).single(),
      "latest shared read",
    ).title,
    "Session B last write",
  );
  assert(
    (await admin.rpc("seed_demo_library", { ...payload, p_reset: true })).error,
    "Reset must confirm owner",
  );
  for (const omitted of ["items", "fields"]) {
    const malformed = buildDemoData().map(({ items, fields, ...rest }) =>
      omitted === "items" ? { ...rest, fields } : { ...rest, items },
    );
    assert(
      (
        await admin.rpc("seed_demo_library", {
          ...payload,
          p_collections: malformed,
          p_reset: true,
          p_confirm_owner_id: owner.id,
        })
      ).error,
      `Missing ${omitted} must fail`,
    );
  }
  const invalid = buildDemoData();
  invalid[0].items[0].values = { [randomUUID()]: "unknown" };
  assert(
    (
      await admin.rpc("seed_demo_library", {
        ...payload,
        p_collections: invalid,
        p_reset: true,
        p_confirm_owner_id: owner.id,
      })
    ).error,
    "Invalid reset must fail",
  );
  assert.equal(
    ok(
      await sessionA.from("items").select("title").eq("id", item.id).single(),
      "rollback retained edited item",
    ).title,
    "Session B last write",
  );
  const path = `${owner.id}/${before[0].id}/${item.id}/${randomUUID()}.png`;
  ok(
    await admin.from("items").update({ image_path: path }).eq("id", item.id),
    "prepare cleanup fixture",
  );
  const replacementPath = `${owner.id}/${before[0].id}/${item.id}/${randomUUID()}.png`;
  const container =
    process.env.LOCAL_SUPABASE_DB_CONTAINER ?? "supabase_db_collecto";
  assert(/^[a-zA-Z0-9_-]+$/.test(container));
  const writer = spawn(
    "docker",
    [
      "exec",
      "-i",
      container,
      "psql",
      "-X",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
    ],
    { stdio: ["pipe", "pipe", "pipe"] },
  );
  const finished = new Promise((resolve, reject) => {
    writer.on("error", () =>
      reject(new Error("Local concurrent image writer failed")),
    );
    writer.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error("Local concurrent image writer failed")),
    );
  });
  const locked = new Promise((resolve, reject) => {
    let output = "";
    writer.stdout.on("data", (chunk) => {
      output += chunk.toString();
      if (output.includes("IMAGE_LOCKED")) resolve();
    });
    writer.on("error", () => reject(new Error("Image lock unavailable")));
    writer.on("close", () => {
      if (!output.includes("IMAGE_LOCKED"))
        reject(new Error("Image lock unavailable"));
    });
  });
  writer.stdin.end(
    `begin;\nupdate public.items set image_path = '${replacementPath}' where id = '${item.id}';\n\\echo IMAGE_LOCKED\nselect pg_sleep(1);\ncommit;\n`,
  );
  await locked;
  ok(
    await admin.rpc("seed_demo_library", {
      ...payload,
      p_collections: buildDemoData(),
      p_reset: true,
      p_confirm_owner_id: owner.id,
    }),
    "reset",
  );
  await finished;
  const after = ok(
    await sessionB.from("collections").select("id,name,items(id,title)"),
    "read reset fixture",
  );
  assert.equal(after.length, 3);
  assert(after.every((c) => c.items.length === 6));
  assert(
    !after.some((c) => before.some((old) => old.id === c.id)),
    "Reset must replace demo state",
  );
  assert.equal(
    ok(
      await admin
        .from("storage_cleanup_jobs")
        .select("id")
        .eq("owner_id", owner.id)
        .eq("object_path", replacementPath),
      "verify durable cleanup",
    ).length,
    1,
  );
  assert(
    ok(
      await admin
        .from("collections")
        .select("id")
        .eq("id", sentinel.id)
        .single(),
      "other owner survives reset",
    ),
  );
  console.log(
    "Demo seed passed: 3 Collections/18 Items, idempotency, admin-only access, two sessions, atomic reset rollback, cleanup queue and owner isolation.",
  );
} finally {
  let failed = false;
  for (const id of users.reverse()) {
    try {
      if (
        (await admin.from("storage_cleanup_jobs").delete().eq("owner_id", id))
          .error
      )
        failed = true;
      if ((await admin.auth.admin.deleteUser(id)).error) failed = true;
    } catch {
      failed = true;
    }
  }
  assert(!failed, "Could not remove all local demo fixtures");
}
