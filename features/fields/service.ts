import type { z } from "zod";

import {
  fieldCreateSchema,
  fieldIdentitySchema,
  fieldReorderSchema,
  fieldUpdateSchema,
  optionCreateSchema,
  optionIdentitySchema,
  optionReorderSchema,
  optionUpdateSchema,
  type FieldCreateData,
  type FieldIdentityData,
  type FieldReorderData,
  type FieldUpdateData,
  type OptionCreateData,
  type OptionIdentityData,
  type OptionReorderData,
  type OptionUpdateData,
} from "./schemas";

type GatewayError = { code?: string; message?: string };
type Result<T> = Promise<{ data: T | null; error: GatewayError | null }>;
type Identity = { id: string };
type Impact = { affectedItemCount: number };
type Deletion = Identity & Impact;

export type FieldGateway = {
  createFieldOwned: (
    ownerId: string,
    input: FieldCreateData,
  ) => Result<Identity>;
  createOptionOwned: (
    ownerId: string,
    input: OptionCreateData,
  ) => Result<Identity>;
  deleteFieldOwned: (
    ownerId: string,
    input: FieldIdentityData,
  ) => Result<Deletion>;
  deleteOptionOwned: (
    ownerId: string,
    input: OptionIdentityData,
  ) => Result<Deletion>;
  getFieldImpactOwned: (
    ownerId: string,
    input: FieldIdentityData,
  ) => Result<Impact>;
  getOptionImpactOwned: (
    ownerId: string,
    input: OptionIdentityData,
  ) => Result<Impact>;
  getUser: () => Result<{ id: string }>;
  logError: (operation: string, error?: unknown) => void;
  reorderFieldsOwned: (
    ownerId: string,
    input: FieldReorderData,
  ) => Result<Identity>;
  reorderOptionsOwned: (
    ownerId: string,
    input: OptionReorderData,
  ) => Result<Identity>;
  updateFieldOwned: (
    ownerId: string,
    input: FieldUpdateData,
  ) => Result<Identity>;
  updateOptionOwned: (
    ownerId: string,
    input: OptionUpdateData,
  ) => Result<Identity>;
};

export type FieldOperationResult<T> =
  | { data: T; status: "success" }
  | {
      fieldErrors: Record<string, string[]>;
      formErrors: string[];
      status: "validation_error";
    }
  | { status: "unauthorized" | "not_found" | "conflict" | "error" };

const expectedConflictCodes = new Set(["22023", "23505", "23514"]);

async function execute<TInput, TOutput>(
  input: unknown,
  schema: z.ZodType<TInput>,
  operation: string,
  gateway: FieldGateway,
  call: (ownerId: string, data: TInput) => Result<TOutput>,
): Promise<FieldOperationResult<TOutput>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const flattened = parsed.error.flatten();
    return {
      fieldErrors: flattened.fieldErrors as Record<string, string[]>,
      formErrors: flattened.formErrors,
      status: "validation_error",
    };
  }
  try {
    const user = await gateway.getUser();
    if (user.error) {
      gateway.logError(`${operation}-authenticate`, user.error);
      return { status: "error" };
    }
    if (!user.data) return { status: "unauthorized" };
    const result = await call(user.data.id, parsed.data);
    if (result.error) {
      if (result.error.code && expectedConflictCodes.has(result.error.code)) {
        return { status: "conflict" };
      }
      gateway.logError(operation, result.error);
      return { status: "error" };
    }
    return result.data
      ? { data: result.data, status: "success" }
      : { status: "not_found" };
  } catch (error) {
    gateway.logError(operation, error);
    return { status: "error" };
  }
}

export const createField = (input: unknown, gateway: FieldGateway) =>
  execute(
    input,
    fieldCreateSchema,
    "create-field",
    gateway,
    gateway.createFieldOwned,
  );
export const updateField = (input: unknown, gateway: FieldGateway) =>
  execute(
    input,
    fieldUpdateSchema,
    "update-field",
    gateway,
    gateway.updateFieldOwned,
  );
export const reorderFields = (input: unknown, gateway: FieldGateway) =>
  execute(
    input,
    fieldReorderSchema,
    "reorder-fields",
    gateway,
    gateway.reorderFieldsOwned,
  );
export const getFieldDeleteImpact = (input: unknown, gateway: FieldGateway) =>
  execute(
    input,
    fieldIdentitySchema,
    "field-impact",
    gateway,
    gateway.getFieldImpactOwned,
  );
export const deleteField = (input: unknown, gateway: FieldGateway) =>
  execute(
    input,
    fieldIdentitySchema,
    "delete-field",
    gateway,
    gateway.deleteFieldOwned,
  );
export const createOption = (input: unknown, gateway: FieldGateway) =>
  execute(
    input,
    optionCreateSchema,
    "create-option",
    gateway,
    gateway.createOptionOwned,
  );
export const updateOption = (input: unknown, gateway: FieldGateway) =>
  execute(
    input,
    optionUpdateSchema,
    "update-option",
    gateway,
    gateway.updateOptionOwned,
  );
export const reorderOptions = (input: unknown, gateway: FieldGateway) =>
  execute(
    input,
    optionReorderSchema,
    "reorder-options",
    gateway,
    gateway.reorderOptionsOwned,
  );
export const getOptionDeleteImpact = (input: unknown, gateway: FieldGateway) =>
  execute(
    input,
    optionIdentitySchema,
    "option-impact",
    gateway,
    gateway.getOptionImpactOwned,
  );
export const deleteOption = (input: unknown, gateway: FieldGateway) =>
  execute(
    input,
    optionIdentitySchema,
    "delete-option",
    gateway,
    gateway.deleteOptionOwned,
  );
