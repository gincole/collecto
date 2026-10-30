"use client";

import type { ReactElement, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { DeleteButton } from "./delete-button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ConfirmDialogProps = {
  cancelLabel?: string;
  confirmLabel: string;
  description: ReactNode;
  error?: ReactNode;
  isPending?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
  trigger?: ReactElement;
  variant?: "default" | "destructive";
};

function ConfirmDialog({
  cancelLabel = "Cancel",
  confirmLabel,
  description,
  error,
  isPending = false,
  onConfirm,
  onOpenChange,
  open,
  title,
  trigger,
  variant = "default",
}: ConfirmDialogProps) {
  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        if (!isPending) onOpenChange(nextOpen);
      }}
      open={open}
    >
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        role="alertdialog"
        showCloseButton={false}
        onEscapeKeyDown={(event) => {
          if (isPending) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (isPending) event.preventDefault();
        }}
      >
        <Button
          type="button"
          variant="ghost"
          className="w-fit"
          disabled={isPending}
          onClick={() => onOpenChange(false)}
        >
          <ArrowLeft aria-hidden="true" />
          Back
        </Button>
        <div className="space-y-2">
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-foreground-muted text-base leading-6">
            {description}
          </DialogDescription>
          {error ? (
            <p className="text-error text-sm" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <Button disabled={isPending} type="button" variant="outline">
              {cancelLabel}
            </Button>
          </DialogClose>
          {variant === "destructive" ? (
            <DeleteButton confirm pending={isPending} onClick={onConfirm} />
          ) : (
            <Button
              aria-busy={isPending}
              disabled={isPending}
              onClick={onConfirm}
              type="button"
              variant={variant}
            >
              {isPending ? "Working…" : confirmLabel}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { ConfirmDialog };
export type { ConfirmDialogProps };
