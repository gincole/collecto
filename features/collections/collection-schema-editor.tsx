"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-control";
import { FieldTypeLabel, FieldTypeSelect } from "@/features/fields/field-type";
import { ReorderButtons } from "@/features/fields/reorder-buttons";
import { move } from "@/features/fields/field-manager-contract";
import { fieldTypeSchema } from "@/features/fields/schemas";
import { DATABASE_LIMITS } from "@/lib/validation/limits";
import { cn } from "@/lib/utils/cn";
import type { PresetField } from "./presets";
import type { CollectionFieldDraft } from "./schema-draft";

export type DraftField = Omit<CollectionFieldDraft, "options"> & {
  key: string;
  options: { key: string; label: string }[];
};

export function createSchemaDraft(fields: PresetField[]): DraftField[] {
  return fields.map((field) => ({
    ...field,
    key: crypto.randomUUID(),
    required: false,
    options: (field.options ?? []).map((label) => ({
      key: crypto.randomUUID(),
      label,
    })),
  }));
}

export function serializeSchemaDraft(
  fields: DraftField[],
): CollectionFieldDraft[] {
  return fields.map(({ name, type, required, options }) => ({
    name,
    type,
    required,
    options: type === "select" ? options.map((option) => option.label) : [],
  }));
}

function errorProps(path: string, errors: Record<string, string>) {
  return {
    "aria-invalid": Boolean(errors[path]),
    "aria-describedby": errors[path] ? `draft-error-${path}` : undefined,
  };
}

function DraftError({
  path,
  errors,
}: {
  path: string;
  errors: Record<string, string>;
}) {
  return errors[path] ? (
    <p className="text-error text-sm" id={`draft-error-${path}`}>
      {errors[path]}
    </p>
  ) : null;
}

