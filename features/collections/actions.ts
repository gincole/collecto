"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { feedbackHref } from "@/components/shared/feedback-messages";

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
    redirect(
      feedbackHref(`/collections/${result.data.id}`, "collection-created"),
    );
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
  return deleteCollection(
    { collectionId, confirmationName: "" },
    createCollectionGateway(client),
  );
}

export type CollectionSettingsState = {
  fieldErrors?: {
    confirmationName?: string;
    description?: string;
    name?: string;
  };
  message?: string;
  requiredConfirmationName?: string;
  savedIdentity?: { description: string; name: string };
  status: "idle" | "error" | "success";
};

export async function updateCollectionFromSettingsAction(
  collectionId: string,
  _previousState: CollectionSettingsState,
  formData: FormData,
): Promise<CollectionSettingsState> {
  const name = formData.get("name");
  const description = formData.get("description");
  const result = await updateCollectionAction({
    collectionId,
    description: typeof description === "string" ? description : "",
    name: typeof name === "string" ? name : "",
  });
  if (result.status === "success") {
    revalidatePath(`/collections/${collectionId}`);
    revalidatePath("/library");
    return {
      message: "Changes saved.",
      savedIdentity: {
        description: typeof description === "string" ? description : "",
        name: typeof name === "string" ? name : "",
      },
      status: "success",
    };
  }
  if (result.status === "validation_error") {
    return {
      fieldErrors: {
        description: result.fieldErrors?.description?.[0],
        name: result.fieldErrors?.name?.[0],
      },
      status: "error",
    };
  }
  return {
    message:
      result.status === "unauthorized"
        ? "Your session has ended. Log in and try again."
        : "Could not save changes. Try again.",
    status: "error",
  };
}

export async function deleteCollectionFromSettingsAction(
  collectionId: string,
  _previousState: CollectionSettingsState,
  formData: FormData,
): Promise<CollectionSettingsState> {
  const client = await createClient();
  const confirmationName = formData.get("confirmationName");
  const result = await deleteCollection(
    {
      collectionId,
      confirmationName:
        typeof confirmationName === "string" ? confirmationName : "",
    },
    createCollectionGateway(client),
  );
  if (result.status === "success") {
    revalidatePath("/library");
    redirect(feedbackHref("/library", "collection-deleted"));
  }
  if (result.status === "validation_error") {
    return {
      fieldErrors: {
        confirmationName: result.fieldErrors?.confirmationName?.[0],
      },
      requiredConfirmationName: result.confirmationName,
      status: "error",
    };
  }
  return {
    message:
      result.status === "unauthorized"
        ? "Your session has ended. Log in and try again."
        : "Could not delete the collection. Try again.",
    status: "error",
  };
}
