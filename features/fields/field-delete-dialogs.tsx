"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  errorMessage,
  type Field,
  type FieldManagerActions,
} from "./field-manager-contract";

type DeleteTarget = {
  description: (impact: number) => string;
  getImpact: () => Promise<import("./field-manager-contract").ActionResult>;
  name: string;
  remove: () => Promise<import("./field-manager-contract").ActionResult>;
  subject: "Field" | "Option";
};

function DeleteSchemaDialog({ target }: { target: DeleteTarget }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [impact, setImpact] = useState<number>();
  const [message, setMessage] = useState<string>();
  const [pending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setImpact(undefined);
      setMessage(undefined);
      return;
    }
    startTransition(async () => {
      const result = await target.getImpact();
      if (result.status === "success")
        setImpact(result.data?.affectedItemCount ?? 0);
      else setMessage(errorMessage(result, target.subject, "check"));
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await target.remove();
      if (result.status === "success") {
        setOpen(false);
        router.refresh();
      } else setMessage(errorMessage(result, target.subject, "delete"));
    });
  }

  const subjectLabel = target.subject.toLowerCase();
  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button
          aria-label={`Delete ${target.name}`}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent role="alertdialog" showCloseButton={false}>
        <div className="space-y-2">
          <DialogTitle className="text-xl font-semibold">
            Delete {target.name}?
          </DialogTitle>
          <DialogDescription className="text-foreground-muted text-base leading-6">
            {impact === undefined
              ? "Checking affected Items…"
              : target.description(impact)}
          </DialogDescription>
          {message ? (
            <p className="text-error text-sm" role="alert">
              {message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <Button disabled={pending} type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            aria-busy={pending}
            disabled={pending || impact === undefined}
            onClick={handleDelete}
            type="button"
            variant="destructive"
          >
            {pending ? "Deleting…" : `Delete ${subjectLabel}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteFieldDialog({
  actions,
  collectionId,
  field,
}: {
  actions: FieldManagerActions;
  collectionId: string;
  field: Field;
}) {
  return (
    <DeleteSchemaDialog
      target={{
        description: (impact) =>
          `${impact} ${impact === 1 ? "item has" : "items have"} a value for this Field. Those values and any Gallery reference will be permanently removed.`,
        getImpact: () =>
          actions.getFieldImpact({ collectionId, fieldId: field.id }),
        name: field.name,
        remove: () => actions.deleteField({ collectionId, fieldId: field.id }),
        subject: "Field",
      }}
    />
  );
}

export function DeleteOptionDialog({
  actions,
  collectionId,
  fieldId,
  option,
}: {
  actions: FieldManagerActions;
  collectionId: string;
  fieldId: string;
  option: Field["options"][number];
}) {
  return (
    <DeleteSchemaDialog
      target={{
        description: (impact) =>
          `${impact} ${impact === 1 ? "item uses" : "items use"} this option. Their value will be cleared and they will appear in Uncategorized.`,
        getImpact: () =>
          actions.getOptionImpact({
            collectionId,
            fieldId,
            optionId: option.id,
          }),
        name: option.label,
        remove: () =>
          actions.deleteOption({
            collectionId,
            fieldId,
            optionId: option.id,
          }),
        subject: "Option",
      }}
    />
  );
}
