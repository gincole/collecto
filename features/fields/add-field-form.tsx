"use client";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form-control";
import { ModalActions, useFlowBusy } from "@/components/shared/flow-modal";
import { DATABASE_LIMITS } from "@/lib/validation/limits";
import { RequiredControl } from "./required-control";
import { fieldTypeSchema } from "./schemas";
import {
  errorMessage,
  fieldTypeLabels,
  type FieldManagerActions,
  type FieldType,
} from "./field-manager-contract";
export function AddFieldForm({
  actions,
  collectionId,
  onCancel,
  onCreated,
  onPendingChange,
  cancelLabel = "Cancel",
}: {
  actions: FieldManagerActions;
  collectionId: string;
  onCancel: () => void;
  onCreated: () => void;
  onPendingChange?: (pending: boolean) => void;
  cancelLabel?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [required, setRequired] = useState(false);
  const [type, setType] = useState<FieldType>("text");
  const [options, setOptions] = useState<string[]>([]);
  const [createdFieldId, setCreatedFieldId] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [pending, startTransition] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);
  useFlowBusy(pending);
  useEffect(() => {
    nameRef.current?.focus();
  }, []);
  useEffect(() => {
    onPendingChange?.(pending);
  }, [pending, onPendingChange]);

  function handleTypeChange(nextType: FieldType) {
    setType(nextType);
    if (nextType === "select" && options.length === 0) setOptions([""]);
    if (nextType !== "select") setOptions([]);
  }

  function optionLabels() {
    return options.map((label) => label.trim()).filter(Boolean);
  }

  function labelsAreUnique(labels: string[]) {
    return (
      new Set(labels.map((label) => label.toLocaleLowerCase())).size ===
      labels.length
    );
  }

  async function saveOptions(fieldId: string, labels: string[]) {
    for (let index = 0; index < labels.length; index += 1) {
      const result = await actions.createOption({
        collectionId,
        fieldId,
        label: labels[index],
      });
      if (result.status !== "success") {
        setCreatedFieldId(fieldId);
        setOptions(labels.slice(index));
        setMessage(
          "The Field was created. Finish the remaining options without creating it again.",
        );
        router.refresh();
        return false;
      }
    }
    return true;
  }

  function handleCreate() {
    const labels = optionLabels();
    if (type === "select" && !labelsAreUnique(labels)) {
      setMessage("Option labels must be unique.");
      return;
    }
    setMessage(undefined);
    startTransition(async () => {
      let fieldId = createdFieldId;
      if (!fieldId) {
        const result = await actions.createField({
          collectionId,
          name,
          required,
          type,
        });
        fieldId = result.data?.id;
        if (result.status !== "success" || !fieldId) {
          setMessage(errorMessage(result, "Field"));
          nameRef.current?.focus();
          return;
        }
      }
      if (!(await saveOptions(fieldId, labels))) return;
      onCreated();
      router.refresh();
    });
  }

  return (
    <>
      <p className="text-foreground-muted mb-5">
        Choose a permanent type. The name, required state, order, and Select
        options can be changed later.
      </p>
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-label block" htmlFor="new-field-name">
            Field name
          </label>
          <Input
            disabled={Boolean(createdFieldId)}
            id="new-field-name"
            maxLength={DATABASE_LIMITS.fieldName}
            onChange={(event) => setName(event.target.value)}
            ref={nameRef}
            value={name}
          />
        </div>
        <div className="space-y-2">
          <label className="text-label block" htmlFor="new-field-type">
            Field type
          </label>
          <Select
            disabled={Boolean(createdFieldId)}
            id="new-field-type"
            onChange={(event) =>
              handleTypeChange(fieldTypeSchema.parse(event.target.value))
            }
            value={type}
          >
            {Object.entries(fieldTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <p className="text-foreground-muted text-sm">
            Field type cannot be changed after creation.
          </p>
        </div>
        <RequiredControl
          disabled={Boolean(createdFieldId)}
          required={required}
          setRequired={setRequired}
        />
        {type === "select" ? (
          <section
            aria-labelledby="initial-options-heading"
            className="space-y-3"
          >
            <div className="space-y-1">
              <h3 className="font-semibold" id="initial-options-heading">
                {createdFieldId ? "Remaining options" : "Initial options"}
              </h3>
              <p className="text-foreground-muted text-sm">
                Empty option rows are ignored. Labels must be unique.
              </p>
            </div>
            {options.map((label, index) => (
              <div className="flex items-center gap-2" key={index}>
                <Input
                  aria-label={`Option ${index + 1}`}
                  maxLength={DATABASE_LIMITS.selectOptionLabel}
                  onChange={(event) =>
                    setOptions((current) =>
                      current.map((entry, optionIndex) =>
                        optionIndex === index ? event.target.value : entry,
                      ),
                    )
                  }
                  value={label}
                />
                {options.length > 1 ? (
                  <Button
                    aria-label={`Remove option ${index + 1}`}
                    onClick={() =>
                      setOptions((current) =>
                        current.filter(
                          (_, optionIndex) => optionIndex !== index,
                        ),
                      )
                    }
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <X aria-hidden="true" />
                  </Button>
                ) : null}
              </div>
            ))}
            <Button
              disabled={options.length >= DATABASE_LIMITS.selectOptions}
              onClick={() => setOptions((current) => [...current, ""])}
              type="button"
              variant="outline"
            >
              <Plus aria-hidden="true" />
              Add option
            </Button>
          </section>
        ) : null}
        {message ? (
          <p className="text-error" role="alert">
            {message}
          </p>
        ) : null}
      </div>
      <ModalActions className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          disabled={pending}
          onClick={onCancel}
          type="button"
          variant="outline"
        >
          {cancelLabel === "Back" ? <ArrowLeft aria-hidden="true" /> : null}
          {cancelLabel === "Back"
            ? "Back"
            : createdFieldId
              ? "Close"
              : cancelLabel}
        </Button>
        <Button
          aria-busy={pending}
          disabled={pending || !name.trim()}
          onClick={handleCreate}
          type="button"
        >
          {pending
            ? "Saving…"
            : createdFieldId
              ? "Finish options"
              : "Create field"}
        </Button>
      </ModalActions>
    </>
  );
}
