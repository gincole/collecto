"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createItemGateway } from "./gateway";
import type { ItemFormState } from "./item-form";
import { createItem, updateItem } from "./service";

function valuesFrom(formData: FormData) {
  const values: Record<string, FormDataEntryValue> = {};
  for (const [key, value] of formData.entries())
    if (key.startsWith("values.")) values[key.slice(7)] = value;
  return values;
}
function inputFrom(formData: FormData) {
  return {
    collectionId: formData.get("collectionId"),
    description: formData.get("description"),
    itemId: formData.get("itemId") || undefined,
    title: formData.get("title"),
    values: valuesFrom(formData),
  };
}
function failure(
  result: Awaited<ReturnType<typeof createItem>>,
  formData: FormData,
): ItemFormState {
  if (result.status === "validation_error")
    return {
      fieldErrors: result.fieldErrors,
      message:
        result.formError ??
        (Object.keys(result.fieldErrors).some(
          (key) => key.startsWith("values.") && !formData.has(key),
        )
          ? "Collection fields changed. Refresh this page and try again."
          : undefined),
      status: "error",
    };
  return {
    message:
      result.status === "unauthorized"
        ? "Your session has ended. Log in and try again."
        : result.status === "not_found"
          ? "This Collection or Item is no longer available."
          : "Could not save the Item. Try again.",
    status: "error",
  };
}
export async function createItemFromFormAction(
  _previous: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  const client = await createClient();
  const result = await createItem(
    inputFrom(formData),
    createItemGateway(client),
  );
  if (result.status !== "success") return failure(result, formData);
  const collectionId = String(formData.get("collectionId"));
  revalidatePath(`/collections/${collectionId}`);
  redirect(`/collections/${collectionId}`);
}
export async function updateItemFromFormAction(
  _previous: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  const client = await createClient();
  const result = await updateItem(
    inputFrom(formData),
    createItemGateway(client),
  );
  if (result.status !== "success") return failure(result, formData);
  const collectionId = String(formData.get("collectionId"));
  revalidatePath(`/collections/${collectionId}`);
  redirect(`/collections/${collectionId}`);
}
