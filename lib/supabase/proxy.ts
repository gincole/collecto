import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { createLoginUrl, isProtectedPath } from "@/features/auth";
import { serverEnv } from "@/lib/env/server";
import type { Database } from "@/lib/supabase/database.types";

function copyResponseCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  return target;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, options, value }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const claimsResult = await supabase.auth.getClaims();

  if (!claimsResult.data?.claims && isProtectedPath(request.nextUrl.pathname)) {
    return copyResponseCookies(
      response,
      NextResponse.redirect(createLoginUrl(request.nextUrl)),
    );
  }

  return response;
}
