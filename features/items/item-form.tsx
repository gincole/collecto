"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/form-control";
import { DATABASE_LIMITS } from "@/lib/validation/limits";

import type { ItemFieldDefinition, ItemRecord } from "./types";

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
      <select
        {...common}
        className="border-control-border bg-surface focus:border-focus focus:ring-focus/20 rounded-control min-h-11 w-full border px-3 text-base outline-none focus:ring-4"
      >
        <option value="">Choose an option</option>
        {field.options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
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
      <label className="font-semibold" htmlFor={id}>
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
  const [state, formAction, pending] = useActionState(action, {
    status: "idle",
  });
  const formRef = useRef<HTMLFormElement>(null);
  const submittedRef = useRef<FormData | undefined>(undefined);
  useEffect(() => {
    if (state.status !== "error") return;
    for (const [name, value] of submittedRef.current?.entries() ?? []) {
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
  }, [state]);
  return (
    <form
      action={formAction}
      className="mx-auto w-full max-w-3xl space-y-6 pb-24"
      onSubmit={(event) => {
        submittedRef.current = new FormData(event.currentTarget);
      }}
      ref={formRef}
    >
      <input name="collectionId" type="hidden" value={collectionId} />
      {item ? <input name="itemId" type="hidden" value={item.id} /> : null}
      <div className="space-y-2">
        <label className="font-semibold" htmlFor="title">
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
        <label className="font-semibold" htmlFor="description">
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
      {state.message ? (
        <p className="text-error" role="alert">
          {state.message}
        </p>
      ) : null}
      <div className="bg-background/95 border-border fixed inset-x-0 bottom-0 border-t px-4 py-3 backdrop-blur sm:static sm:flex sm:justify-end sm:gap-3 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
        <Button asChild className="mr-3" variant="outline">
          <Link href={`/collections/${collectionId}`}>Cancel</Link>
        </Button>
        <Button disabled={pending} type="submit">
          {pending
            ? "Saving item…"
            : mode === "create"
              ? "Save item"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
