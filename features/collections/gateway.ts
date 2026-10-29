import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/lib/supabase/database.types";

import { mapCollectionRecord } from "./models";
import type { CollectionCreatePayload } from "./presets";
import type { CollectionUpdateData } from "./schemas";
import type { CollectionGateway } from "./service";

type CollectionClient = SupabaseClient<Database>;

export function createCollectionGateway(
  client: CollectionClient,
): CollectionGateway {
  const getOwned = async (ownerId: string, collectionId: string) => {
    const { data, error } = await client
      .from("collections")
      .select(
        "id, name, description, preset_key, view_config, created_at, updated_at, field_definitions(id, name, type, required, position, field_options(id, label, position))",
      )
      .eq("owner_id", ownerId)
      .eq("id", collectionId)
      .maybeSingle();

    if (error || !data) return { data: null, error };

    try {
      return { data: mapCollectionRecord(data), error: null };
    } catch {
      return { data: null, error: { code: "INVALID_DATABASE_RESPONSE" } };
    }
  };

  return {
    async createAtomic(payload: CollectionCreatePayload) {
      const fields: Json = payload.fields.map((field) => ({
        id: field.id,
        name: field.name,
        options: field.options.map((option) => ({ ...option })),
        position: field.position,
        required: field.required,
        type: field.type,
      }));
      const viewConfig: Json = {
        aspectRatio: payload.viewConfig.aspectRatio,
        columns: payload.viewConfig.columns,
        imageFit: payload.viewConfig.imageFit,
        showDetails: payload.viewConfig.showDetails,
        sortBy: payload.viewConfig.sortBy,
        sortDirection: payload.viewConfig.sortDirection,
        spacing: payload.viewConfig.spacing,
        visibleFieldIds: [...payload.viewConfig.visibleFieldIds],
      };
      const { data, error } = await client.rpc(
        "create_collection_with_schema",
        {
          p_description: payload.description,
          p_fields: fields,
          p_name: payload.name,
          p_preset_key: payload.presetKey,
          p_request_id: payload.requestId,
          p_view_config: viewConfig,
        },
      );

      return { data: data ? { id: data } : null, error };
    },
    async deleteOwned(ownerId: string, collectionId: string) {
      return client
        .from("collections")
        .delete()
        .eq("owner_id", ownerId)
        .eq("id", collectionId)
        .select("id")
        .maybeSingle();
    },
    getOwned,
    async getUser() {
      const { data, error } = await client.auth.getUser();
      return { data: data.user, error };
    },
    async listOwned(ownerId: string) {
      const { data, error } = await client
        .from("collections")
        .select(
          "id, name, description, preset_key, view_config, created_at, updated_at, field_definitions(id, name, type, required, position, field_options(id, label, position))",
        )
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false });

      if (error || !data) return { data: null, error };
      try {
        return { data: data.map(mapCollectionRecord), error: null };
      } catch {
        return { data: null, error: { code: "INVALID_DATABASE_RESPONSE" } };
      }
    },
    logError(operation, error) {
      const errorCode =
        typeof error === "object" && error && "code" in error
          ? String(error.code)
          : "UNEXPECTED";
      console.error("Collection operation failed", { errorCode, operation });
    },
    async updateOwned(ownerId: string, input: CollectionUpdateData) {
      const changes: { description?: string | null; name?: string } = {};
      if (input.description !== undefined)
        changes.description = input.description;
      if (input.name !== undefined) changes.name = input.name;

      return client
        .from("collections")
        .update(changes)
        .eq("owner_id", ownerId)
        .eq("id", input.collectionId)
        .select("id")
        .maybeSingle();
    },
  };
}
