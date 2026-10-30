"use client";
import { Button } from "./button";
import { cn } from "@/lib/utils/cn";

export function SegmentedControl({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const selected = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex min-w-0 flex-wrap justify-end gap-1"
    >
      {options.map((option, index) => (
        <Button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          tabIndex={index === selected ? 0 : -1}
          data-value={option.value}
          data-choice-index={index}
          disabled={disabled}
          variant="outline"
          className={cn(
            "rounded-pill min-w-11 px-3",
            option.value === value && "border-selection-border bg-art-lavender",
          )}
          onClick={() => onChange(option.value)}
          onKeyDown={(event) => {
            const next =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? options.length - 1
                  : ["ArrowRight", "ArrowDown"].includes(event.key)
                    ? (index + 1) % options.length
                    : ["ArrowLeft", "ArrowUp"].includes(event.key)
                      ? (index + options.length - 1) % options.length
                      : undefined;
            if (next === undefined || !options[next]) return;
            event.preventDefault();
            onChange(options[next].value);
            event.currentTarget.parentElement
              ?.querySelector<HTMLButtonElement>(
                `[data-choice-index="${next}"]`,
              )
              ?.focus();
          }}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
