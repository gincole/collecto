import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createItemGateway } from "./gateway";
import { getItem, listItems } from "./service";
export async function getItemQuery(collectionId: string, itemId: string) {
  const client = await createClient();
  return getItem({ collectionId, itemId }, createItemGateway(client));
}
export async function listItemsQuery(collectionId: string) {
  const client = await createClient();
  return listItems(collectionId, createItemGateway(client));
}
