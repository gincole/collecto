"use client";

import { ArrowLeft, Check, ListChecks } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";

import { ConfirmDialog, PresetArtwork } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/shared/feedback-message";
import { useFeedback } from "@/components/shared/feedback";
import { Input, Textarea } from "@/components/ui/form-control";
import { cn } from "@/lib/utils/cn";

import { getCollectionPreset, listCollectionPresets } from "./presets";
import type { CollectionPresetKey } from "./schemas";
import type {
  CollectionWizardAction,
  CollectionWizardState,
} from "./wizard-state";

const initialState: CollectionWizardState = { status: "idle" };

type CollectionWizardProps = { createAction: CollectionWizardAction };

export function CollectionWizard({ createAction }: CollectionWizardProps) {
  const notify = useFeedback();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createAction,
    initialState,
  );
  const [step, setStep] = useState<1 | 2>(1);
  const [presetKey, setPresetKey] = useState<CollectionPresetKey | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const presets = listCollectionPresets();
  const preset = presetKey ? getCollectionPreset(presetKey) : null;
  const dirty =
    presetKey !== null || name.trim() !== "" || description.trim() !== "";

  useEffect(() => {
    if (state.fieldErrors?.name) nameInputRef.current?.focus();
    if (state.status === "error")
      notify(
        state.message ?? "Review the highlighted fields and try again.",
        "error",
      );
  }, [state, notify]);

  function selectPreset(key: CollectionPresetKey) {
    setPresetKey(key);
    setRequestId((current) => current ?? crypto.randomUUID());
  }

  function cancel() {
    if (dirty) setCancelOpen(true);
    else router.push("/library");
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <p className="text-foreground-muted text-sm font-semibold tracking-[0.14em] uppercase">
            Step {step} of 2
          </p>
          <div className="flex items-center gap-1">
            {step === 1 ? (
              <button
                className="touch-target focus-ring rounded-control text-foreground-muted hover:bg-surface-muted px-3 text-sm font-semibold"
                onClick={cancel}
                type="button"
              >
                Back
              </button>
            ) : null}
            <button
              disabled={pending}
              className="touch-target focus-ring rounded-control text-foreground-muted hover:bg-surface-muted px-3 text-sm font-semibold"
              onClick={cancel}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>

        {step === 1 ? (
          <section aria-labelledby="preset-title" className="space-y-6">
            <div className="space-y-2">
              <h1
                className="text-page-title-mobile sm:text-page-title"
                id="preset-title"
              >
                What are you collecting?
              </h1>
              <p className="text-foreground-muted">
                Choose a starting point. You can change its fields later.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {presets.map((option) => {
                const selected = option.key === presetKey;
                return (
                  <button
                    aria-label={`${option.label} preset`}
                    aria-pressed={selected}
                    className={cn(
                      "focus-ring rounded-card bg-surface relative flex min-h-36 flex-col items-start justify-between gap-4 border-2 p-3 text-left transition-[border-color,transform,box-shadow] motion-safe:hover:-translate-y-0.5 sm:min-h-40 sm:p-4",
                      selected
                        ? "border-selection-border shadow-card"
                        : "border-border hover:border-control-border",
                    )}
                    key={option.key}
                    onClick={() => selectPreset(option.key)}
                    type="button"
                  >
                    <PresetArtwork
                      presetKey={option.key}
                      size="md"
                      variant="icon"
                    />
                    <span className="font-semibold">{option.label}</span>
                    {selected ? (
                      <span className="bg-foreground text-surface rounded-pill absolute top-2 right-2 flex size-7 items-center justify-center">
                        <Check aria-hidden="true" className="size-4" />
                        <span className="sr-only">Selected</span>
                      </span>
                    ) : null}
                    <span className="sr-only">{option.label} preset</span>
                  </button>
                );
              })}
            </div>

            <div className="border-border bg-background sticky bottom-0 flex gap-3 border-t py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button
                className="ml-auto w-full sm:w-auto"
                disabled={!presetKey}
                onClick={() => setStep(2)}
                size="lg"
                type="button"
              >
                Continue
              </Button>
            </div>
          </section>
        ) : preset ? (
          <form action={formAction} className="space-y-7" noValidate>
            <input name="presetKey" type="hidden" value={preset.key} />
            <input name="requestId" type="hidden" value={requestId ?? ""} />

            <section aria-labelledby="details-title" className="space-y-6">
              <div className="space-y-2">
                <h1
                  className="text-page-title-mobile sm:text-page-title"
                  id="details-title"
                >
                  Set up your collection
                </h1>
                <p className="text-foreground-muted">
                  Name this Collection and review its starting Fields. Customize
                  Fields in Collection settings after creating it.
                </p>
              </div>

              <div className="bg-art-lavender rounded-card flex items-center justify-between gap-3 px-4 py-3">
                <span className="font-semibold">{preset.label}</span>
                <button
                  disabled={pending}
                  className="touch-target focus-ring rounded-control px-3 text-sm font-semibold underline underline-offset-4"
                  onClick={() => setStep(1)}
                  type="button"
                >
                  Change preset
                </button>
              </div>

              <div
                className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-start"
                data-testid="collection-details-layout"
              >
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label
                      className="text-label block"
                      htmlFor="collection-name"
                    >
                      Collection name
                    </label>
                    <Input
                      aria-describedby={
                        state.fieldErrors?.name
                          ? "collection-name-error"
                          : undefined
                      }
                      aria-invalid={Boolean(state.fieldErrors?.name)}
                      autoComplete="off"
                      id="collection-name"
                      maxLength={100}
                      name="name"
                      onChange={(event) => setName(event.target.value)}
                      ref={nameInputRef}
                      required
                      value={name}
                    />
                    {state.fieldErrors?.name ? (
                      <p
                        className="text-error text-sm"
                        id="collection-name-error"
                        role="alert"
                      >
                        {state.fieldErrors.name}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-label block"
                      htmlFor="collection-description"
                    >
                      Description (optional)
                    </label>
                    <Textarea
                      aria-describedby={
                        state.fieldErrors?.description
                          ? "collection-description-error"
                          : undefined
                      }
                      aria-invalid={Boolean(state.fieldErrors?.description)}
                      autoComplete="off"
                      id="collection-description"
                      maxLength={1000}
                      name="description"
                      onChange={(event) => setDescription(event.target.value)}
                      value={description}
                    />
                    {state.fieldErrors?.description ? (
                      <p
                        className="text-error text-sm"
                        id="collection-description-error"
                        role="alert"
                      >
                        {state.fieldErrors.description}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="border-border bg-surface rounded-card border p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <ListChecks aria-hidden="true" className="size-5" />
                    <h2 className="text-card-title">Default fields</h2>
                  </div>
                  {preset.fields.length ? (
                    <ul className="space-y-2">
                      {preset.fields.map((field) => (
                        <li
                          className="bg-surface-muted rounded-control space-y-2 px-3 py-2"
                          key={`${field.name}-${field.type}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium">{field.name}</span>
                            <span className="text-foreground-muted text-sm capitalize">
                              {field.type}
                            </span>
                          </div>
                          {field.options?.length ? (
                            <p className="text-foreground-muted text-xs leading-5">
                              {field.options.join(" · ")}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-foreground-muted text-sm">
                      Blank starts with Title and Description only. Add custom
                      fields later.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {state.status === "error" && state.message ? (
              <FeedbackMessage kind="error">{state.message}</FeedbackMessage>
            ) : null}

            <div className="border-border bg-background sticky bottom-0 flex flex-col-reverse gap-3 border-t py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-between">
              <Button
                disabled={pending}
                onClick={() => setStep(1)}
                type="button"
                variant="ghost"
              >
                <ArrowLeft aria-hidden="true" />
                Back
              </Button>
              <Button disabled={pending || !requestId} size="lg" type="submit">
                {pending ? "Creating collection…" : "Create collection"}
              </Button>
            </div>
          </form>
        ) : null}
      </div>

      <ConfirmDialog
        confirmLabel="Discard collection"
        description="Your preset choice and collection details will be lost."
        onConfirm={() => router.push("/library")}
        onOpenChange={setCancelOpen}
        open={cancelOpen}
        title="Discard this collection?"
      />
    </>
  );
}
