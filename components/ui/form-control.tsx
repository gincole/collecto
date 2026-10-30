import type { ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

const controlClassName =
  "border-control-border bg-surface text-foreground placeholder:text-foreground-muted focus:border-focus focus:ring-focus/20 rounded-control min-h-11 w-full border px-4 text-base outline-none transition-[border-color,box-shadow] focus:ring-4 disabled:cursor-not-allowed disabled:bg-disabled-surface";

function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlClassName, className)} {...props} />;
}

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(controlClassName, "min-h-28 resize-y py-3", className)}
      {...props}
    />
  );
}

function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(controlClassName, className)} {...props} />;
}

export { Input, Select, Textarea };
