import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  createSignedItemImageUrl,
  ITEM_IMAGE_BUCKET,
} from "@/lib/supabase/storage";

const notFound = () =>
  NextResponse.json({ error: "Not found" }, { status: 404 });

export async function GET(
  _request: Request,
  context: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await context.params;
  const client = await createClient();
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return notFound();

  const { data: item } = await client
    .from("items")
    .select("image_path, collection_id, collections!inner(owner_id)")
    .eq("id", itemId)
    .eq("collections.owner_id", auth.user.id)
    .maybeSingle();
  if (!item?.image_path) return notFound();

  try {
    const signedUrl = await createSignedItemImageUrl(item.image_path, {
      async createSignedUrl({ expiresIn, path }) {
        const { data, error } = await client.storage
          .from(ITEM_IMAGE_BUCKET)
          .createSignedUrl(path, expiresIn);
        if (error) throw error;
        return data.signedUrl;
      },
      async getAuthenticatedUserId() {
        return auth.user.id;
      },
      async ownsCollection(scope) {
        return scope.collectionId === item.collection_id;
      },
    });
    return NextResponse.redirect(signedUrl, 307);
  } catch {
    return notFound();
  }
}
