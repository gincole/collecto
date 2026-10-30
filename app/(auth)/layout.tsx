import type { ReactNode } from "react";
import { FeedbackRegion } from "@/components/shared/feedback";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <FeedbackRegion />
      {children}
    </>
  );
}
