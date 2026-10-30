import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Props = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  children: string;
  as?: "span" | "p" | "h1" | "h2" | "h3" | "h4" | "dt";
};
export function DisplayName({
  as: Tag = "span",
  children,
  className,
  ...props
}: Props) {
  return (
    <Tag
      title={children}
      {...props}
      data-display-name
      className={cn("block max-w-full min-w-0 truncate", className)}
    >
      {children}
    </Tag>
  );
}
