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
  // Normal document flow keeps notifications clear of sticky Save and navigation controls.
  return (
    <div className="max-w-page px-page-mobile sm:px-page-tablet lg:px-page-desktop mx-auto w-full min-w-0 pt-4">
      <div className="relative pr-12">
        <FeedbackMessage key={notice.id} kind={notice.kind}>
          {notice.message}
        </FeedbackMessage>
        <button
          aria-label="Dismiss notification"
          className="touch-target focus-ring hover:bg-surface-muted rounded-control absolute top-0 right-0 flex items-center justify-center"
          onClick={dismiss}
          type="button"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>
    </div>
  );
}
