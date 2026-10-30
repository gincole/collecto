"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
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
          "dialog-content border-border bg-surface text-foreground focus-ring rounded-dialog shadow-dialog sm:p-panel fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border p-5 sm:w-full",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close
            aria-label="Close dialog"
            className="touch-target text-foreground-muted hover:bg-surface-muted focus-ring rounded-control absolute top-3 right-3 inline-flex items-center justify-center"
          >
            <X aria-hidden="true" />
          </DialogPrimitive.Close>
        ) : null}
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
