"use client";

import { ErrorState } from "@/components/shared";
import { AuthShell } from "@/features/auth/auth-shell";

export default function AuthError({ reset }: { reset: () => void }) {
  return (
    <AuthShell>
      <ErrorState
        className="min-h-0 border-0 p-0 shadow-none"
        description="Authentication could not be completed. Try again."
        onRetry={reset}
        title="Something went wrong"
      />
    </AuthShell>
  );
}
