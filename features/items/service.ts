import type { ItemMutationData, ItemValidationResult } from "./schemas";
import { parseItemIds, validateItemInput } from "./schemas";
import type { ItemFieldDefinition, ItemRecord } from "./types";

type GatewayError = { code?: string; message?: string };
type GatewayResult<T> = Promise<{ data: T | null; error: GatewayError | null }>;
type ItemIdentity = { id: string };
export type ItemGateway = {
  createOwned: (
    ownerId: string,
    input: ItemMutationData,
  ) => GatewayResult<ItemIdentity>;
  deleteOwned: (
    ownerId: string,
    ids: { collectionId: string; itemId: string },
  ) => GatewayResult<ItemIdentity>;
  getCollectionSchemaOwned: (
    ownerId: string,
    collectionId: string,
  ) => GatewayResult<{
    fields: ItemFieldDefinition[];
    id: string;
    name: string;
  }>;
  getOwned: (
    ownerId: string,
    ids: { collectionId: string; itemId: string },
  ) => GatewayResult<ItemRecord>;
  getUser: () => GatewayResult<{ id: string }>;
  listOwned: (
    ownerId: string,
    collectionId: string,
  ) => GatewayResult<ItemRecord[]>;
  logError: (operation: string, error?: unknown) => void;
  updateOwned: (
    ownerId: string,
    input: ItemMutationData & { itemId: string },
  ) => GatewayResult<ItemIdentity>;
};
export type ItemOperationResult<T = never> =
  | { data: T; status: "success" }
  | {
      fieldErrors: Record<string, string>;
      formError?: string;
      status: "validation_error";
    }
  | { status: "unauthorized" | "not_found" | "error" };

async function authenticate(
  gateway: ItemGateway,
): Promise<
  { user: { id: string } } | { result: { status: "error" | "unauthorized" } }
> {
  try {
    const { data, error } = await gateway.getUser();
    if (error) {
      gateway.logError("authenticate", error);
      return { result: { status: "error" as const } };
    }
    return data
      ? { user: data }
      : { result: { status: "unauthorized" as const } };
  } catch (error) {
    gateway.logError("authenticate", error);
    return { result: { status: "error" as const } };
  }
}
async function schemaFor(
  collectionId: unknown,
  ownerId: string,
  gateway: ItemGateway,
): Promise<
  | { schema: { fields: ItemFieldDefinition[]; id: string; name: string } }
  | { result: Exclude<ItemOperationResult, { data: unknown }> }
> {
  if (typeof collectionId !== "string")
    return {
      result: {
        fieldErrors: {},
        formError: "The Collection is invalid.",
        status: "validation_error" as const,
      },
    };
  const { data, error } = await gateway.getCollectionSchemaOwned(
    ownerId,
    collectionId,
  );
  if (error && error.code !== "PGRST116") {
    gateway.logError("read-schema", error);
    return { result: { status: "error" as const } };
  }
  return data ? { schema: data } : { result: { status: "not_found" as const } };
}
const invalid = (
  result: Extract<ItemValidationResult, { success: false }>,
): ItemOperationResult => ({
  fieldErrors: result.fieldErrors,
  formError: result.formError,
  status: "validation_error",
});

export async function createItem(
  input: unknown,
  gateway: ItemGateway,
): Promise<ItemOperationResult<ItemIdentity>> {
  const auth = await authenticate(gateway);
  if ("result" in auth) return auth.result;
  const schema = await schemaFor(
    (input as { collectionId?: unknown } | null)?.collectionId,
    auth.user.id,
    gateway,
  );
  if ("result" in schema) return schema.result;
  const parsed = validateItemInput(input, schema.schema.fields);
  if (!parsed.success) return invalid(parsed);
  try {
    const { data, error } = await gateway.createOwned(
      auth.user.id,
      parsed.data,
    );
    if (error || !data) {
      gateway.logError("create", error);
      return { status: "error" };
    }
    return { data, status: "success" };
  } catch (error) {
    gateway.logError("create", error);
    return { status: "error" };
  }
}
export async function getItem(
  input: unknown,
  gateway: ItemGateway,
): Promise<ItemOperationResult<ItemRecord>> {
  const ids = parseItemIds(input);
  if (!ids.success) return { fieldErrors: {}, status: "validation_error" };
  const auth = await authenticate(gateway);
  if ("result" in auth) return auth.result;
  try {
    const { data, error } = await gateway.getOwned(auth.user.id, ids.data);
    if (error && error.code !== "PGRST116") {
      gateway.logError("get", error);
      return { status: "error" };
    }
    return data ? { data, status: "success" } : { status: "not_found" };
  } catch (error) {
    gateway.logError("get", error);
    return { status: "error" };
  }
}
export async function listItems(
  collectionId: unknown,
  gateway: ItemGateway,
): Promise<ItemOperationResult<ItemRecord[]>> {
  const auth = await authenticate(gateway);
  if ("result" in auth) return auth.result;
  const schema = await schemaFor(collectionId, auth.user.id, gateway);
  if ("result" in schema) return schema.result;
  const { data, error } = await gateway.listOwned(
    auth.user.id,
    schema.schema.id,
  );
  if (error || !data) {
    gateway.logError("list", error);
    return { status: "error" };
  }
  return { data, status: "success" };
}
export async function updateItem(
  input: unknown,
  gateway: ItemGateway,
): Promise<ItemOperationResult<ItemIdentity>> {
  const auth = await authenticate(gateway);
  if ("result" in auth) return auth.result;
  const raw = input as { collectionId?: unknown } | null;
  const schema = await schemaFor(raw?.collectionId, auth.user.id, gateway);
  if ("result" in schema) return schema.result;
  const parsed = validateItemInput(input, schema.schema.fields);
  if (!parsed.success) return invalid(parsed);
  if (!parsed.data.itemId)
    return { fieldErrors: {}, status: "validation_error" };
  const ids = {
    collectionId: parsed.data.collectionId,
    itemId: parsed.data.itemId,
  };
  const existing = await gateway.getOwned(auth.user.id, ids);
  if (existing.error && existing.error.code !== "PGRST116") {
    gateway.logError("update-read", existing.error);
    return { status: "error" };
  }
  if (!existing.data) return { status: "not_found" };
  const { data, error } = await gateway.updateOwned(auth.user.id, {
    ...parsed.data,
    itemId: parsed.data.itemId,
  });
  if (error) {
    gateway.logError("update", error);
    return { status: "error" };
  }
  return data ? { data, status: "success" } : { status: "not_found" };
}
export async function deleteItem(
  input: unknown,
  gateway: ItemGateway,
): Promise<ItemOperationResult<ItemIdentity>> {
  const ids = parseItemIds(input);
  if (!ids.success) return { fieldErrors: {}, status: "validation_error" };
  const auth = await authenticate(gateway);
  if ("result" in auth) return auth.result;
  const existing = await gateway.getOwned(auth.user.id, ids.data);
  if (existing.error && existing.error.code !== "PGRST116") {
    gateway.logError("delete-read", existing.error);
    return { status: "error" };
  }
  if (!existing.data) return { status: "not_found" };
  const { data, error } = await gateway.deleteOwned(auth.user.id, ids.data);
  if (error) {
    gateway.logError("delete", error);
    return { status: "error" };
  }
  return data ? { data, status: "success" } : { status: "not_found" };
}