export function CollectionSchemaEditor({
  modal = false,
  fields,
  onChange,
  disabled,
  errors,
  serverError,
}: {
  modal?: boolean;
  fields: DraftField[];
  onChange: (fields: DraftField[]) => void;
  disabled: boolean;
  errors: Record<string, string>;
  serverError?: string;
}) {
  function update(index: number, changes: Partial<DraftField>) {
    onChange(
      fields.map((field, current) =>
        current === index ? { ...field, ...changes } : field,
      ),
    );
  }
  return (
    <section
      data-form-panel
      data-schema-editor
      tabIndex={-1}
      aria-describedby={serverError ? "draft-server-error" : undefined}
      aria-labelledby="draft-fields-title"
      className={cn(
        "focus-ring",
        !modal && "border-border bg-surface rounded-card sm:p-panel border p-4",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2
          data-form-heading="section"
          className={cn(
            "min-w-0",
            modal
              ? "text-card-title"
              : "text-section-title-mobile sm:text-section-title",
          )}
          id="draft-fields-title"
        >
          Custom fields
        </h2>
        <Button
          disabled={
            disabled || fields.length >= DATABASE_LIMITS.collectionFields
          }
          onClick={() =>
            onChange([
              ...fields,
              {
                key: crypto.randomUUID(),
                name: "",
                type: "text",
                required: false,
                options: [],
              },
            ])
          }
          type="button"
        >
          <Plus aria-hidden="true" />
          Add field
        </Button>
      </div>
      <fieldset
        disabled={disabled}
        aria-labelledby="draft-fields-title"
        className="min-w-0 space-y-6"
      >
        <p className="text-foreground-muted text-sm">
          <span className="block">Title and Description included.</span>
          <span className="block">Field types lock after creation.</span>
        </p>
        {serverError ? (
          <p className="text-error" role="alert" id="draft-server-error">
            {serverError}
          </p>
        ) : null}
        <DraftError path="" errors={errors} />
        {!fields.length ? (
          <p className="text-foreground-muted">
            No custom fields. Add a field or create with Title and Description
            only.
          </p>
        ) : null}
        <ol className="space-y-7">
          {fields.map((field, index) => (
            <li
              data-draft-field
              className="border-border space-y-5 border-t pt-6 first:border-t-0 first:pt-0"
              key={field.key}
            >
              <div
                role="group"
                aria-labelledby={`draft-heading-${field.key}`}
                className="space-y-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3
                      id={`draft-heading-${field.key}`}
                      className="truncate font-semibold"
                    >
                      {field.name || "New field"}
                    </h3>
                    <div className="text-foreground-muted text-sm">
                      <FieldTypeLabel
                        type={field.type}
                        optionCount={
                          field.type === "select"
                            ? field.options.length
                            : undefined
                        }
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <ReorderButtons
                      disabled={disabled}
                      label={`Field ${field.name || index + 1}`}
                      onUp={
                        index > 0
                          ? () => onChange(move(fields, index, -1))
                          : undefined
                      }
                      onDown={
                        index < fields.length - 1
                          ? () => onChange(move(fields, index, 1))
                          : undefined
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove field ${field.name || index + 1}`}
                      onClick={() =>
                        onChange(
                          fields.filter((_, current) => current !== index),
                        )
                      }
                    >
                      <X aria-hidden="true" />
                    </Button>
                  </div>
                </div>
                <div className="grid min-w-0 gap-4">
                  <div className="space-y-2">
                    <label
                      className="text-label block"
                      htmlFor={`draft-name-${field.key}`}
                    >
                      Name
                    </label>
                    <Input
                      {...errorProps(`${index}.name`, errors)}
                      aria-label={`Field ${index + 1} name`}
                      required
                      id={`draft-name-${field.key}`}
                      value={field.name}
                      maxLength={DATABASE_LIMITS.fieldName}
                      onChange={(event) =>
                        update(index, { name: event.target.value })
                      }
                    />
                    <DraftError path={`${index}.name`} errors={errors} />
                  </div>
                  <div className="space-y-2">
                    <label
                      className="text-label block"
                      htmlFor={`draft-type-${field.key}`}
                    >
                      Type
                    </label>
                    <FieldTypeSelect
                      aria-label={`Field ${index + 1} type`}
                      id={`draft-type-${field.key}`}
                      value={field.type}
                      onChange={(event) =>
                        update(index, {
                          type: fieldTypeSchema.parse(event.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <label
                  className="touch-target flex items-center gap-3 text-sm"
                  htmlFor={`draft-required-${field.key}`}
                >
                  <input
                    className="accent-selection-border size-5"
                    type="checkbox"
                    id={`draft-required-${field.key}`}
                    aria-label={`Required field ${index + 1}`}
                    checked={field.required}
                    onChange={(event) =>
                      update(index, { required: event.target.checked })
                    }
                  />
                  Required field
                </label>
                {field.type === "select" ? (
                  <div
                    role="group"
                    aria-labelledby={`draft-options-${field.key}`}
                    className="border-border space-y-3 border-t pt-4"
                  >
                    <h4
                      id={`draft-options-${field.key}`}
                      className="text-label"
                    >
                      Select options
                    </h4>
                    <DraftError path={`${index}.options`} errors={errors} />
                    <ol className="space-y-3">
                      {field.options.map((option, optionIndex) => (
                        <li
                          key={option.key}
                          className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
                        >
                          <div className="min-w-0 space-y-2">
                            <label
                              className="text-label block"
                              htmlFor={`draft-option-${option.key}`}
                            >
                              Option {optionIndex + 1}
                            </label>
                            <Input
                              {...errorProps(
                                `${index}.options.${optionIndex}`,
                                errors,
                              )}
                              id={`draft-option-${option.key}`}
                              aria-label={`Option ${optionIndex + 1} for field ${index + 1}`}
                              required
                              value={option.label}
                              maxLength={DATABASE_LIMITS.selectOptionLabel}
                              onChange={(event) =>
                                update(index, {
                                  options: field.options.map(
                                    (entry, current) =>
                                      current === optionIndex
                                        ? {
                                            ...entry,
                                            label: event.target.value,
                                          }
                                        : entry,
                                  ),
                                })
                              }
                            />
                            <DraftError
                              path={`${index}.options.${optionIndex}`}
                              errors={errors}
                            />
                          </div>
                          <div className="flex shrink-0 items-center justify-end gap-1">
                            <ReorderButtons
                              disabled={disabled}
                              label={`Option ${option.label || optionIndex + 1}`}
                              onUp={
                                optionIndex > 0
                                  ? () =>
                                      update(index, {
                                        options: move(
                                          field.options,
                                          optionIndex,
                                          -1,
                                        ),
                                      })
                                  : undefined
                              }
                              onDown={
                                optionIndex < field.options.length - 1
                                  ? () =>
                                      update(index, {
                                        options: move(
                                          field.options,
                                          optionIndex,
                                          1,
                                        ),
                                      })
                                  : undefined
                              }
                            />
                            <Button
                              aria-label={`Remove option ${option.label || optionIndex + 1}`}
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                update(index, {
                                  options: field.options.filter(
                                    (_, current) => current !== optionIndex,
                                  ),
                                })
                              }
                            >
                              <X aria-hidden="true" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ol>
                    <Button
                      aria-label={`Add option to field ${index + 1}`}
                      disabled={
                        field.options.length >= DATABASE_LIMITS.selectOptions
                      }
                      type="button"
                      variant="outline"
                      onClick={() =>
                        update(index, {
                          options: [
                            ...field.options,
                            { key: crypto.randomUUID(), label: "" },
                          ],
                        })
                      }
                    >
                      <Plus aria-hidden="true" />
                      Add option
                    </Button>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ol>

        <p className="text-foreground-muted text-sm">
          {fields.length} of {DATABASE_LIMITS.collectionFields} fields. Up to{" "}
          {DATABASE_LIMITS.selectOptions} options per Select field.
        </p>
      </fieldset>
    </section>
  );
}
