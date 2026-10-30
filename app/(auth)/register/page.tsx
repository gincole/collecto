import { registerAction } from "@/features/auth/actions";
import { AuthForm } from "@/features/auth/auth-form";
import { AuthShell } from "@/features/auth/auth-shell";
import { getSafeReturnPath } from "@/features/auth";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  const safeReturnTo = returnTo ? getSafeReturnPath(returnTo) : undefined;

  return (
    <AuthShell>
      <div className="mb-8 space-y-2 text-center">
        <p className="text-foreground-muted text-sm font-medium">
          little things.
        </p>
        <h1 className="text-page-title-mobile sm:text-page-title">
          Create your account
        </h1>
        <p className="text-foreground-muted">
          Start a private library for the things you keep.
        </p>
      </div>
      <AuthForm
        action={registerAction}
        mode="register"
        returnTo={safeReturnTo}
      />
    </AuthShell>
  );
}
