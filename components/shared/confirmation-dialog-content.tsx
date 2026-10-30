import type { ComponentProps } from "react";
import { DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";

export function ConfirmationDialogContent({
  className,
  ...props
}: ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      {...props}
      role="alertdialog"
      data-confirmation-dialog
      className={cn(
        "[&_[data-modal-footer]]:border-0 [&_[data-modal-header]]:border-0",
        className,
      )}
    />
  );
}
