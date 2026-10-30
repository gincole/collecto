import { Trash2 } from "lucide-react";
import type { Route } from "next";
import Link from "@/components/shared/navigation-link";
import {
  Button,
  buttonVariants,
  type ButtonProps,
} from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type DeleteButtonProps = Omit<
  ButtonProps,
  "variant" | "size" | "children" | "asChild"
> & { confirm?: boolean; pending?: boolean; checking?: boolean };

export function DeleteButton({
  confirm = false,
  pending = false,
  checking = false,
  disabled,
  type = "button",
  ...props
}: DeleteButtonProps) {
  return (
    <Button
      {...props}
      type={type}
      size="default"
      variant={confirm ? "destructive" : "destructive-outline"}
      disabled={disabled || pending || checking}
      aria-busy={pending || checking || undefined}
    >
      <Trash2 aria-hidden="true" />
      {checking
        ? "Checking…"
        : pending
          ? "Deleting…"
          : confirm
            ? "Delete permanently"
            : "Delete"}
    </Button>
  );
}

export function DeleteMenuLink<T extends string>({
  href,
  "aria-label": label,
}: {
  href: Route<T>;
  "aria-label": string;
}) {
  return (
    <Link
      aria-label={label}
      href={href}
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "text-destructive hover:bg-destructive/5 w-full justify-start",
      )}
    >
      <Trash2 aria-hidden="true" />
      Delete
    </Link>
  );
}
