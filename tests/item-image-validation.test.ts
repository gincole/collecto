import { describe, expect, it } from "vitest";

import { validateItemImage } from "@/features/items/image-validation";

const png = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  ),
);

describe("Item image validation", () => {
  it("accepts a decodable JPEG, PNG, or WebP without using its filename", async () => {
    const file = new File([png], "private-name.png", { type: "image/png" });
    await expect(validateItemImage(file)).resolves.toMatchObject({
      byteLength: png.byteLength,
      mimeType: "image/png",
    });
  });

  it("rejects unsupported, oversized, and corrupt images", async () => {
    await expect(
      validateItemImage(new File([png], "image.gif", { type: "image/gif" })),
    ).rejects.toThrow("JPEG, PNG, or WebP");
    await expect(
      validateItemImage(
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", {
          type: "image/png",
        }),
      ),
    ).rejects.toThrow("5 MB");
    await expect(
      validateItemImage(
        new File([Uint8Array.from([1, 2, 3])], "broken.png", {
          type: "image/png",
        }),
      ),
    ).rejects.toThrow("valid image");
    await expect(
      validateItemImage(
        new File([png.slice(0, -20)], "truncated.png", { type: "image/png" }),
      ),
    ).rejects.toThrow("valid image");
  });
});
