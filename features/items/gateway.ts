import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import { mapItemRecord } from "./models";
import type { ItemGateway } from "./service";

export function createItemGateway(
  client: SupabaseClient<Database>,
): ItemGateway {
  const schemaSelect =
    "id, name, field_definitions(id, name, type, required, position, field_options(id, label, position))";
  return {
    async getUser() {
      const { data, error } = await client.auth.getUser();
      return { data: data.user, error };
    },
    async getCollectionSchemaOwned(ownerId, collectionId) {
      const { data, error } = await client
        .from("collections")
        .select(schemaSelect)
        .eq("owner_id", ownerId)
        .eq("id", collectionId)
        .maybeSingle();
      if (error || !data) return { data: null, error };
      return {
        data: {
          id: data.id,
          name: data.name,
          fields: data.field_definitions
            .map((field) => ({ ...field, options: field.field_options }))
            .sort((a, b) => a.position - b.position),
        },
        error: null,
      };
    },
    async createOwned(_ownerId, input) {
      const { data, error } = await client.rpc("create_item_with_values", {
        p_collection_id: input.collectionId,
        p_description: input.description,
        p_title: input.title,
        p_values: input.values as Json,
      });
      return { data: data ? { id: data } : null, error };
    },
    async getOwned(ownerId, ids) {
      const { data, error } = await client
        .from("items")
        .select(
          "id, collection_id, title, description, values, created_at, updated_at, collections!inner(owner_id)",
        )
        .eq("collection_id", ids.collectionId)
        .eq("id", ids.itemId)
        .eq("collections.owner_id", ownerId)
        .maybeSingle();
      if (error || !data) return { data: null, error };
      try {
        return { data: mapItemRecord(data), error: null };
      } catch {
        return { data: null, error: { code: "INVALID_DATABASE_RESPONSE" } };
      }
    },
    async listOwned(ownerId, collectionId) {
      const { data, error } = await client
        .from("items")
        .select(
          "id, collection_id, title, description, values, created_at, updated_at, collections!inner(owner_id)",
        )
        .eq("collection_id", collectionId)
        .eq("collections.owner_id", ownerId)
        .order("created_at", { ascending: false });
      if (error || !data) return { data: null, error };
      try {
        return { data: data.map(mapItemRecord), error: null };
      } catch {
        return { data: null, error: { code: "INVALID_DATABASE_RESPONSE" } };
      }
    },
    async updateOwned(_ownerId, input) {
      const { data, error } = await client.rpc("update_item_with_values", {
        p_collection_id: input.collectionId,
        p_description: input.description,
        p_item_id: input.itemId,
        p_title: input.title,
        p_values: input.values as Json,
      });
      return { data: data ? { id: data } : null, error };
    },
    async deleteOwned(_ownerId, ids) {
      return client
        .from("items")
        .delete()
        .eq("collection_id", ids.collectionId)
        .eq("id", ids.itemId)
        .select("id")
        .maybeSingle();
    },
    logError(operation, error) {
      const errorCode =
        typeof error === "object" && error && "code" in error
          ? String(error.code)
          : "UNEXPECTED";
      console.error("Item operation failed", { errorCode, operation });
    },
  };
}
