"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

const Dialog = DialogPrimitive.Root;
const DialogClose = DialogPrimitive.Close;
const DialogDescription = DialogPrimitive.Description;
const DialogTitle = DialogPrimitive.Title;
const DialogTrigger = DialogPrimitive.Trigger;

function DialogContent({
  children,
  className,
  showCloseButton = true,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog-overlay bg-foreground/50 fixed inset-0 z-50" />
      <DialogPrimitive.Content
        className={cn(
          "dialog-content border-border bg-surface text-foreground focus-ring rounded-dialog shadow-dialog sm:p-panel fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto overscroll-contain border p-5 break-words sm:w-full",
          className,
        )}
        {...props}
      >
        {showCloseButton ? (
          <DialogPrimitive.Close
            data-dialog-close
            aria-label="Back"
            className="touch-target text-foreground-muted hover:bg-surface-muted focus-ring rounded-control inline-flex w-fit items-center justify-center gap-2 px-3 text-sm"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back
          </DialogPrimitive.Close>
        ) : null}
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
};
