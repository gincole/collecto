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
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getNavigationOpener } from "./navigation-focus";

const InterceptedContext = createContext(false);
export function InterceptedFlows({ children }: { children: ReactNode }) {
  return (
    <InterceptedContext.Provider value>{children}</InterceptedContext.Provider>
  );
}
type Controls = {
  footer: HTMLDivElement | null;
  registerGuard: (handler: (() => void) | null) => void;
  dismiss: () => void;
  setBusy: (busy: boolean) => void;
};
const FlowContext = createContext<Controls | null>(null);

export function useFlowExit(handler: (() => void) | undefined, busy = false) {
  const flow = useContext(FlowContext);
  const registerGuard = flow?.registerGuard;
  const setBusy = flow?.setBusy;
  useEffect(() => {
    registerGuard?.(handler ?? null);
    return () => registerGuard?.(null);
  }, [registerGuard, handler]);
  useEffect(() => {
    setBusy?.(busy);
    return () => setBusy?.(false);
  }, [setBusy, busy]);
  return flow?.dismiss;
}
export function FlowGuard({
  onBack,
  busy,
}: {
  onBack: () => void;
  busy: boolean;
}) {
  useFlowExit(onBack, busy);
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
  const actions = <div className={className}>{children}</div>;
  return flow
    ? flow.footer
      ? createPortal(actions, flow.footer)
      : null
    : actions;
}

export function FlowModal<T extends string>({
  title,
  returnTo,
  returnFocus,
  page = false,
  children,
}: {
  title: string;
  returnTo: Route<T>;
  returnFocus?: RefObject<HTMLButtonElement | null>;
  page?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const intercepted = useContext(InterceptedContext);
  const [opener] = useState(() =>
    typeof document === "undefined"
      ? null
      : ((intercepted ? getNavigationOpener() : null) ??
        document.activeElement),
  );
  const Body = page && !intercepted ? "main" : "div";
  const [footer, setFooter] = useState<HTMLDivElement | null>(null);
  const [busy, setBusy] = useState(false);
  const guard = useRef<(() => void) | null>(null);
  const dismiss = useCallback(() => {
    if (intercepted) router.back();
    else router.replace(returnTo);
  }, [intercepted, router, returnTo]);
  const back = () => {
    if (!busy) {
      if (guard.current) guard.current();
      else dismiss();
    }
  };
  const registerGuard = useCallback((handler: (() => void) | null) => {
    guard.current = handler;
  }, []);
  const context = useMemo(
    () => ({ footer, registerGuard, dismiss, setBusy }),
    [footer, dismiss, registerGuard],
  );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) back();
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
              : document.querySelector<HTMLElement>(
                  "[data-collection-menu-trigger]",
                ));
          if (target instanceof HTMLElement) {
            event.preventDefault();
            target.focus();
          }
        }}
        className="flow-modal grid h-[min(90dvh,56rem)] max-h-[90dvh] w-[calc(100%-1rem)] max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:p-0"
        onEscapeKeyDown={(event) => {
          event.preventDefault();
          back();
        }}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <header className="border-border space-y-2 border-b px-5 py-4">
          <Button type="button" variant="ghost" onClick={back} disabled={busy}>
            <ArrowLeft aria-hidden="true" />
            Back
          </Button>
          <DialogTitle className="text-section-title-mobile sm:text-section-title">
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Use Back to return. Actions stay below the scrolling form.
          </DialogDescription>
        </header>
        <FlowContext.Provider value={context}>
          <Body
            id={page && !intercepted ? "main-content" : undefined}
            tabIndex={page && !intercepted ? -1 : undefined}
            className="flow-modal-body min-h-0 overflow-y-auto overscroll-contain p-5"
          >
            {children}
          </Body>
        </FlowContext.Provider>
        <div
          ref={setFooter}
          data-modal-footer
          className="border-border bg-surface border-t px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] empty:hidden"
        />
      </DialogContent>
    </Dialog>
  );
}
