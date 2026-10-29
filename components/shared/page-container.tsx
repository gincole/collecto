import type { ComponentPropsWithoutRef, ElementType } from "react";

import { cn } from "@/lib/utils/cn";

type PageContainerProps<T extends ElementType = "div"> = {
  as?: T;
  width?: "default" | "wide";
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
        "mx-auto w-full min-w-0 px-4 py-6 sm:px-6 sm:py-8 lg:px-8",
        width === "wide" ? "max-w-7xl" : "max-w-3xl",
        className,
      )}
      {...props}
    />
  );
}

export { PageContainer };
export type { PageContainerProps };
