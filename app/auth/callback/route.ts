import { type NextRequest, NextResponse } from "next/server";

import { getSafeReturnPath } from "@/features/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        const next = getSafeReturnPath(
          request.nextUrl.searchParams.get("next"),
        );
        return NextResponse.redirect(new URL(next, request.url));
      }
    } catch {
      console.error("Authentication confirmation failed", {
        operation: "auth.exchange-code",
      });
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=confirmation", request.url),
  );
}
