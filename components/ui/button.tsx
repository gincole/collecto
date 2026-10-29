import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold whitespace-nowrap transition-[color,background-color,border-color,opacity,transform] outline-none active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-disabled-surface disabled:text-disabled-foreground disabled:opacity-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "h-11",
        icon: "size-11 px-0",
        lg: "h-12 px-6",
        sm: "h-11 px-3",
      },
      variant: {
        default:
          "bg-foreground text-surface hover:opacity-85 focus-visible:ring-focus",
        destructive:
          "bg-destructive text-surface hover:opacity-85 focus-visible:ring-focus",
        ghost:
          "bg-transparent text-foreground hover:bg-surface-muted focus-visible:ring-focus",
        outline:
          "border border-border bg-surface text-foreground hover:bg-surface-muted focus-visible:ring-focus",
      },
    },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  asChild = false,
  className,
  size,
  variant,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";

  return (
    <Component
      className={cn(buttonVariants({ className, size, variant }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
