"use client";

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { feedbackMessage } from "./feedback-messages";
import { FeedbackMessage } from "./feedback-message";

type Notice = {
  id: number;
  message: string;
  kind: "success" | "error" | "info";
};
type Notify = (message: string, kind?: Notice["kind"]) => void;
const Context = createContext<{
  notice?: Notice;
  notify: Notify;
  dismiss: () => void;
}>({ notify: () => {}, dismiss: () => {} });

function NavigationFeedback() {
  const pathname = usePathname();
  const search = useSearchParams();
  const notify = useFeedback();
  useEffect(() => {
    const code = search.get("feedback");
    const message = feedbackMessage(code);
    if (!code) return;
    if (message) notify(message);
    // Consume the notice without another request or replay on refresh/back.
    const url = new URL(window.location.href);
    url.searchParams.delete("feedback");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [pathname, search, notify]);
  return null;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<Notice>();
  const notify = useCallback<Notify>(
    (message, kind = "success") =>
      setNotice((current) => ({ id: (current?.id ?? 0) + 1, message, kind })),
    [],
  );
  const dismiss = useCallback(() => setNotice(undefined), []);
  return (
    <Context.Provider value={{ notice, notify, dismiss }}>
      <Suspense fallback={null}>
        <NavigationFeedback />
      </Suspense>
      {children}
    </Context.Provider>
  );
}

export function useFeedback() {
  return useContext(Context).notify;
}

export function FeedbackRegion() {
  const { notice, dismiss } = useContext(Context);
  if (!notice) return null;
  return <ToastNotice key={notice.id} notice={notice} dismiss={dismiss} />;
}

function ToastNotice({
  notice,
  dismiss,
}: {
  notice: Notice;
  dismiss: () => void;
}) {
  const [closing, setClosing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [windowBlurred, setWindowBlurred] = useState(false);
  useEffect(() => {
    const blur = () => setWindowBlurred(true);
    const focus = () => setWindowBlurred(false);
    window.addEventListener("blur", blur);
    window.addEventListener("focus", focus);
    return () => {
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", focus);
    };
  }, []);
  useEffect(() => {
    if (closing) {
      const exit = window.setTimeout(dismiss, 180);
      return () => window.clearTimeout(exit);
    }
    if (hovered || focused || windowBlurred) return;
    const timer = window.setTimeout(
      () => setClosing(true),
      notice.kind === "error" ? 6000 : 4000,
    );
    return () => window.clearTimeout(timer);
  }, [closing, hovered, focused, windowBlurred, notice.kind, dismiss]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(5rem+env(safe-area-inset-top))] z-[70] flex justify-center px-4">
      <div
        className="notification-toast pointer-events-auto relative w-full max-w-md"
        data-testid="notification-toast"
        data-state={closing ? "closed" : "open"}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setFocused(false);
        }}
      >
        <FeedbackMessage
          kind={notice.kind}
          className="bg-surface shadow-sheet pr-14"
        >
          {notice.message}
        </FeedbackMessage>
        <button
          aria-label="Dismiss notification"
          className="touch-target focus-ring hover:bg-surface-muted rounded-control absolute top-1 right-1 flex items-center justify-center"
          disabled={closing}
          onClick={() => setClosing(true)}
          type="button"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>
    </div>
  );
}
