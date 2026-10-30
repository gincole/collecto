"use client";

import {
  useRef,
  useState,
  useTransition,
  type RefObject,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  Columns3,
  Proportions,
  Scan,
  Space,
  Eye,
  type LucideIcon,
} from "lucide-react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/shared/feedback-message";
import { useFeedback } from "@/components/shared/feedback";
import { Select } from "@/components/ui/form-control";
import {
  FlowModal,
  FlowGuard,
  ModalActions,
} from "@/components/shared/flow-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { CollectionRecord } from "@/features/collections/models";
import {
  galleryConfigSchema,
  type GalleryConfig,
} from "@/features/collections/schemas";
import type { ItemRecord } from "@/features/items/types";
import { GalleryFieldVisibility } from "./gallery-field-visibility";
import { GalleryGrid } from "./gallery-grid";
import { sanitizeVisibleFields } from "./draft";
import type { GallerySaveInput, GallerySaveResult } from "./service";

type Props = {
  collection: CollectionRecord;
  items: ItemRecord[];
  saveAction: (input: GallerySaveInput) => Promise<GallerySaveResult>;
  returnFocus?: RefObject<HTMLButtonElement | null>;
  open?: boolean;
  setOpen?: (open: boolean) => void;
};

function SettingRow({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div
      data-gallery-setting={label}
      className="grid min-w-0 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]"
    >
      <span className="text-label inline-flex items-center gap-2">
        <Icon aria-hidden="true" className="size-4 shrink-0" />
        {label}
      </span>
      <div className="flex min-w-0 justify-end">{children}</div>
    </div>
  );
}
function Choice({
  label,
  icon,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  icon: LucideIcon;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <SettingRow label={label} icon={icon}>
      <SegmentedControl
        label={label}
        value={value}
        options={options.map((value) => ({
          value,
          label: value.charAt(0).toUpperCase() + value.slice(1),
        }))}
        onChange={onChange}
        disabled={disabled}
      />
    </SettingRow>
  );
}

export function GallerySettings({
  collection,
  items,
  saveAction,
  returnFocus,
  open: externalOpen,
  setOpen: externalSetOpen,
}: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const notify = useFeedback();
  const router = useRouter();
  const [localOpen, setLocalOpen] = useState(false);
  const open = externalOpen ?? localOpen;
  const setOpen = externalSetOpen ?? setLocalOpen;
  const [discardOpen, setDiscardOpen] = useState(false);
  const [draft, setDraft] = useState(collection.viewConfig);
  const [baseline, setBaseline] = useState(collection.viewConfig);
  const [message, setMessage] = useState<string>();
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
      setOpen(true);
    } else if (dirty) setDiscardOpen(true);
    else setOpen(false);
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
          notify("Gallery settings saved.");
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
        notify(errors[result.status], "error");
        if (result.status === "conflict") router.refresh();
      } catch {
        setMessage("Could not save gallery settings. Try again.");
        notify("Could not save gallery settings. Try again.", "error");
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
      {externalOpen === undefined ? (
        <Button
          ref={triggerRef}
          type="button"
          variant="outline"
          onClick={() => onOpenChange(true)}
        >
          Gallery settings
        </Button>
      ) : null}
      {open ? (
        <FlowModal
          title="Gallery settings"
          returnFocus={returnFocus ?? triggerRef}
          onClose={() => onOpenChange(false)}
        >
          <FlowGuard onClose={() => onOpenChange(false)} busy={pending} />
          <div className="space-y-6">
            <fieldset className="space-y-5" disabled={pending}>
              <legend className="mb-5">
                <h3 data-form-heading="section" className="font-semibold">
                  Display settings
                </h3>
              </legend>
              <p className="text-foreground-muted">
                Preview changes before saving. These settings apply to every
                view in this Collection.
              </p>
              <SettingRow label="Sort order" icon={ArrowUpDown}>
                <Select
                  aria-label="Sort order"
                  className="w-full"
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
              </SettingRow>
              <Choice
                label="Columns"
                icon={Columns3}
                value={String(safeDraft.columns)}
                options={["1", "2", "3", "4", "5"]}
                disabled={pending}
                onChange={(value) =>
                  change(
                    "columns",
                    galleryConfigSchema.shape.columns.parse(Number(value)),
                  )
                }
              />
              <Choice
                label="Image ratio"
                icon={Proportions}
                value={safeDraft.aspectRatio}
                options={galleryConfigSchema.shape.aspectRatio.options}
                disabled={pending}
                onChange={(value) =>
                  change(
                    "aspectRatio",
                    galleryConfigSchema.shape.aspectRatio.parse(value),
                  )
                }
              />
              <Choice
                label="Image fit"
                icon={Scan}
                value={safeDraft.imageFit}
                options={galleryConfigSchema.shape.imageFit.options}
                disabled={pending}
                onChange={(value) =>
                  change(
                    "imageFit",
                    galleryConfigSchema.shape.imageFit.parse(value),
                  )
                }
              />
              <Choice
                label="Spacing"
                icon={Space}
                value={safeDraft.spacing}
                options={galleryConfigSchema.shape.spacing.options}
                disabled={pending}
                onChange={(value) =>
                  change(
                    "spacing",
                    galleryConfigSchema.shape.spacing.parse(value),
                  )
                }
              />
              <SettingRow label="Show details" icon={Eye}>
                <SegmentedControl
                  label="Show details"
                  value={String(safeDraft.showDetails)}
                  options={[
                    { value: "true", label: "Show" },
                    { value: "false", label: "Not show" },
                  ]}
                  disabled={pending}
                  onChange={(value) => change("showDetails", value === "true")}
                />
              </SettingRow>
            </fieldset>
            <section
              data-modal-section
              className="space-y-3"
              aria-label="Visible fields"
            >
              <h3 data-form-heading="section" className="font-semibold">
                Visible fields
              </h3>
              <p className="text-foreground-muted text-sm">
                Drag fields between the lists to choose up to three visible
                fields. The first is the primary label. Selections are kept when
                details are off. On a focused drag handle, Alt+Up shows a field
                and Alt+Down hides it.
              </p>
              <GalleryFieldVisibility
                fields={choices}
                value={safeDraft.visibleFieldIds}
                disabled={pending}
                onChange={(ids) => change("visibleFieldIds", ids)}
              />
            </section>
            <section
              data-modal-section
              aria-label="Gallery preview"
              className="space-y-3"
            >
              <h3 data-form-heading="section" className="font-semibold">
                Preview
              </h3>
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
          <ModalActions>
            <Button
              disabled={pending}
              aria-busy={pending}
              onClick={save}
              type="button"
            >
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </ModalActions>
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
        </FlowModal>
      ) : null}
    </>
  );
}
