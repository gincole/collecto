"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form-control";
import { ReorderButtons } from "@/features/fields/reorder-buttons";
import {
  fieldTypeLabels,
  move,
} from "@/features/fields/field-manager-contract";
import { fieldTypeSchema } from "@/features/fields/schemas";
import { DATABASE_LIMITS } from "@/lib/validation/limits";
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
  fields,
  onChange,
  disabled,
  errors,
  serverError,
}: {
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
      data-schema-editor
      tabIndex={-1}
      aria-describedby={serverError ? "draft-server-error" : undefined}
      aria-labelledby="draft-fields-title"
      className="focus-ring border-border bg-surface rounded-card sm:p-panel border p-4"
    >
      <h2
        className="text-section-title-mobile sm:text-section-title mb-2"
        id="draft-fields-title"
      >
        Custom fields
      </h2>
      <fieldset
        disabled={disabled}
        aria-labelledby="draft-fields-title"
        className="min-w-0 space-y-6"
      >
        <p className="text-foreground-muted">
          Start with these fields, then change anything before creating your
          Collection. Title and Description are always included.
        </p>
        <p className="text-foreground-muted text-sm">
          Field types can be changed here. After creation, types are locked;
          names, order, required status and Select options remain editable.
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
        <ol className="space-y-4">
          {fields.map((field, index) => (
            <li
              className="border-border rounded-control space-y-4 border p-4"
              key={field.key}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium">Field {index + 1}</h3>
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
                    aria-label={`Remove field ${field.name || index + 1}`}
                    onClick={() =>
                      onChange(fields.filter((_, current) => current !== index))
                    }
                  >
                    <X aria-hidden="true" />
                    Remove
                  </Button>
                </div>
              </div>
              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
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
                  <Select
                    aria-label={`Field ${index + 1} type`}
                    id={`draft-type-${field.key}`}
                    value={field.type}
                    onChange={(event) =>
                      update(index, {
                        type: fieldTypeSchema.parse(event.target.value),
                      })
                    }
                  >
                    {fieldTypeSchema.options.map((type) => (
                      <option key={type} value={type}>
                        {fieldTypeLabels[type]}
                      </option>
                    ))}
                  </Select>
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
                <div className="space-y-3">
                  <h4 className="text-label">Select options</h4>
                  <DraftError path={`${index}.options`} errors={errors} />
                  <ol className="space-y-3">
                    {field.options.map((option, optionIndex) => (
                      <li key={option.key} className="space-y-2">
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
                              options: field.options.map((entry, current) =>
                                current === optionIndex
                                  ? { ...entry, label: event.target.value }
                                  : entry,
                              ),
                            })
                          }
                        />
                        <DraftError
                          path={`${index}.options.${optionIndex}`}
                          errors={errors}
                        />
                        <div className="flex flex-wrap items-center justify-end gap-1">
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
                            Remove
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
            </li>
          ))}
        </ol>
        <Button
          disabled={fields.length >= DATABASE_LIMITS.collectionFields}
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
          variant="outline"
        >
          <Plus aria-hidden="true" />
          Add field
        </Button>
        <p className="text-foreground-muted text-sm">
          {fields.length} of {DATABASE_LIMITS.collectionFields} fields. Up to{" "}
          {DATABASE_LIMITS.selectOptions} options per Select field.
        </p>
      </fieldset>
    </section>
  );
}
