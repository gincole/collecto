import type { Route } from "next";

export const DEFAULT_AUTHENTICATED_PATH = "/library";

const protectedPathPrefixes = ["/library", "/collections"] as const;

function matchesPathPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isProtectedPath(pathname: string) {
  return protectedPathPrefixes.some((prefix) =>
    matchesPathPrefix(pathname, prefix),
  );
}

export function getSafeReturnPath(returnTo: string | null | undefined): Route {
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return DEFAULT_AUTHENTICATED_PATH;
  }

  try {
    const decodedReturnTo = decodeURIComponent(returnTo);

    if (decodedReturnTo.includes("\\") || decodedReturnTo.startsWith("//")) {
      return DEFAULT_AUTHENTICATED_PATH;
    }

    const baseUrl = new URL("https://return-path.invalid");
    const parsedUrl = new URL(returnTo, baseUrl);

    if (
      parsedUrl.origin !== baseUrl.origin ||
      !isProtectedPath(parsedUrl.pathname)
    ) {
      return DEFAULT_AUTHENTICATED_PATH;
    }

    // The path is promoted only after same-origin and protected-route validation.
    return `${parsedUrl.pathname}${parsedUrl.search}` as Route;
  } catch {
    return DEFAULT_AUTHENTICATED_PATH;
  }
}

export function createLoginUrl(requestUrl: URL) {
  const loginUrl = new URL("/login", requestUrl);
  const returnTo = getSafeReturnPath(
    `${requestUrl.pathname}${requestUrl.search}`,
  );

  loginUrl.searchParams.set("returnTo", returnTo);
  return loginUrl;
}
