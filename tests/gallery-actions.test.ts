import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc, read, auth, revalidate } = vi.hoisted(() => ({
  rpc: vi.fn(),
  read: vi.fn(),
  auth: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidate }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ rpc }),
}));
vi.mock("@/features/collections/gateway", () => ({
  createCollectionGateway: () => ({
    getUser: auth,
    getOwned: read,
    logError: vi.fn(),
  }),
}));

import { saveGalleryConfigAction } from "@/features/gallery/actions";

const id = "00000000-0000-4000-8000-000000000001";
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
beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ data: { id }, error: null });
  read.mockResolvedValue({ data: { id, fields: [] }, error: null });
  rpc.mockResolvedValue({ data: id, error: null });
});

describe("Gallery Server Action", () => {
  it("writes through the authenticated RPC and revalidates only after success", async () => {
    expect(await saveGalleryConfigAction({ collectionId: id, config })).toEqual(
      { status: "success" },
    );
    expect(read).toHaveBeenCalledWith(id, id);
    expect(rpc).toHaveBeenCalledWith("update_gallery_config", {
      p_collection_id: id,
      p_config: config,
    });
    expect(revalidate).toHaveBeenCalledWith(`/collections/${id}`);
  });
  it("does not write or revalidate invalid input or another owner's Collection", async () => {
    expect(
      (await saveGalleryConfigAction({ collectionId: "bad", config })).status,
    ).toBe("validation_error");
    read.mockResolvedValueOnce({ data: null, error: null });
    expect(
      (await saveGalleryConfigAction({ collectionId: id, config })).status,
    ).toBe("not_found");
    expect(rpc).not.toHaveBeenCalled();
    expect(revalidate).not.toHaveBeenCalled();
  });
  it("preserves a concurrent schema conflict without reporting success", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { code: "22023" } });
    expect(
      (await saveGalleryConfigAction({ collectionId: id, config })).status,
    ).toBe("conflict");
    expect(revalidate).not.toHaveBeenCalled();
  });
});
