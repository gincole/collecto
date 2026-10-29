import { LoadingSkeleton } from "@/components/shared";
import { AuthShell } from "@/features/auth/auth-shell";

export default function AuthLoading() {
  return (
    <AuthShell>
      <LoadingSkeleton label="Loading authentication" lines={5} />
    </AuthShell>
  );
}
