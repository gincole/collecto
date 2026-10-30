"use client";
import * as Menu from "@radix-ui/react-dropdown-menu";
import {
  createContext,
  useContext,
  useState,
  type ComponentProps,
} from "react";
import { useDialogContainer } from "./dialog";
import { cn } from "@/lib/utils/cn";

const OpenContext = createContext(false);
export function DropdownMenu({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  ...props
}: ComponentProps<typeof Menu.Root>) {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? localOpen;
  return (
    <OpenContext.Provider value={open}>
      <Menu.Root
        modal={false}
        {...props}
        open={open}
        onOpenChange={(next) => {
          setLocalOpen(next);
          onOpenChange?.(next);
        }}
      />
    </OpenContext.Provider>
  );
}
export const DropdownMenuTrigger = Menu.Trigger;
export const DropdownMenuLabel = Menu.Label;
export function DropdownMenuContent({
  className,
  ...props
}: ComponentProps<typeof Menu.Content>) {
  const open = useContext(OpenContext);
  const container = useDialogContainer();
  return (
    <Menu.Portal container={container ?? undefined}>
      <Menu.Content
        aria-hidden={!open || undefined}
        inert={!open}
        sideOffset={6}
        align="end"
        collisionPadding={12}
        collisionBoundary={container ?? undefined}
        className={cn(
          "dropdown-content border-border bg-surface shadow-sheet rounded-control z-[80] max-w-[calc(100vw-1.5rem)] min-w-52 border p-1",
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
        "touch-target rounded-control focus:bg-surface-muted data-[highlighted]:bg-surface-muted text-ui flex cursor-default items-center gap-2 px-3 outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}
