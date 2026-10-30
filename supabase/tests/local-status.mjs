import assert from "node:assert/strict";
import { execFileSync, execSync } from "node:child_process";

export function assertLocalApiUrl(value) {
  const url = new URL(value);
  assert(
    ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname),
    "Integration tests require a loopback Supabase API",
  );
  assert(
    ["http:", "https:"].includes(url.protocol),
    "Invalid local API protocol",
  );
  return value;
}

export function getLocalSupabaseStatus() {
  const names = [
    "LOCAL_SUPABASE_URL",
    "LOCAL_SUPABASE_PUBLISHABLE_KEY",
    "LOCAL_SUPABASE_SECRET_KEY",
  ];
  const provided = names.filter((name) => process.env[name]);
  let status;
  if (provided.length) {
    assert.equal(
      provided.length,
      names.length,
      "Provide all three LOCAL_SUPABASE variables together",
    );
    status = {
      API_URL: process.env.LOCAL_SUPABASE_URL,
      PUBLISHABLE_KEY: process.env.LOCAL_SUPABASE_PUBLISHABLE_KEY,
      SECRET_KEY: process.env.LOCAL_SUPABASE_SECRET_KEY,
    };
  } else {
    const options = { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] };
    let output;
    try {
      output =
        process.platform === "win32"
          ? execSync("corepack pnpm dlx supabase status -o json", options)
          : execFileSync(
              "corepack",
              ["pnpm", "dlx", "supabase", "status", "-o", "json"],
              options,
            );
    } catch {
      throw new Error(
        "Could not read local Supabase status. Start the local stack and check Docker access.",
      );
    }
    status = JSON.parse(output);
  }
  assertLocalApiUrl(status.API_URL);
  assert(
    status.PUBLISHABLE_KEY && status.SECRET_KEY,
    "Local Supabase API keys are required",
  );
  return status;
}
