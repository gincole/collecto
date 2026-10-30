import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { assertPassingTap } from "./tap-result.mjs";

const directory = new URL("./database/", import.meta.url);
const container =
  process.env.LOCAL_SUPABASE_DB_CONTAINER ?? "supabase_db_collecto";
assert(
  /^[a-zA-Z0-9_-]+$/.test(container),
  "Invalid local database container name",
);
for (const name of readdirSync(directory)
  .filter((name) => name.endsWith(".test.sql"))
  .sort()) {
  const input = readFileSync(new URL(name, directory), "utf8");
  assert(
    /^begin;/im.test(input) && /rollback;\s*$/i.test(input),
    `${name} must roll back fixture data`,
  );
  const result = spawnSync(
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
    { input, encoding: "utf8" },
  );
  assert(
    result.status === 0,
    `${name} failed; inspect the local database suite`,
  );
  assertPassingTap(result.stdout);
  console.log(`${name}: PASS`);
}
