import type { ReactNode } from "react";

type AuthShellProps = { children: ReactNode };

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="px-page-mobile flex min-h-dvh items-center justify-center py-8 sm:py-12">
      <div className="w-full max-w-[27.5rem]">
        <div aria-hidden="true" className="mb-6 flex justify-center gap-2">
          <span className="bg-art-lavender rounded-pill size-3" />
          <span className="bg-art-sage rounded-pill size-3" />
          <span className="bg-art-peach rounded-pill size-3" />
        </div>
        <section className="border-border bg-surface shadow-card rounded-dialog border p-6 sm:p-8">
          {children}
        </section>
      </div>
    </main>
  );
}
