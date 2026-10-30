"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/shared/delete-button";
import { useFlowBusy } from "@/components/shared/flow-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
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

function DeleteSchemaDialog({
  target,
  onDeleted,
  disabled,
}: {
  target: DeleteTarget;
  onDeleted?: () => void;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [impact, setImpact] = useState<number>();
  const [message, setMessage] = useState<string>();
  const [pending, startTransition] = useTransition();
  useFlowBusy(pending);

  function handleOpenChange(nextOpen: boolean) {
    if (pending) return;
    setOpen(nextOpen);
    if (!nextOpen) {
      setImpact(undefined);
      setMessage(undefined);
      return;
    }
    setMessage(undefined);
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
        onDeleted?.();
        router.refresh();
      } else setMessage(errorMessage(result, target.subject, "delete"));
    });
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <DeleteButton
          disabled={disabled}
          aria-label={`Delete ${target.name}`}
          type="button"
        />
      </DialogTrigger>
      <DialogContent
        role="alertdialog"
        closeDisabled={pending}
        onEscapeKeyDown={(event) => {
          if (pending) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Delete {target.name}?
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-2">
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
          {message && impact === undefined ? (
            <Button
              onClick={() => handleOpenChange(true)}
              type="button"
              variant="outline"
              disabled={pending}
            >
              Try again
            </Button>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <DeleteButton
              confirm
              checking={pending && impact === undefined}
              pending={pending && impact !== undefined}
              disabled={pending || impact === undefined}
              onClick={handleDelete}
              type="button"
            />
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteFieldDialog({
  actions,
  collectionId,
  field,
  onDeleted,
  disabled,
}: {
  actions: FieldManagerActions;
  collectionId: string;
  field: Field;
  onDeleted?: () => void;
  disabled?: boolean;
}) {
  return (
    <DeleteSchemaDialog
      onDeleted={onDeleted}
      disabled={disabled}
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
