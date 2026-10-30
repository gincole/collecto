"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createItemGateway } from "./gateway";
import { createItemImageGateway } from "./image-gateway";
import {
  attachItemImage,
  removeItemImage,
  replaceItemImage,
} from "./image-service";
import { validateItemImage } from "./image-validation";
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

async function imageFrom(formData: FormData) {
  const entry = formData.get("image");
  if (!(entry instanceof File) || entry.size === 0) return null;
  return validateItemImage(entry);
}

function imageFailure(
  message = "Could not save the image. Try again.",
): ItemFormState {
  return { fieldErrors: { image: message }, status: "error" };
}
export async function createItemFromFormAction(
  _previous: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  let image;
  try {
    image = await imageFrom(formData);
  } catch (error) {
    return imageFailure(error instanceof Error ? error.message : undefined);
  }
  const client = await createClient();
  const result = await createItem(
    inputFrom(formData),
    createItemGateway(client),
  );
  if (result.status !== "success") return failure(result, formData);
  const collectionId = String(formData.get("collectionId"));
  if (image) {
    const { data } = await client.auth.getUser();
    const userId = data.user?.id;
    const imageResult = userId
      ? await attachItemImage(
          { collectionId, itemId: result.data.id, userId },
          image,
          createItemImageGateway(client),
        )
      : { status: "error" as const };
    if (imageResult.status === "error") {
      const rollback = await client
        .from("items")
        .delete()
        .eq("id", result.data.id)
        .select("id")
        .maybeSingle();
      return imageFailure(
        rollback.error || !rollback.data
          ? "The Item was created without its image. Open it from the Collection to try again."
          : undefined,
      );
    }
  }
  revalidatePath(`/collections/${collectionId}`);
  redirect(`/collections/${collectionId}`);
}
export async function updateItemFromFormAction(
  _previous: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  let image;
  try {
    image = await imageFrom(formData);
  } catch (error) {
    return imageFailure(error instanceof Error ? error.message : undefined);
  }
  const client = await createClient();
  const result = await updateItem(
    inputFrom(formData),
    createItemGateway(client),
  );
  if (result.status !== "success") return failure(result, formData);
  const collectionId = String(formData.get("collectionId"));
  const itemId = String(formData.get("itemId"));
  if (image || formData.get("removeImage") === "true") {
    const { data } = await client.auth.getUser();
    if (!data.user)
      return imageFailure("Your session has ended. Log in and try again.");
    const scope = { collectionId, itemId, userId: data.user.id };
    const gateway = createItemImageGateway(client);
    const imageResult = image
      ? await replaceItemImage(scope, image, gateway)
      : await removeItemImage(scope, gateway);
    if (imageResult.status === "error")
      return imageFailure(
        "Item details were saved, but the image change failed. Try the image again.",
      );
  }
  revalidatePath(`/collections/${collectionId}`);
  redirect(`/collections/${collectionId}`);
}
