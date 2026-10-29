"use server";

import { redirect } from "next/navigation";

import { getSafeReturnPath } from "@/features/auth";
import type { AuthActionState } from "@/features/auth/auth-form";
import {
  loginCredentialsSchema,
  registrationCredentialsSchema,
} from "@/features/auth/schemas";
import {
  loginWithPassword,
  logoutCurrentSession,
  registerWithPassword,
} from "@/features/auth/service";
import { createClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env/server";

function firstFieldErrors(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}) {
  const fieldErrors = error.flatten().fieldErrors;

  return {
    confirmPassword: fieldErrors.confirmPassword?.[0],
    email: fieldErrors.email?.[0],
    password: fieldErrors.password?.[0],
  };
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const credentials = loginCredentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!credentials.success) {
    return {
      fieldErrors: firstFieldErrors(credentials.error),
      status: "error",
    };
  }

  const supabase = await createClient();
  const result = await loginWithPassword(credentials.data, supabase.auth);

  if (result.status !== "success") {
    return result;
  }

  const returnTo = formData.get("returnTo");
  redirect(getSafeReturnPath(typeof returnTo === "string" ? returnTo : null));
}

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const credentials = registrationCredentialsSchema.safeParse({
    confirmPassword: formData.get("confirmPassword"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!credentials.success) {
    return {
      fieldErrors: firstFieldErrors(credentials.error),
      status: "error",
    };
  }

  const supabase = await createClient();
  const confirmationUrl = new URL(
    "/auth/callback",
    serverEnv.NEXT_PUBLIC_SITE_URL,
  );
  const returnTo = formData.get("returnTo");
  confirmationUrl.searchParams.set(
    "next",
    getSafeReturnPath(typeof returnTo === "string" ? returnTo : null),
  );
  const result = await registerWithPassword(
    credentials.data,
    supabase.auth,
    confirmationUrl.toString(),
  );

  if (result.status !== "success") {
    return result;
  }

  redirect(getSafeReturnPath(typeof returnTo === "string" ? returnTo : null));
}

export async function logoutAction(): Promise<AuthActionState> {
  const supabase = await createClient();
  const result = await logoutCurrentSession(supabase.auth);

  if (result.status === "error") {
    return result;
  }

  redirect("/login");
}
