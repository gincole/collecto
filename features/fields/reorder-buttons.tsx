"use client";

import { ArrowDown, ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ReorderButtons({
  disabled,
  label,
  onDown,
  onUp,
}: {
  disabled?: boolean;
  label: string;
  onDown?: () => void;
  onUp?: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        aria-label={`Move ${label} up`}
        disabled={disabled || !onUp}
        onClick={onUp}
        size="icon"
        type="button"
        variant="ghost"
      >
        <ArrowUp aria-hidden="true" />
      </Button>
      <Button
        aria-label={`Move ${label} down`}
        disabled={disabled || !onDown}
        onClick={onDown}
        size="icon"
        type="button"
        variant="ghost"
      >
        <ArrowDown aria-hidden="true" />
      </Button>
    </div>
  );
}
