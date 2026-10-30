"use client";
import { FormSectionHeader } from "@/components/shared/form-section-header";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
  useId,
} from "react";

import { ConfirmDialog, PresetArtwork } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/shared/feedback-message";
import { useFeedback } from "@/components/shared/feedback";
import { Input, Textarea } from "@/components/ui/form-control";
import { ModalActions, useFlowExit } from "@/components/shared/flow-modal";
import { cn } from "@/lib/utils/cn";

import {
  CollectionSchemaEditor,
  createSchemaDraft,
  serializeSchemaDraft,
  type DraftField,
} from "./collection-schema-editor";
import { collectionFieldsDraftSchema } from "./schema-draft";

import { getCollectionPreset, listCollectionPresets } from "./presets";
import type { CollectionPresetKey } from "./schemas";
import type {
  CollectionWizardAction,
  CollectionWizardState,
} from "./wizard-state";

const initialState: CollectionWizardState = { status: "idle" };

type CollectionWizardProps = {
  createAction: CollectionWizardAction;
  modal?: boolean;
};

export function CollectionWizard({
  createAction,
  modal = false,
}: CollectionWizardProps) {
  const formId = useId();
  const notify = useFeedback();
  const router = useRouter();
  const [state, formAction, saving] = useActionState(
    createAction,
    initialState,
  );
  const [leaving, startLeaving] = useTransition();
  const pending = saving || leaving;
  const [step, setStep] = useState<1 | 2>(1);
  const [presetKey, setPresetKey] = useState<CollectionPresetKey | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [drafts, setDrafts] = useState<
    Partial<Record<CollectionPresetKey, DraftField[]>>
  >({});
  const [draftErrors, setDraftErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const draft = presetKey ? (drafts[presetKey] ?? []) : [];
  const nameInputRef = useRef<HTMLInputElement>(null);
  const presets = listCollectionPresets();
  const preset = presetKey ? getCollectionPreset(presetKey) : null;
  const dirty =
    presetKey !== null || name.trim() !== "" || description.trim() !== "";

  const dismissFlow = useFlowExit(() => {
    cancel();
  }, pending);

  useEffect(() => {
    if (state.status === "success") {
      notify("Collection created.");
      dismissFlow?.();
      router.refresh();
    }
    if (state.fieldErrors?.name) nameInputRef.current?.focus();
    else if (state.fieldErrors?.fields)
      formRef.current
        ?.querySelector<HTMLElement>("[data-schema-editor]")
        ?.focus();
    if (state.status === "error")
      notify(
        state.message ?? "Review the highlighted fields and try again.",
        "error",
      );
  }, [state, notify, dismissFlow, router]);

  useEffect(() => {
    if (Object.keys(draftErrors).length)
      formRef.current
        ?.querySelector<HTMLElement>(
          '[data-schema-editor] [aria-invalid="true"]',
        )
        ?.focus();
  }, [draftErrors]);

  function selectPreset(key: CollectionPresetKey) {
    setPresetKey(key);
    setDrafts((current) =>
      current[key]
        ? current
        : {
            ...current,
            [key]: createSchemaDraft(getCollectionPreset(key).fields),
          },
    );
    setDraftErrors({});
    setRequestId((current) => current ?? crypto.randomUUID());
  }

  function cancel() {
    if (pending) return;
    if (dirty) setCancelOpen(true);
    else leave();
  }

  function changeStep(next: 1 | 2) {
    setStep(next);
  }
  const titleClassName = modal
    ? "text-section-title-mobile"
    : "text-page-title-mobile sm:text-page-title";

  function leave() {
    startLeaving(async () => {
      if (dismissFlow) dismissFlow();
      else await router.push("/library");
    });
  }

  return (
    <>
      <div className={modal ? "space-y-6" : "space-y-8"}>
        {!modal ? (
          <>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1">
                {step === 1 && !dismissFlow ? (
                  <button
                    disabled={pending}
                    className="touch-target focus-ring rounded-control text-foreground-muted hover:bg-surface-muted px-3 text-sm font-semibold"
                    onClick={cancel}
                    type="button"
                  >
                    Back
                  </button>
                ) : null}
                {!modal ? (
                  <button
                    disabled={pending}
                    className="touch-target focus-ring rounded-control text-foreground-muted hover:bg-surface-muted px-3 text-sm font-semibold"
                    onClick={cancel}
                    type="button"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
        {leaving ? (
          <p className="text-foreground-muted text-sm" role="status">
            Returning to My Library…
          </p>
        ) : null}

        {step === 1 ? (
          <section aria-labelledby="preset-title" className="space-y-6">
            <FormSectionHeader
              as="h1"
              primary
              id="preset-title"
              title="What are you collecting?"
              description="Choose a starting point. You can change its fields later."
              titleClassName={titleClassName}
            />

            <div
              className={cn(
                "grid grid-cols-2 gap-3 sm:grid-cols-3",
                !modal && "lg:grid-cols-4",
              )}
            >
              {presets.map((option) => {
                const selected = option.key === presetKey;
                return (
                  <button
                    disabled={pending}
                    aria-label={`${option.label} preset`}
                    aria-pressed={selected}
                    className={cn(
                      "focus-ring rounded-card duration-base ease-standard relative flex min-h-36 flex-col items-center justify-center gap-4 border-2 text-center transition-[border-color,background-color,color,box-shadow,transform] motion-safe:hover:-translate-y-0.5 motion-reduce:transition-none",
                      modal ? "p-4" : "sm:p-panel p-5 sm:min-h-40",
                      selected &&
                        option.key === "blank" &&
                        "ring-control-border ring-offset-surface ring-2 ring-offset-2",
                      option.key === "blank"
                        ? "border-foreground bg-foreground text-surface"
                        : selected
                          ? "border-selection-border bg-surface"
                          : "border-border bg-surface hover:border-control-border",
                    )}
                    key={option.key}
                    onClick={() => selectPreset(option.key)}
                    type="button"
                  >
                    <PresetArtwork
                      className={
                        option.key === "blank"
                          ? "bg-surface/10 text-surface"
                          : undefined
                      }
                      presetKey={option.key}
                      size="md"
                      variant="icon"
                    />
                    <span className="font-semibold">{option.label}</span>
                    <span className="sr-only">{option.label} preset</span>
                  </button>
                );
              })}
            </div>

            <ModalActions>
              <Button
                className="ml-auto w-full sm:w-auto"
                disabled={pending || !presetKey}
                onClick={() => changeStep(2)}
                size={modal ? "default" : "lg"}
                type="button"
              >
                Continue
              </Button>
            </ModalActions>
          </section>
        ) : preset ? (
          <form
            id={formId}
            action={formAction}
            className="space-y-7"
            noValidate
            ref={formRef}
            onSubmit={(event) => {
              if (pending) {
                event.preventDefault();
                return;
              }
              const result = collectionFieldsDraftSchema.safeParse(
                serializeSchemaDraft(draft),
              );
              if (!result.success) {
                event.preventDefault();
                setDraftErrors(
                  Object.fromEntries(
                    result.error.issues.map((issue) => [
                      issue.path.join("."),
                      issue.message,
                    ]),
                  ),
                );
                notify("Review the highlighted fields and try again.", "error");
              }
            }}
          >
            <input name="presetKey" type="hidden" value={preset.key} />
            <input name="requestId" type="hidden" value={requestId ?? ""} />
            <input
              name="fields"
              type="hidden"
              value={JSON.stringify(serializeSchemaDraft(draft))}
            />

            <section aria-labelledby="details-title" className="space-y-6">
              <FormSectionHeader
                as="h1"
                primary
                id="details-title"
                title="Set up your collection"
                description="Name this Collection and customize its fields before creating it."
                titleClassName={titleClassName}
              />

              <Button
                data-preset-summary
                aria-label={`Change preset: ${preset.label}`}
                className="w-full justify-between gap-3 text-left"
                disabled={pending}
                onClick={() => changeStep(1)}
                type="button"
              >
                <span className="min-w-0 truncate">
                  {preset.key === "blank" ? "Custom" : `${preset.label} preset`}
                </span>
                <span className="shrink-0">Change preset</span>
              </Button>

              <div
                className="grid gap-6"
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

                <CollectionSchemaEditor
                  modal={modal}
                  fields={draft}
                  disabled={pending}
                  errors={draftErrors}
                  serverError={state.fieldErrors?.fields}
                  onChange={(fields) => {
                    if (presetKey)
                      setDrafts((current) => ({
                        ...current,
                        [presetKey]: fields,
                      }));
                    setDraftErrors({});
                  }}
                />
              </div>
            </section>

            {state.status === "error" && state.message ? (
              <FeedbackMessage kind="error">{state.message}</FeedbackMessage>
            ) : null}

            <ModalActions className="flex flex-wrap items-center justify-between gap-3">
              <Button
                disabled={pending}
                onClick={() => changeStep(1)}
                type="button"
                variant="ghost"
              >
                <ArrowLeft aria-hidden="true" />
                Back
              </Button>
              <Button
                form={formId}
                disabled={pending || !requestId}
                size={modal ? "default" : "lg"}
                type="submit"
              >
                {saving ? "Creating collection…" : "Create collection"}
              </Button>
            </ModalActions>
          </form>
        ) : null}
      </div>

      <ConfirmDialog
        confirmLabel="Discard collection"
        description="Your preset choice and collection details will be lost."
        isPending={leaving}
        onConfirm={leave}
        onOpenChange={setCancelOpen}
        open={cancelOpen}
        title="Discard this collection?"
      />
    </>
  );
}
