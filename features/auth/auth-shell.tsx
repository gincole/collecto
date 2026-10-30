import type { ReactNode } from "react";

type AuthShellProps = { children: ReactNode };

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="px-page-mobile flex min-h-dvh items-center justify-center py-8 sm:py-12">
      <div className="w-full max-w-[27.5rem]">
        <section className="border-border bg-surface rounded-card sm:p-panel border p-5">
          {children}
        </section>
      </div>
    </main>
  );
}
