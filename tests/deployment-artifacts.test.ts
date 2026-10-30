import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { ESLint } from "eslint";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const generated = [
  ".vercel/cache/corepack/generated.ts",
  ".pnpm-store/v11/files/generated.ts",
];

describe("deployment artifact boundaries", () => {
  it("runs the formatter against source without parsing Vercel or pnpm cache files", () => {
    const fixture = mkdtempSync(path.join(tmpdir(), "collecto-format-"));
    try {
      for (const name of [".gitignore", ".prettierignore"]) {
        if (existsSync(path.join(root, name)))
          writeFileSync(
            path.join(fixture, name),
            readFileSync(path.join(root, name)),
          );
      }
      writeFileSync(
        path.join(fixture, "source.ts"),
        "export const ready = true;\n",
      );
      for (const file of generated) {
        mkdirSync(path.dirname(path.join(fixture, file)), { recursive: true });
        writeFileSync(
          path.join(fixture, file),
          "interface Generated { this is not valid TypeScript",
        );
      }
      const result = spawnSync(
        process.execPath,
        [
          path.join(root, "node_modules/prettier/bin/prettier.cjs"),
          "--check",
          ".",
        ],
        { cwd: fixture, encoding: "utf8" },
      );
      expect({
        status: result.status,
        output: result.stdout + result.stderr,
      }).toMatchObject({ status: 0 });
      // Real source errors must still block a deployment.
      writeFileSync(
        path.join(fixture, "source.ts"),
        "export const ready= true",
      );
      const invalid = spawnSync(
        process.execPath,
        [
          path.join(root, "node_modules/prettier/bin/prettier.cjs"),
          "--check",
          ".",
        ],
        { cwd: fixture, encoding: "utf8" },
      );
      expect(invalid.status).toBe(1);
      expect(invalid.stdout + invalid.stderr).toContain("source.ts");
      const config = JSON.parse(
        readFileSync(path.join(root, "tsconfig.json"), "utf8"),
      );
      const parsed = ts.parseJsonConfigFileContent(config, ts.sys, fixture);
      expect(
        parsed.fileNames.map((file) =>
          path.relative(fixture, file).replaceAll("\\", "/"),
        ),
      ).toEqual(["source.ts"]);
    } finally {
      if (path.dirname(path.resolve(fixture)) !== path.resolve(tmpdir()))
        throw new Error("Unexpected fixture cleanup path");
      rmSync(fixture, { recursive: true, force: true });
    }
  });

  it("keeps generated caches out of ESLint while checking application source", async () => {
    const eslint = new ESLint({ cwd: root });
    for (const file of generated)
      expect(await eslint.isPathIgnored(path.join(root, file))).toBe(true);
    expect(
      await eslint.isPathIgnored(
        path.join(root, "features/collections/models.ts"),
      ),
    ).toBe(false);
  });
});
