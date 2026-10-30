import type { ReactNode } from "react";
import { HistoryBack } from "@/components/shared/history-back";

type AuthShellProps = { children: ReactNode; showBack?: boolean };

export function AuthShell({ children, showBack = false }: AuthShellProps) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="page-insets page-block-space flex min-h-dvh items-center justify-center"
    >
      <div className="w-full max-w-[27.5rem]">
        {showBack ? <HistoryBack /> : null}
        <section className="border-border bg-surface rounded-card sm:p-panel border p-5">
          {children}
        </section>
      </div>
    </main>
  );
}
