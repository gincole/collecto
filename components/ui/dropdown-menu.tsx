"use client";
import * as Menu from "@radix-ui/react-dropdown-menu";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export function DropdownMenu(props: ComponentProps<typeof Menu.Root>) {
  // Menus can open modal editors without competing body pointer locks.
  return <Menu.Root modal={false} {...props} />;
}
export const DropdownMenuTrigger = Menu.Trigger;
export const DropdownMenuLabel = Menu.Label;
export function DropdownMenuContent({
  className,
  ...props
}: ComponentProps<typeof Menu.Content>) {
  return (
    <Menu.Portal>
      <Menu.Content
        sideOffset={6}
        align="end"
        collisionPadding={12}
        className={cn(
          "border-border bg-surface shadow-sheet rounded-control z-[80] max-w-[calc(100vw-1.5rem)] min-w-52 border p-1",
          className,
        )}
        {...props}
      />
    </Menu.Portal>
  );
}
export function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<typeof Menu.Item>) {
  return (
    <Menu.Item
      className={cn(
        "touch-target rounded-control focus:bg-surface-muted data-[highlighted]:bg-surface-muted flex cursor-default items-center gap-2 px-3 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}
