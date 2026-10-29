import type { LoginCredentials, RegistrationCredentials } from "./schemas";

type ProviderResult = { error: Error | null };

type LoginGateway = {
  signInWithPassword: (
    credentials: LoginCredentials,
  ) => Promise<ProviderResult>;
};

type RegistrationGateway = {
  signUp: (credentials: {
    email: string;
    options?: { emailRedirectTo: string };
    password: string;
  }) => Promise<
    ProviderResult & { data: { session: { access_token: string } | null } }
  >;
};

type LogoutGateway = {
  signOut: (options: { scope: "local" }) => Promise<ProviderResult>;
};

export type AuthOperationResult =
  { status: "success" } | { message: string; status: "confirmation" | "error" };

export async function loginWithPassword(
  credentials: LoginCredentials,
  gateway: LoginGateway,
): Promise<AuthOperationResult> {
  try {
    const { error } = await gateway.signInWithPassword(credentials);

    return error
      ? { message: "Email or password is incorrect.", status: "error" }
      : { status: "success" };
  } catch {
    return { message: "We could not log you in. Try again.", status: "error" };
  }
}

export async function registerWithPassword(
  credentials: RegistrationCredentials,
  gateway: RegistrationGateway,
  emailRedirectTo?: string,
): Promise<AuthOperationResult> {
  try {
    const { data, error } = await gateway.signUp({
      email: credentials.email,
      options: emailRedirectTo ? { emailRedirectTo } : undefined,
      password: credentials.password,
    });

    if (error) {
      return {
        message: "We could not create your account. Try again.",
        status: "error",
      };
    }

    return data.session
      ? { status: "success" }
      : {
          message: "Check your email to continue setting up your account.",
          status: "confirmation",
        };
  } catch {
    return {
      message: "We could not create your account. Try again.",
      status: "error",
    };
  }
}

export async function logoutCurrentSession(
  gateway: LogoutGateway,
): Promise<AuthOperationResult> {
  try {
    const { error } = await gateway.signOut({ scope: "local" });

    return error
      ? { message: "We could not log you out. Try again.", status: "error" }
      : { status: "success" };
  } catch {
    return {
      message: "We could not log you out. Try again.",
      status: "error",
    };
  }
}
