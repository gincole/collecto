"use server";

import { createClient } from "@/lib/supabase/server";

import { createCollectionGateway } from "./gateway";
import type { CollectionCreateInput, CollectionUpdateInput } from "./schemas";
import {
  createCollection,
  deleteCollection,
  updateCollection,
} from "./service";

export async function createCollectionAction(input: CollectionCreateInput) {
  const client = await createClient();
  return createCollection(input, createCollectionGateway(client));
}

export async function updateCollectionAction(input: CollectionUpdateInput) {
  const client = await createClient();
  return updateCollection(input, createCollectionGateway(client));
}

export async function deleteCollectionAction(collectionId: string) {
  const client = await createClient();
  return deleteCollection(collectionId, createCollectionGateway(client));
}
