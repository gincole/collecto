"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { Button } from "./button";

import { cn } from "@/lib/utils/cn";

const DialogContainerContext = createContext<HTMLDivElement | null>(null);
const DialogChromeContext = createContext<{
  closeDisabled: boolean;
  showCloseButton: boolean;
  footer: HTMLDivElement | null;
  setFooter: (node: HTMLDivElement | null) => void;
} | null>(null);
export function useDialogFooter() {
  return useContext(DialogChromeContext)?.footer;
}
export function useDialogContainer() {
  return useContext(DialogContainerContext);
}
const Dialog = DialogPrimitive.Root;
const DialogClose = DialogPrimitive.Close;
const DialogDescription = DialogPrimitive.Description;
function DialogTitle({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("pr-0", className)} {...props} />;
}
const DialogTrigger = DialogPrimitive.Trigger;

function DialogContent({
  children,
  ref,
  className,
  showCloseButton = true,
  closeDisabled = false,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
  closeDisabled?: boolean;
}) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [footer, setFooter] = useState<HTMLDivElement | null>(null);
  const contentRef = useCallback(
    (node: HTMLDivElement | null) => {
      setContainer(node);
      if (typeof ref === "function") return ref(node);
      if (ref) ref.current = node;
    },
    [ref],
  );
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog-overlay bg-foreground/50 fixed inset-0 z-50" />
      <DialogPrimitive.Content
        ref={contentRef}
        className={cn(
          "dialog-content border-border bg-surface text-foreground focus-ring rounded-dialog shadow-dialog sm:px-panel fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden overscroll-contain border px-4 py-0 break-words sm:w-full",
          className,
        )}
        {...props}
      >
        <DialogContainerContext.Provider value={container}>
          <DialogChromeContext.Provider
            value={{ closeDisabled, showCloseButton, footer, setFooter }}
          >
            {children}
          </DialogChromeContext.Provider>
        </DialogContainerContext.Provider>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

function DialogHeader({
  children,
  closeButton,
  className,
  ...props
}: ComponentProps<"header"> & { closeButton?: ReactNode }) {
  const chrome = useContext(DialogChromeContext);
  return (
    <header
      {...props}
      data-modal-header
      className={cn(
        "border-border py-panel mx-5 flex items-center justify-between gap-4 border-b",
        className,
      )}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {closeButton ??
        (chrome?.showCloseButton ? (
          <DialogPrimitive.Close asChild>
            <Button
              disabled={chrome.closeDisabled}
              data-dialog-close
              aria-label="Close"
              size="icon"
              variant="outline"
            >
              <X aria-hidden="true" />
            </Button>
          </DialogPrimitive.Close>
        ) : null)}
    </header>
  );
}
function DialogBody({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-modal-body
      className={cn(
        "min-h-0 overflow-y-auto overscroll-contain px-5 pt-5 pb-10",
        className,
      )}
    />
  );
}
function DialogFooter({ className, ref, ...props }: ComponentProps<"div">) {
  const register = useContext(DialogChromeContext)?.setFooter;
  const footerRef = useCallback(
    (node: HTMLDivElement | null) => {
      register?.(node);
      if (typeof ref === "function") return ref(node);
      if (ref) ref.current = node;
    },
    [register, ref],
  );
  return (
    <div
      {...props}
      ref={footerRef}
      data-modal-footer
      className={cn(
        "border-border bg-surface py-panel mx-5 border-t empty:hidden",
        className,
      )}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
};
