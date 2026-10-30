import { CheckCircle2, CircleAlert, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function FeedbackMessage({
  children,
  kind = "success",
}: {
  children: ReactNode;
  kind?: "success" | "error" | "info";
}) {
  const Icon =
    kind === "error" ? CircleAlert : kind === "success" ? CheckCircle2 : Info;
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      aria-atomic="true"
      className={cn(
        "rounded-control flex min-w-0 items-start gap-3 border p-3 text-sm leading-6",
        kind === "error"
          ? "border-error/30 bg-error/5 text-error"
          : kind === "success"
            ? "border-success/30 bg-success/5 text-success"
            : "border-border bg-surface-muted text-foreground",
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
}
