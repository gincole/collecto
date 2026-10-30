"use client";

import type { ReactElement, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { DeleteButton } from "./delete-button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
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
  cancelLabel,
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
        closeDisabled={isPending}
        onEscapeKeyDown={(event) => {
          if (isPending) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (isPending) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="pr-0 text-xl font-semibold">
            {title}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-2">
          <DialogDescription className="text-foreground-muted text-base leading-6">
            {description}
          </DialogDescription>
          {error ? (
            <p className="text-error text-sm" role="alert">
              {error}
            </p>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {cancelLabel ? (
              <DialogClose asChild>
                <Button disabled={isPending} type="button" variant="outline">
                  {cancelLabel}
                </Button>
              </DialogClose>
            ) : null}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ConfirmDialog };
export type { ConfirmDialogProps };
