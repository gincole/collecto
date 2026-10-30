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
      className="grid w-full min-w-0 auto-cols-fr grid-flow-col gap-0.5 sm:gap-1"
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
            "w-full min-w-0 px-1 sm:px-3",
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
