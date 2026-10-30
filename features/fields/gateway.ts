import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import type { FieldGateway } from "./service";

export function createFieldGateway(
  client: SupabaseClient<Database>,
): FieldGateway {
  const identity = (
    data: { id: string } | null,
    error: { code?: string; message?: string } | null,
  ) => ({ data, error });
  return {
    async createFieldOwned(_ownerId, input) {
      const { data, error } = await client.rpc("create_field", {
        p_collection_id: input.collectionId,
        p_name: input.name,
        p_required: input.required,
        p_type: input.type,
      });
      return identity(data, error);
    },
    async createOptionOwned(_ownerId, input) {
      const { data, error } = await client.rpc("create_field_option", {
        p_collection_id: input.collectionId,
        p_field_id: input.fieldId,
        p_label: input.label,
      });
      return identity(data, error);
    },
    async deleteFieldOwned(_ownerId, input) {
      const { data, error } = await client.rpc("delete_field_with_cleanup", {
        p_collection_id: input.collectionId,
        p_field_id: input.fieldId,
      });
      return {
        data: data
          ? { affectedItemCount: data.affected_item_count, id: data.id }
          : null,
        error,
      };
    },
    async deleteOptionOwned(_ownerId, input) {
      const { data, error } = await client.rpc("delete_option_with_cleanup", {
        p_collection_id: input.collectionId,
        p_field_id: input.fieldId,
        p_option_id: input.optionId,
      });
      return {
        data: data
          ? { affectedItemCount: data.affected_item_count, id: data.id }
          : null,
        error,
      };
    },
    async getFieldImpactOwned(_ownerId, input) {
      const { data, error } = await client.rpc("get_field_delete_impact", {
        p_collection_id: input.collectionId,
        p_field_id: input.fieldId,
      });
      return {
        data: data ? { affectedItemCount: data.affected_item_count } : null,
        error,
      };
    },
    async getOptionImpactOwned(_ownerId, input) {
      const { data, error } = await client.rpc("get_option_delete_impact", {
        p_collection_id: input.collectionId,
        p_field_id: input.fieldId,
        p_option_id: input.optionId,
      });
      return {
        data: data ? { affectedItemCount: data.affected_item_count } : null,
        error,
      };
    },
    async getUser() {
      const { data, error } = await client.auth.getUser();
      return { data: data.user, error };
    },
    logError(operation, error) {
      const errorCode =
        typeof error === "object" && error && "code" in error
          ? String(error.code)
          : "UNEXPECTED";
      console.error("Field operation failed", { errorCode, operation });
    },
    async reorderFieldsOwned(_ownerId, input) {
      const { data, error } = await client.rpc("reorder_fields", {
        p_collection_id: input.collectionId,
        p_field_ids: input.fieldIds,
      });
      return identity(data, error);
    },
    async reorderOptionsOwned(_ownerId, input) {
      const { data, error } = await client.rpc("reorder_field_options", {
        p_collection_id: input.collectionId,
        p_field_id: input.fieldId,
        p_option_ids: input.optionIds,
      });
      return identity(data, error);
    },
    async updateFieldOwned(_ownerId, input) {
      const { data, error } = await client.rpc("update_field", {
        p_collection_id: input.collectionId,
        p_field_id: input.fieldId,
        p_name: input.name ?? null,
        p_required: input.required ?? null,
      });
      return identity(data, error);
    },
    async updateOptionOwned(_ownerId, input) {
      const { data, error } = await client.rpc("update_field_option", {
        p_collection_id: input.collectionId,
        p_field_id: input.fieldId,
        p_label: input.label,
        p_option_id: input.optionId,
      });
      return identity(data, error);
    },
  };
}
