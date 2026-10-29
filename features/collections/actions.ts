"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { createCollectionGateway } from "./gateway";
import type { CollectionCreateInput, CollectionUpdateInput } from "./schemas";
import {
  createCollection,
  deleteCollection,
  updateCollection,
} from "./service";
import type { CollectionWizardState } from "./wizard-state";

export async function createCollectionAction(input: CollectionCreateInput) {
  const client = await createClient();
  return createCollection(input, createCollectionGateway(client));
}

export async function createCollectionFromWizardAction(
  _previousState: CollectionWizardState,
  formData: FormData,
): Promise<CollectionWizardState> {
  const client = await createClient();
  const result = await createCollection(
    {
      description: formData.get("description"),
      name: formData.get("name"),
      presetKey: formData.get("presetKey"),
      requestId: formData.get("requestId"),
    },
    createCollectionGateway(client),
  );

  if (result.status === "success") {
    revalidatePath("/library");
    redirect(`/collections/${result.data.id}`);
  }

  if (result.status === "validation_error") {
    return {
      fieldErrors: {
        description: result.fieldErrors?.description?.[0],
        name: result.fieldErrors?.name?.[0],
        presetKey: result.fieldErrors?.presetKey?.[0],
      },
      message:
        result.fieldErrors?.presetKey || result.fieldErrors?.requestId
          ? "Choose a preset and try again."
          : undefined,
      status: "error",
    };
  }

  return {
    message:
      result.status === "unauthorized"
        ? "Your session has ended. Log in and try again."
        : "Could not create the collection. Try again.",
    status: "error",
  };
}

export async function updateCollectionAction(input: CollectionUpdateInput) {
  const client = await createClient();
  return updateCollection(input, createCollectionGateway(client));
}

export async function deleteCollectionAction(collectionId: string) {
  const client = await createClient();
  return deleteCollection(collectionId, createCollectionGateway(client));
}
