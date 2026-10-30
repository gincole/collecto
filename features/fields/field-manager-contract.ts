import type { CollectionRecord } from "@/features/collections/models";

import type {
  FieldCreateData,
  FieldIdentityData,
  FieldReorderData,
  FieldUpdateData,
  OptionCreateData,
  OptionIdentityData,
  OptionReorderData,
  OptionUpdateData,
} from "./schemas";

export type ActionResult = {
  data?: { affectedItemCount?: number; id?: string };
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
  status:
    | "success"
    | "validation_error"
    | "unauthorized"
    | "not_found"
    | "conflict"
    | "error";
};

export type FieldManagerActions = {
  createField: (input: FieldCreateData) => Promise<ActionResult>;
  createOption: (input: OptionCreateData) => Promise<ActionResult>;
  deleteField: (input: FieldIdentityData) => Promise<ActionResult>;
  deleteOption: (input: OptionIdentityData) => Promise<ActionResult>;
  getFieldImpact: (input: FieldIdentityData) => Promise<ActionResult>;
  getOptionImpact: (input: OptionIdentityData) => Promise<ActionResult>;
  reorderFields: (input: FieldReorderData) => Promise<ActionResult>;
  reorderOptions: (input: OptionReorderData) => Promise<ActionResult>;
  updateField: (input: FieldUpdateData) => Promise<ActionResult>;
  updateOption: (input: OptionUpdateData) => Promise<ActionResult>;
};

export type Field = CollectionRecord["fields"][number];
export type FieldType = Field["type"];

export const fieldTypeLabels: Record<FieldType, string> = {
  date: "Date",
  number: "Number",
  rating: "Rating",
  select: "Select",
  text: "Text",
  url: "URL",
};

export const editorClassName =
  "max-h-[calc(100dvh-2rem)] overflow-hidden sm:max-w-2xl max-sm:top-0 max-sm:left-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-screen max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-0 max-sm:p-0";

export function errorMessage(
  result: ActionResult,
  subject: string,
  action = "save",
) {
  const validationMessage = [
    ...Object.values(result.fieldErrors ?? {}).flat(),
    ...(result.formErrors ?? []),
  ][0];
  if (validationMessage) return validationMessage;
  if (result.status === "conflict")
    return `${subject} changed or conflicts with an existing name. Refresh and try again.`;
  if (result.status === "unauthorized")
    return "Your session has ended. Log in and try again.";
  if (result.status === "not_found")
    return `${subject} no longer exists. Refresh and try again.`;
  return `Could not ${action} ${subject.toLowerCase()}. Try again.`;
}

export function move<T>(values: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= values.length) return values;
  const reordered = [...values];
  [reordered[index], reordered[nextIndex]] = [
    reordered[nextIndex],
    reordered[index],
  ];
  return reordered;
}
