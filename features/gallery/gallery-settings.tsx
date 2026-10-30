"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/shared/feedback-message";
import { Select } from "@/components/ui/form-control";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { CollectionRecord } from "@/features/collections/models";
import {
  galleryConfigSchema,
  type GalleryConfig,
} from "@/features/collections/schemas";
import type { ItemRecord } from "@/features/items/types";
import { ReorderButtons } from "@/features/fields/reorder-buttons";
import { GalleryGrid } from "./gallery-grid";
import { sanitizeVisibleFields } from "./draft";
import type { GallerySaveInput, GallerySaveResult } from "./service";

type Props = {
  collection: CollectionRecord;
  items: ItemRecord[];
  saveAction: (input: GallerySaveInput) => Promise<GallerySaveResult>;
};

function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-label grid min-w-0 gap-2">
      {label}
      <Select onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    </label>
  );
}

export function GallerySettings({ collection, items, saveAction }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [draft, setDraft] = useState(collection.viewConfig);
  const [baseline, setBaseline] = useState(collection.viewConfig);
  const [message, setMessage] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const safeDraft = sanitizeVisibleFields(draft, collection.fields);
  const dirty =
    JSON.stringify(safeDraft) !==
    JSON.stringify(sanitizeVisibleFields(baseline, collection.fields));
  const choices = [
    { id: "title", name: "Title" },
    { id: "description", name: "Description" },
    ...collection.fields,
  ];

  function change<K extends keyof GalleryConfig>(
    key: K,
    value: GalleryConfig[K],
  ) {
    setDraft({ ...safeDraft, [key]: value });
    setMessage(undefined);
  }
  function onOpenChange(nextOpen: boolean) {
    if (pending) return;
    if (nextOpen) {
      const initial = sanitizeVisibleFields(
        collection.viewConfig,
        collection.fields,
      );
      setDraft(initial);
      setBaseline(initial);
      setMessage(undefined);
      setSaved(false);
      setOpen(true);
    } else if (dirty) setDiscardOpen(true);
    else setOpen(false);
  }
  function moveField(index: number, direction: -1 | 1) {
    const ids = [...safeDraft.visibleFieldIds];
    [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]];
    change("visibleFieldIds", ids);
  }
  function save() {
    startTransition(async () => {
      try {
        const result = await saveAction({
          collectionId: collection.id,
          config: safeDraft,
        });
        if (result.status === "success") {
          setOpen(false);
          setSaved(true);
          router.refresh();
          return;
        }
        const errors: Record<
          Exclude<GallerySaveResult["status"], "success">,
          string
        > = {
          conflict:
            "The Fields changed. Review the refreshed selection and try again.",
          unauthorized: "Your session ended. Log in and try again.",
          not_found: "This Collection is unavailable. Return to My Library.",
          validation_error: "Review your gallery settings and try again.",
          error: "Could not save gallery settings. Try again.",
        };
        setMessage(errors[result.status]);
        if (result.status === "conflict") router.refresh();
      } catch {
        setMessage("Could not save gallery settings. Try again.");
      }
    });
  }
  const sample: ItemRecord = items[0] ?? {
    id: collection.id,
    collectionId: collection.id,
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
    title: "Sample item",
    description: "Your memories will appear here.",
    imagePath: null,
    values: Object.fromEntries(
      collection.fields.map((field) => [
        field.id,
        field.type === "number"
          ? 42
          : field.type === "rating"
            ? 4
            : field.type === "date"
              ? "2026-01-01"
              : field.type === "select"
                ? (field.options[0]?.id ?? "")
                : field.type === "url"
                  ? "https://example.com"
                  : "Sample value",
      ]),
    ),
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline">
            Gallery settings
          </Button>
        </DialogTrigger>
        <DialogContent
          className="top-0 right-0 left-auto grid h-dvh w-screen max-w-none translate-x-0 translate-y-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-4 rounded-none border-0 p-4 sm:w-full sm:max-w-md sm:p-6"
          showCloseButton={!pending}
          onEscapeKeyDown={(event) => {
            if (pending) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (pending) event.preventDefault();
          }}
        >
          <div className="space-y-2 pr-10">
            <DialogTitle className="text-section-title">
              Gallery settings
            </DialogTitle>
            <DialogDescription className="text-foreground-muted">
              Preview changes before saving. These settings apply to every view
              in this Collection.
            </DialogDescription>
          </div>
          <div className="min-h-0 space-y-6 overflow-y-auto px-1 pb-2">
            <fieldset className="space-y-5" disabled={pending}>
              <legend className="sr-only">Gallery appearance</legend>
              <div className="grid grid-cols-2 gap-4">
                <Choice
                  label="Columns"
                  value={String(safeDraft.columns)}
                  options={["1", "2", "3", "4", "5"]}
                  onChange={(value) =>
                    change(
                      "columns",
                      galleryConfigSchema.shape.columns.parse(Number(value)),
                    )
                  }
                />
                <Choice
                  label="Image ratio"
                  value={safeDraft.aspectRatio}
                  options={galleryConfigSchema.shape.aspectRatio.options}
                  onChange={(value) =>
                    change(
                      "aspectRatio",
                      galleryConfigSchema.shape.aspectRatio.parse(value),
                    )
                  }
                />
                <Choice
                  label="Image fit"
                  value={safeDraft.imageFit}
                  options={galleryConfigSchema.shape.imageFit.options}
                  onChange={(value) =>
                    change(
                      "imageFit",
                      galleryConfigSchema.shape.imageFit.parse(value),
                    )
                  }
                />
                <Choice
                  label="Spacing"
                  value={safeDraft.spacing}
                  options={galleryConfigSchema.shape.spacing.options}
                  onChange={(value) =>
                    change(
                      "spacing",
                      galleryConfigSchema.shape.spacing.parse(value),
                    )
                  }
                />
              </div>
              <label className="grid gap-2 font-semibold">
                Sort order
                <Select
                  value={`${safeDraft.sortBy}:${safeDraft.sortDirection}`}
                  onChange={(event) => {
                    const [sortBy, sortDirection] =
                      event.target.value.split(":");
                    setDraft({
                      ...safeDraft,
                      sortBy: galleryConfigSchema.shape.sortBy.parse(sortBy),
                      sortDirection:
                        galleryConfigSchema.shape.sortDirection.parse(
                          sortDirection,
                        ),
                    });
                  }}
                >
                  <option value="createdAt:desc">Newest first</option>
                  <option value="createdAt:asc">Oldest first</option>
                  <option value="title:asc">Title A–Z</option>
                  <option value="title:desc">Title Z–A</option>
                </Select>
              </label>
              <label className="flex min-h-11 items-center gap-3 font-semibold">
                <input
                  type="checkbox"
                  className="accent-selection-border size-5"
                  checked={safeDraft.showDetails}
                  onChange={(event) =>
                    change("showDetails", event.target.checked)
                  }
                />
                Show details
              </label>
              <section className="space-y-3" aria-label="Visible fields">
                <h3 className="font-semibold">Visible fields</h3>
                <p className="text-foreground-muted text-sm">
                  Choose up to three fields. The first is the primary label.
                  Selections are kept when details are off.
                </p>
                {choices.map((field) => (
                  <label
                    className="flex min-h-11 items-center gap-3"
                    key={field.id}
                  >
                    <input
                      type="checkbox"
                      className="accent-selection-border size-5"
                      checked={safeDraft.visibleFieldIds.includes(field.id)}
                      disabled={
                        !safeDraft.visibleFieldIds.includes(field.id) &&
                        safeDraft.visibleFieldIds.length >= 3
                      }
                      onChange={(event) =>
                        change(
                          "visibleFieldIds",
                          event.target.checked
                            ? [...safeDraft.visibleFieldIds, field.id]
                            : safeDraft.visibleFieldIds.filter(
                                (id) => id !== field.id,
                              ),
                        )
                      }
                    />
                    {field.name}
                  </label>
                ))}
                <ol className="space-y-2">
                  {safeDraft.visibleFieldIds.map((id, index) => {
                    const name =
                      choices.find((field) => field.id === id)?.name ?? "Field";
                    return (
                      <li
                        className="border-border rounded-control flex items-center justify-between gap-2 border px-3"
                        key={id}
                      >
                        <span className="min-w-0 break-words">
                          {index + 1}. {name}
                        </span>
                        <ReorderButtons
                          disabled={pending}
                          label={name}
                          onUp={
                            index > 0 ? () => moveField(index, -1) : undefined
                          }
                          onDown={
                            index < safeDraft.visibleFieldIds.length - 1
                              ? () => moveField(index, 1)
                              : undefined
                          }
                        />
                      </li>
                    );
                  })}
                </ol>
              </section>
            </fieldset>
            <section aria-label="Gallery preview" className="space-y-3">
              <h3 className="font-semibold">Preview</h3>
              {items.length === 0 ? (
                <p className="text-foreground-muted text-sm">
                  A sample is shown until you add an Item.
                </p>
              ) : null}
              <GalleryGrid
                collectionId={collection.id}
                config={safeDraft}
                fields={collection.fields}
                items={
                  items.length
                    ? items
                    : Array.from({ length: 5 }, (_, index) => ({
                        ...sample,
                        id: `${sample.id}-${index}`,
                        title:
                          index === 0
                            ? sample.title
                            : `${sample.title} ${index + 1}`,
                      }))
                }
                preview
              />
            </section>
            {message ? (
              <FeedbackMessage kind="error">{message}</FeedbackMessage>
            ) : null}
          </div>
          <div className="flex flex-wrap justify-end gap-3 pb-[env(safe-area-inset-bottom)]">
            <Button
              disabled={pending}
              onClick={() => onOpenChange(false)}
              variant="outline"
              type="button"
            >
              Cancel
            </Button>
            <Button
              disabled={pending}
              aria-busy={pending}
              onClick={save}
              type="button"
            >
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </div>
          <ConfirmDialog
            open={discardOpen}
            onOpenChange={setDiscardOpen}
            title="Discard gallery changes?"
            description="Your unsaved gallery changes will be discarded."
            confirmLabel="Discard changes"
            cancelLabel="Keep editing"
            onConfirm={() => {
              setDiscardOpen(false);
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
      {saved ? (
        <FeedbackMessage>Gallery settings saved.</FeedbackMessage>
      ) : null}
    </>
  );
}
