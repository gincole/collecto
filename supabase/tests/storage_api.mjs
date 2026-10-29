import assert from "node:assert/strict";
import { execFileSync, execSync } from "node:child_process";
import { randomUUID } from "node:crypto";

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
const apiUrl = localStatus.API_URL;
const publishableKey = localStatus.PUBLISHABLE_KEY;
const secretKey = localStatus.SECRET_KEY;

assert(apiUrl, "LOCAL_SUPABASE_URL is required");
assert(publishableKey, "LOCAL_SUPABASE_PUBLISHABLE_KEY is required");
assert(secretKey, "LOCAL_SUPABASE_SECRET_KEY is required");

const admin = createClient(apiUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const bucket = "item-images";
const password = `Local-${randomUUID()}-Aa1!`;
const runId = randomUUID();
const users = [];
let objectPath;

async function createTestUser(label) {
  const email = `storage-${label}-${runId}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
  });

  assert.ifError(error);
  assert(data.user, `Failed to create ${label} user`);
  users.push(data.user.id);

  const client = createClient(apiUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const signInResult = await client.auth.signInWithPassword({
    email,
    password,
  });
  assert.ifError(signInResult.error);

  return { client, user: data.user };
}

try {
  const owner = await createTestUser("owner");
  const stranger = await createTestUser("stranger");
  const collectionId = randomUUID();

  const collectionResult = await admin.from("collections").insert({
    id: collectionId,
    name: "Storage policy integration test",
    owner_id: owner.user.id,
  });
  assert.ifError(collectionResult.error);

  objectPath = `${owner.user.id}/${collectionId}/${randomUUID()}/${randomUUID()}.png`;
  const imageBytes = Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  const uploadResult = await owner.client.storage
    .from(bucket)
    .upload(objectPath, imageBytes, { contentType: "image/png" });
  assert.ifError(uploadResult.error);

  const publicUrl = owner.client.storage.from(bucket).getPublicUrl(objectPath);
  const publicResponse = await fetch(publicUrl.data.publicUrl);
  assert.equal(
    publicResponse.ok,
    false,
    "The bucket must not allow public reads",
  );

  const signedResult = await owner.client.storage
    .from(bucket)
    .createSignedUrl(objectPath, 60);
  assert.ifError(signedResult.error);
  assert(signedResult.data?.signedUrl, "Owner must receive a signed URL");
  const signedResponse = await fetch(signedResult.data.signedUrl);
  assert.equal(
    signedResponse.ok,
    true,
    "Owner signed URL must read the object",
  );

  const replacementBytes = Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01,
  ]);
  const ownerReplace = await owner.client.storage
    .from(bucket)
    .upload(objectPath, replacementBytes, {
      contentType: "image/png",
      upsert: true,
    });
  assert.ifError(ownerReplace.error);
  const ownerReplacementRead = await owner.client.storage
    .from(bucket)
    .download(objectPath);
  assert.ifError(ownerReplacementRead.error);
  assert.deepEqual(
    new Uint8Array(await ownerReplacementRead.data.arrayBuffer()),
    replacementBytes,
    "Owner replacement must update the stored bytes",
  );

  const strangerRead = await stranger.client.storage
    .from(bucket)
    .download(objectPath);
  assert(strangerRead.error, "Another user must not read the object");

  const strangerSign = await stranger.client.storage
    .from(bucket)
    .createSignedUrl(objectPath, 60);
  assert(strangerSign.error, "Another user must not sign the object URL");

  const strangerReplace = await stranger.client.storage
    .from(bucket)
    .upload(objectPath, imageBytes, {
      contentType: "image/png",
      upsert: true,
    });
  assert(strangerReplace.error, "Another user must not replace the object");
  const ownerReadAfterStrangerReplace = await owner.client.storage
    .from(bucket)
    .download(objectPath);
  assert.ifError(ownerReadAfterStrangerReplace.error);
  assert.deepEqual(
    new Uint8Array(await ownerReadAfterStrangerReplace.data.arrayBuffer()),
    replacementBytes,
    "A rejected cross-owner replacement must not change stored bytes",
  );

  await stranger.client.storage.from(bucket).remove([objectPath]);
  const ownerReadAfterStrangerDelete = await owner.client.storage
    .from(bucket)
    .download(objectPath);
  assert.ifError(ownerReadAfterStrangerDelete.error);

  const deleteResult = await owner.client.storage
    .from(bucket)
    .remove([objectPath]);
  assert.ifError(deleteResult.error);
  const ownerReadAfterDelete = await owner.client.storage
    .from(bucket)
    .download(objectPath);
  assert(ownerReadAfterDelete.error, "Owner delete must remove the object");
  objectPath = undefined;

  console.log(
    "Storage API policies passed upload, replace, private read, signing, isolation, and delete checks.",
  );
} finally {
  if (objectPath) {
    await admin.storage.from(bucket).remove([objectPath]);
  }

  for (const userId of users.reverse()) {
    await admin.auth.admin.deleteUser(userId);
  }
}
