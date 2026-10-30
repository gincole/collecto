"use client";

import Link from "@/components/shared/navigation-link";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/form-control";
import { DATABASE_LIMITS } from "@/lib/validation/limits";

import type { ItemFieldDefinition, ItemRecord } from "./types";
import { ImageUploader } from "./image-uploader";
import { FeedbackMessage } from "@/components/shared/feedback-message";
import { useFeedback } from "@/components/shared/feedback";

export type ItemFormState = {
  fieldErrors?: Record<string, string>;
  message?: string;
  status: "idle" | "error";
};
type ItemFormAction = (
  previous: ItemFormState,
  formData: FormData,
) => Promise<ItemFormState>;

function DynamicField({
  error,
  field,
  initialValue,
}: {
  error?: string;
  field: ItemFieldDefinition;
  initialValue?: string | number;
}) {
  const id = `field-${field.id}`;
  const name = `values.${field.id}`;
  const describedBy = error ? `${id}-error` : undefined;
  const common = {
    "aria-describedby": describedBy,
    "aria-invalid": Boolean(error),
    "aria-label": field.name,
    defaultValue: initialValue ?? "",
    id,
    name,
    required: field.required,
  };
  let control;
  if (field.type === "select")
    control = (
      <Select {...common}>
        <option value="">Choose an option</option>
        {field.options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </Select>
    );
  else if (field.type === "rating")
    control = (
      <Input {...common} inputMode="numeric" max={5} min={1} type="number" />
    );
  else
    control = (
      <Input
        {...common}
        inputMode={field.type === "number" ? "decimal" : undefined}
        maxLength={field.type === "url" ? DATABASE_LIMITS.url : undefined}
        step={field.type === "number" ? "any" : undefined}
        type={
          field.type === "date"
            ? "date"
            : field.type === "url"
              ? "url"
              : field.type === "number"
                ? "number"
                : "text"
        }
      />
    );
  return (
    <div className="space-y-2">
      <label className="text-label block" htmlFor={id}>
        {field.name}
        {field.required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {control}
      {error ? (
        <p className="text-error text-sm" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ItemForm({
  action,
  collectionId,
  fields,
  item,
  mode,
}: {
  action: ItemFormAction;
  collectionId: string;
  fields: ItemFieldDefinition[];
  item?: ItemRecord;
  mode: "create" | "edit";
}) {
  const [serverState, formAction, pending] = useActionState(action, {
    status: "idle",
  });
  const [clientState, setClientState] = useState<ItemFormState>();
  const state = clientState ?? serverState;
  const notify = useFeedback();
  const [transitionPending, startTransition] = useTransition();
  const isPending = pending || transitionPending;
  const formRef = useRef<HTMLFormElement>(null);
  const submittedRef = useRef<FormData | undefined>(undefined);
  useEffect(() => {
    if (state.status !== "error" || isPending) return;
    notify(
      state.message ?? "Review the highlighted fields and try again.",
      "error",
    );
    for (const [name, value] of clientState
      ? []
      : (submittedRef.current?.entries() ?? [])) {
      const control = formRef.current?.elements.namedItem(name);
      if (
        (control instanceof HTMLInputElement ||
          control instanceof HTMLTextAreaElement ||
          control instanceof HTMLSelectElement) &&
        typeof value === "string"
      )
        control.value = value;
    }
    const first = state.fieldErrors
      ? Object.keys(state.fieldErrors)[0]
      : undefined;
    const target = first ? formRef.current?.elements.namedItem(first) : null;
    if (target instanceof HTMLElement) target.focus();
  }, [state, notify, clientState, isPending]);
  return (
    <form
      noValidate
      className="w-full min-w-0 space-y-6 pb-28 sm:pb-0"
      onSubmit={(event) => {
        event.preventDefault();
        if (isPending) return;
        // Native number/date controls serialize unfinished input as empty. Preserve it for custom errors.
        const badInputs = Array.from(event.currentTarget.elements).filter(
          (control): control is HTMLInputElement =>
            control instanceof HTMLInputElement && control.validity.badInput,
        );
        if (badInputs.length) {
          setClientState({
            status: "error",
            fieldErrors: Object.fromEntries(
              badInputs.map((control) => [
                control.name,
                "Enter a valid value.",
              ]),
            ),
          });
          return;
        }
        setClientState(undefined);
        const submitted = new FormData(event.currentTarget);
        submittedRef.current = submitted;
        startTransition(() => formAction(submitted));
      }}
      ref={formRef}
    >
      <input name="collectionId" type="hidden" value={collectionId} />
      {item ? <input name="itemId" type="hidden" value={item.id} /> : null}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
        <ImageUploader
          error={state.fieldErrors?.image}
          hasImage={Boolean(item?.imagePath)}
          itemId={item?.id}
        />
        <div className="min-w-0 space-y-6">
          <div className="space-y-2">
            <label className="text-label block" htmlFor="title">
              Title<span aria-hidden="true"> *</span>
            </label>
            <Input
              aria-describedby={
                state.fieldErrors?.title ? "title-error" : undefined
              }
              aria-invalid={Boolean(state.fieldErrors?.title)}
              aria-label="Title"
              defaultValue={item?.title}
              id="title"
              maxLength={DATABASE_LIMITS.itemTitle}
              name="title"
              required
            />
            {state.fieldErrors?.title ? (
              <p className="text-error text-sm" id="title-error">
                {state.fieldErrors.title}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="text-label block" htmlFor="description">
              Description (optional)
            </label>
            <Textarea
              aria-describedby={
                state.fieldErrors?.description ? "description-error" : undefined
              }
              aria-invalid={Boolean(state.fieldErrors?.description)}
              defaultValue={item?.description ?? ""}
              id="description"
              maxLength={DATABASE_LIMITS.itemDescription}
              name="description"
            />
            {state.fieldErrors?.description ? (
              <p className="text-error text-sm" id="description-error">
                {state.fieldErrors.description}
              </p>
            ) : null}
          </div>
          {fields.map((field) => (
            <DynamicField
              error={state.fieldErrors?.[`values.${field.id}`]}
              field={field}
              initialValue={item?.values[field.id]}
              key={field.id}
            />
          ))}
          {state.status === "error" ? (
            <FeedbackMessage kind="error">
              {state.message ?? "Review the highlighted fields and try again."}
            </FeedbackMessage>
          ) : null}
        </div>
      </div>
      <div className="bg-background/95 border-border fixed inset-x-0 bottom-0 flex flex-wrap justify-end gap-3 border-t px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0">
        <Button asChild variant="outline">
          <Link
            aria-disabled={isPending}
            onClick={(event) => {
              if (isPending) event.preventDefault();
            }}
            href={
              item
                ? `/collections/${collectionId}/items/${item.id}`
                : `/collections/${collectionId}`
            }
          >
            Cancel
          </Link>
        </Button>
        <Button aria-busy={isPending} disabled={isPending} type="submit">
          {isPending
            ? "Saving item…"
            : mode === "create"
              ? "Save item"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
