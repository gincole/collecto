import type { ComponentPropsWithoutRef, ElementType } from "react";

import { cn } from "@/lib/utils/cn";

type PageContainerProps<T extends ElementType = "div"> = {
  as?: T;
  width?: "default" | "wide" | "form";
} & Omit<ComponentPropsWithoutRef<T>, "as">;

function PageContainer<T extends ElementType = "div">({
  as,
  className,
  width = "wide",
  ...props
}: PageContainerProps<T>) {
  const Component = as ?? "div";

  return (
    <Component
      className={cn(
        "px-page-mobile sm:px-page-tablet lg:px-page-desktop mx-auto w-full min-w-0 py-6 sm:py-8",
        width === "wide"
          ? "max-w-page"
          : width === "form"
            ? "max-w-form"
            : "max-w-narrow",
        className,
      )}
      {...props}
    />
  );
}

export { PageContainer };
export type { PageContainerProps };
