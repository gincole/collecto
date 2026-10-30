import assert from "node:assert/strict";

export function assertPassingTap(output) {
  const plan = output.match(/^\s*1\.\.(\d+)\s*$/m);
  const expected = Number(plan?.[1]);
  const passed = [...output.matchAll(/^\s*ok (\d+)(?:\s+-[^\n]*)?\s*$/gm)];
  assert(
    expected > 0 && passed.length === expected,
    "SQL suite did not complete its TAP plan",
  );
  assert(
    !/not ok|Looks like you (?:failed|planned|ran)|Bail out!/i.test(output),
    "SQL suite reported a TAP failure",
  );
  assert(
    passed.every((match, index) => Number(match[1]) === index + 1),
    "SQL suite produced duplicate or out-of-order TAP results",
  );
}
