import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/shared/app-header";
import { FeedbackRegion } from "@/components/shared/feedback";
import { logoutAction } from "@/features/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env/server";
import { DemoNotice } from "@/components/shared/demo-notice";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user?.email) {
    redirect("/login");
  }

  return (
    <>
      <AppHeader email={data.user.email} logoutAction={logoutAction} />
      {serverEnv.DEMO_USER_EMAIL?.toLowerCase() ===
      data.user.email.toLowerCase() ? (
        <DemoNotice />
      ) : null}
      <FeedbackRegion />
      {children}
    </>
  );
}
