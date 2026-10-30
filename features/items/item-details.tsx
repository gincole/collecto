"use client";

import { ImageOff, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";

import type { ItemFieldDefinition, ItemRecord } from "./types";

export type ItemDetailRow =
  | { kind: "date"; label: string; value: string }
  | { kind: "number"; label: string; value: number }
  | { kind: "rating"; label: string; value: number }
  | { kind: "text" | "url"; label: string; value: string };
export type DeleteItemState = { message?: string; status: "idle" | "error" };
export type DeleteItemAction = (
  previous: DeleteItemState,
  formData: FormData,
) => Promise<DeleteItemState>;

export function getItemDetailRows(
  item: ItemRecord,
  fields: ItemFieldDefinition[],
): ItemDetailRow[] {
  return [...fields]
    .sort((left, right) => left.position - right.position)
    .flatMap<ItemDetailRow>((field) => {
      const value = item.values[field.id];
      if (value === undefined || value === "") return [];
      if (field.type === "select") {
        const option = field.options.find(
          (candidate) => candidate.id === value,
        );
        return option
          ? [{ kind: "text" as const, label: field.name, value: option.label }]
          : [];
      }
      if (field.type === "rating")
        return typeof value === "number" && value >= 1 && value <= 5
          ? [{ kind: "rating" as const, label: field.name, value }]
          : [];
      if (field.type === "number")
        return typeof value === "number"
          ? [{ kind: "number" as const, label: field.name, value }]
          : [];
      if (field.type === "date")
        return typeof value === "string"
          ? [{ kind: "date" as const, label: field.name, value }]
          : [];
      return [
        {
          kind: field.type === "url" ? ("url" as const) : ("text" as const),
          label: field.name,
          value: String(value),
        },
      ];
    });
}

function ImagePanel({ item }: { item: ItemRecord }) {
  const [failed, setFailed] = useState(false);
  if (!item.imagePath || failed)
    return (
      <div className="border-border bg-muted/30 text-foreground-muted flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed">
        <ImageOff aria-hidden="true" className="mr-2 size-5" /> No image
      </div>
    );
  return (
    <div className="space-y-3">
      <div className="border-border bg-muted/30 overflow-hidden rounded-xl border">
        {/* eslint-disable-next-line @next/next/no-img-element -- authenticated private image route */}
        <img
          alt={item.title}
          className="aspect-[4/3] w-full object-contain"
          onError={() => setFailed(true)}
          src={`/api/items/${item.id}/image`}
        />
      </div>
      <Button asChild variant="outline">
        <a
          href={`/api/items/${item.id}/image`}
          rel="noreferrer"
          target="_blank"
        >
          View full size
        </a>
      </Button>
    </div>
  );
}

export function ItemDetails({
  collectionId,
  deleteAction = async () => ({ status: "idle" }),
  fields,
  item,
}: {
  collectionId: string;
  deleteAction?: DeleteItemAction;
  fields: ItemFieldDefinition[];
  item: ItemRecord;
}) {
  const rows = getItemDetailRows(item, fields);
  const [dialogOpen, setDialogOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(deleteAction, {
    status: "idle",
  });
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
      <ImagePanel item={item} />
      <div className="min-w-0 space-y-6">
        <div className="space-y-2">
          <h1 className="text-page-title-mobile sm:text-page-title break-words">
            {item.title}
          </h1>
          {item.description ? (
            <p className="text-foreground-muted break-words whitespace-pre-wrap">
              {item.description}
            </p>
          ) : null}
        </div>
        {rows.length ? (
          <dl className="divide-border divide-y">
            {rows.map((row) => (
              <div
                className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]"
                key={row.label}
              >
                <dt className="text-foreground-muted font-medium">
                  {row.label}
                </dt>
                <dd className="min-w-0 break-words">
                  {row.kind === "rating" ? (
                    <span
                      aria-label={`${row.value} out of 5`}
                      className="inline-flex items-center gap-2"
                    >
                      <span className="inline-flex" aria-hidden="true">
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star
                            className={
                              index < row.value ? "fill-current" : "text-border"
                            }
                            key={index}
                            size={18}
                          />
                        ))}
                      </span>
                      {row.value} out of 5
                    </span>
                  ) : row.kind === "date" ? (
                    <time dateTime={row.value} suppressHydrationWarning>
                      {new Intl.DateTimeFormat(undefined, {
                        dateStyle: "medium",
                        timeZone: "UTC",
                      }).format(new Date(`${row.value}T00:00:00Z`))}
                    </time>
                  ) : row.kind === "number" ? (
                    <span suppressHydrationWarning>
                      {new Intl.NumberFormat().format(row.value)}
                    </span>
                  ) : row.kind === "url" ? (
                    <a
                      className="text-link underline underline-offset-4"
                      href={row.value}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {row.value}
                    </a>
                  ) : (
                    row.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href={`/collections/${collectionId}/items/${item.id}/edit`}>
              Edit item
            </Link>
          </Button>
          <Button
            onClick={() => setDialogOpen(true)}
            type="button"
            variant="ghost"
          >
            <Trash2 aria-hidden="true" className="size-4" /> Delete item
          </Button>
        </div>
        <form action={formAction} ref={formRef}>
          <input name="collectionId" type="hidden" value={collectionId} />
          <input name="itemId" type="hidden" value={item.id} />
          <ConfirmDialog
            confirmLabel="Delete item"
            description="This permanently deletes the Item and schedules its private image for removal. This cannot be undone."
            error={state.message}
            isPending={pending}
            onConfirm={() => formRef.current?.requestSubmit()}
            onOpenChange={setDialogOpen}
            open={dialogOpen}
            title={`Delete “${item.title}”?`}
            variant="destructive"
          />
        </form>
      </div>
    </div>
  );
}
