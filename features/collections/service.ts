import { z } from "zod";

import type { CollectionRecord } from "./models";
import {
  buildCollectionCreatePayload,
  type CollectionCreatePayload,
} from "./presets";
import {
  collectionCreateSchema,
  collectionDeleteSchema,
  collectionIdSchema,
  collectionUpdateSchema,
  type CollectionUpdateInput,
  type CollectionDeleteInput,
} from "./schemas";

export type GatewayError = { code?: string; message?: string };
type GatewayResult<T> = Promise<{ data: T | null; error: GatewayError | null }>;
type CollectionIdentity = { id: string };
type CollectionDeletion = CollectionIdentity & { scheduledImageCount: number };

export type CollectionGateway = {
  createAtomic: (
    payload: CollectionCreatePayload,
  ) => GatewayResult<CollectionIdentity>;
  deleteOwned: (
    ownerId: string,
    input: z.output<typeof collectionDeleteSchema>,
  ) => GatewayResult<CollectionDeletion>;
  getOwned: (
    ownerId: string,
    collectionId: string,
  ) => GatewayResult<CollectionRecord>;
  getUser: () => GatewayResult<{ id: string }>;
  listOwned: (ownerId: string) => GatewayResult<CollectionRecord[]>;
  logError: (operation: string, error?: unknown) => void;
  updateOwned: (
    ownerId: string,
    input: z.output<typeof collectionUpdateSchema>,
  ) => GatewayResult<CollectionIdentity>;
};

export type CollectionOperationResult<T = never> =
  | { data: T; status: "success" }
  | {
      confirmationName?: string;
      fieldErrors?: Record<string, string[]>;
      status: "validation_error";
    }
  | { status: "unauthorized" | "not_found" | "error" };

function validationResult(error: z.ZodError): CollectionOperationResult {
  return {
    fieldErrors: error.flatten().fieldErrors,
    status: "validation_error",
  };
}

async function authenticated(
  gateway: CollectionGateway,
): Promise<
  { result: { status: "error" | "unauthorized" } } | { user: { id: string } }
> {
  try {
    const { data, error } = await gateway.getUser();
    if (error) {
      gateway.logError("authenticate", error);
      return { result: { status: "error" } };
    }
    return data ? { user: data } : { result: { status: "unauthorized" } };
  } catch (error) {
    gateway.logError("authenticate", error);
    return { result: { status: "error" } };
  }
}

export async function listCollections(
  gateway: CollectionGateway,
): Promise<CollectionOperationResult<CollectionRecord[]>> {
  const auth = await authenticated(gateway);
  if ("result" in auth) return auth.result;
  try {
    const { data, error } = await gateway.listOwned(auth.user.id);
    if (error || !data) {
      gateway.logError("list", error);
      return { status: "error" };
    }
    return { data, status: "success" };
  } catch (error) {
    gateway.logError("list", error);
    return { status: "error" };
  }
}

export async function getCollection(
  collectionId: unknown,
  gateway: CollectionGateway,
): Promise<CollectionOperationResult<CollectionRecord>> {
  const parsed = collectionIdSchema.safeParse(collectionId);
  if (!parsed.success) return validationResult(parsed.error);
  const auth = await authenticated(gateway);
  if ("result" in auth) return auth.result;
  try {
    const { data, error } = await gateway.getOwned(auth.user.id, parsed.data);
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

export async function createCollection(
  input: unknown,
  gateway: CollectionGateway,
  createId?: () => string,
): Promise<CollectionOperationResult<CollectionIdentity>> {
  const parsed = collectionCreateSchema.safeParse(input);
  if (!parsed.success) return validationResult(parsed.error);
  const auth = await authenticated(gateway);
  if ("result" in auth) return auth.result;
  const payload = buildCollectionCreatePayload(parsed.data, createId);
  try {
    const { data, error } = await gateway.createAtomic(payload);
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

export async function updateCollection(
  input: CollectionUpdateInput,
  gateway: CollectionGateway,
): Promise<CollectionOperationResult<CollectionIdentity>> {
  const parsed = collectionUpdateSchema.safeParse(input);
  if (!parsed.success) return validationResult(parsed.error);
  const auth = await authenticated(gateway);
  if ("result" in auth) return auth.result;
  try {
    const { data, error } = await gateway.updateOwned(
      auth.user.id,
      parsed.data,
    );
    if (error) {
      gateway.logError("update", error);
      return { status: "error" };
    }
    return data ? { data, status: "success" } : { status: "not_found" };
  } catch (error) {
    gateway.logError("update", error);
    return { status: "error" };
  }
}

export async function deleteCollection(
  input: CollectionDeleteInput,
  gateway: CollectionGateway,
): Promise<CollectionOperationResult<CollectionDeletion>> {
  const parsed = collectionDeleteSchema.safeParse(input);
  if (!parsed.success) return validationResult(parsed.error);
  const auth = await authenticated(gateway);
  if ("result" in auth) return auth.result;
  try {
    const owned = await gateway.getOwned(
      auth.user.id,
      parsed.data.collectionId,
    );
    if (owned.error && owned.error.code !== "PGRST116") {
      gateway.logError("delete-read", owned.error);
      return { status: "error" };
    }
    if (!owned.data) return { status: "not_found" };
    if (
      owned.data.itemCount > 0 &&
      parsed.data.confirmationName !== owned.data.name
    ) {
      return {
        confirmationName: owned.data.name,
        fieldErrors: {
          confirmationName: [`Type ${owned.data.name} to confirm.`],
        },
        status: "validation_error",
      };
    }
    const { data, error } = await gateway.deleteOwned(
      auth.user.id,
      parsed.data,
    );
    if (error) {
      gateway.logError("delete", error);
      return { status: "error" };
    }
    return data ? { data, status: "success" } : { status: "not_found" };
  } catch (error) {
    gateway.logError("delete", error);
    return { status: "error" };
  }
}
