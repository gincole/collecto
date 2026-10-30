"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogBody,
  DialogFooter,
  useDialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Controls = {
  header: HTMLDivElement | null;
  footer: HTMLDivElement | null;
  registerGuard: (handler: (() => void) | null) => void;
  dismiss: () => void;
  registerBusy: (token: symbol, busy: boolean) => void;
};
const FlowContext = createContext<Controls | null>(null);

export function useFlowExit(handler: (() => void) | undefined, busy = false) {
  const flow = useContext(FlowContext);
  const registerGuard = flow?.registerGuard;
  useFlowBusy(busy);
  useEffect(() => {
    registerGuard?.(handler ?? null);
    return () => registerGuard?.(null);
  }, [registerGuard, handler]);
  return flow?.dismiss;
}
export function useFlowBusy(busy: boolean) {
  const registerBusy = useContext(FlowContext)?.registerBusy;
  const [token] = useState(() => Symbol());
  useEffect(() => {
    registerBusy?.(token, busy);
    return () => registerBusy?.(token, false);
  }, [registerBusy, token, busy]);
}
export function FlowGuard({
  onClose,
  busy,
}: {
  onClose: () => void;
  busy: boolean;
}) {
  useFlowExit(onClose, busy);
  return null;
}

export function ModalActions({
  children,
  className = "flex flex-wrap items-center justify-end gap-3",
}: {
  children: ReactNode;
  className?: string;
}) {
  const flow = useContext(FlowContext);
  const dialogFooter = useDialogFooter();
  const footer = dialogFooter === undefined ? flow?.footer : dialogFooter;
  const actions = <div className={className}>{children}</div>;
  return flow || dialogFooter !== undefined
    ? footer
      ? createPortal(actions, footer)
      : null
    : actions;
}

export function ModalHeader({ children }: { children: ReactNode }) {
  const flow = useContext(FlowContext);
  return flow
    ? flow.header
      ? createPortal(children, flow.header)
      : null
    : children;
}

export function FlowModal({
  title,
  showTitle = true,
  onClose,
  returnFocus,
  children,
}: {
  title: string;
  showTitle?: boolean;
  onClose: () => void;
  returnFocus?: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const [opener] = useState(() =>
    typeof document === "undefined" ? null : document.activeElement,
  );
  const [footer, setFooter] = useState<HTMLDivElement | null>(null);
  const [header, setHeader] = useState<HTMLDivElement | null>(null);
  const [busySources, setBusySources] = useState<Set<symbol>>(() => new Set());
  const busy = busySources.size > 0;
  const registerBusy = useCallback((token: symbol, pending: boolean) => {
    setBusySources((current) => {
      if (current.has(token) === pending) return current;
      const next = new Set(current);
      if (pending) next.add(token);
      else next.delete(token);
      return next;
    });
  }, []);
  const guard = useRef<(() => void) | null>(null);
  const dismiss = onClose;
  const close = () => {
    if (!busy) {
      if (guard.current) guard.current();
      else dismiss();
    }
  };
  const registerGuard = useCallback((handler: (() => void) | null) => {
    guard.current = handler;
  }, []);
  const context = useMemo(
    () => ({ header, footer, registerGuard, dismiss, registerBusy }),
    [header, footer, dismiss, registerGuard, registerBusy],
  );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        showCloseButton={false}
        onCloseAutoFocus={(event) => {
          const target =
            returnFocus?.current ??
            (opener instanceof HTMLElement &&
            opener !== document.body &&
            opener.isConnected
              ? opener
              : null);
          if (target instanceof HTMLElement) {
            event.preventDefault();
            target.focus();
          }
        }}
        className="flow-modal grid h-[min(90dvh,56rem)] max-h-[90dvh] w-[calc(100%-1rem)] max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:p-0"
        onEscapeKeyDown={(event) => {
          event.preventDefault();
          close();
        }}
      >
        <DialogHeader
          closeButton={
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Close"
              onClick={close}
              disabled={busy}
            >
              <X aria-hidden="true" />
            </Button>
          }
        >
          <DialogTitle
            data-form-heading="primary"
            className={showTitle ? "text-section-title-mobile pr-0" : "sr-only"}
          >
            {title}
          </DialogTitle>
          {!showTitle ? <div ref={setHeader} /> : null}
          <DialogDescription className="sr-only">
            Close with the close button, Escape or the backdrop. Actions stay
            below the scrolling form.
          </DialogDescription>
        </DialogHeader>
        <FlowContext.Provider value={context}>
          <DialogBody className="flow-modal-body">{children}</DialogBody>
        </FlowContext.Provider>
        <DialogFooter ref={setFooter} />
      </DialogContent>
    </Dialog>
  );
}
