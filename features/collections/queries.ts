import "server-only";

import { createClient } from "@/lib/supabase/server";

import { createCollectionGateway } from "./gateway";
import { getCollection, listCollections } from "./service";

export async function listCollectionsQuery() {
  const client = await createClient();
  return listCollections(createCollectionGateway(client));
}

export async function getCollectionQuery(collectionId: string) {
  const client = await createClient();
  return getCollection(collectionId, createCollectionGateway(client));
}
