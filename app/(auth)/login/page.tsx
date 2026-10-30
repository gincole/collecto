import { AuthForm } from "@/features/auth/auth-form";
import { loginAction } from "@/features/auth/actions";
import { AuthShell } from "@/features/auth/auth-shell";
import { getSafeReturnPath } from "@/features/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string }>;
}) {
  const { error, returnTo } = await searchParams;
  const safeReturnTo = returnTo ? getSafeReturnPath(returnTo) : undefined;

  return (
    <AuthShell>
      <div className="mb-8 space-y-2 text-center">
        <p className="text-foreground-muted text-sm font-medium">Collecto</p>
        <h1 className="text-page-title-mobile sm:text-page-title">
          Welcome back
        </h1>
        <p className="text-foreground-muted">
          Log in to continue to your library.
        </p>
      </div>
      {error === "confirmation" ? (
        <p className="text-error mb-5 text-sm" role="alert">
          The confirmation link is invalid or expired. Try logging in or create
          a new account.
        </p>
      ) : null}
      <AuthForm action={loginAction} mode="login" returnTo={safeReturnTo} />
    </AuthShell>
  );
}
