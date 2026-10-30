"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

import { createFieldGateway } from "./gateway";
import {
  createField,
  createOption,
  deleteField,
  deleteOption,
  getFieldDeleteImpact,
  getOptionDeleteImpact,
  reorderFields,
  reorderOptions,
  updateField,
  updateOption,
} from "./service";

async function run<TResult extends { status: string }>(
  input: unknown,
  operation: (
    gateway: ReturnType<typeof createFieldGateway>,
  ) => Promise<TResult>,
): Promise<TResult> {
  const client = await createClient();
  const result = await operation(createFieldGateway(client));
  const collectionId = collectionIdFrom(input);
  if (result.status === "success" && collectionId) {
    revalidatePath(`/collections/${collectionId}`);
    revalidatePath(`/collections/${collectionId}/settings`);
  }
  return result;
}

function collectionIdFrom(input: unknown) {
  const parsed = z
    .object({ collectionId: z.uuid() })
    .passthrough()
    .safeParse(input);
  return parsed.success ? parsed.data.collectionId : null;
}

export const createFieldAction = async (input: unknown) =>
  run(input, (gateway) => createField(input, gateway));
export const updateFieldAction = async (input: unknown) =>
  run(input, (gateway) => updateField(input, gateway));
export const reorderFieldsAction = async (input: unknown) =>
  run(input, (gateway) => reorderFields(input, gateway));
export const getFieldDeleteImpactAction = async (input: unknown) => {
  const client = await createClient();
  return getFieldDeleteImpact(input, createFieldGateway(client));
};
export const deleteFieldAction = async (input: unknown) =>
  run(input, (gateway) => deleteField(input, gateway));
export const createOptionAction = async (input: unknown) =>
  run(input, (gateway) => createOption(input, gateway));
export const updateOptionAction = async (input: unknown) =>
  run(input, (gateway) => updateOption(input, gateway));
export const reorderOptionsAction = async (input: unknown) =>
  run(input, (gateway) => reorderOptions(input, gateway));
export const getOptionDeleteImpactAction = async (input: unknown) => {
  const client = await createClient();
  return getOptionDeleteImpact(input, createFieldGateway(client));
};
export const deleteOptionAction = async (input: unknown) =>
  run(input, (gateway) => deleteOption(input, gateway));
