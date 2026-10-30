"use client";
import {
  Children,
  isValidElement,
  useState,
  useRef,
  useId,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./dropdown-menu";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils/cn";

const controlClassName =
  "border-control-border bg-surface text-foreground placeholder:text-foreground-muted focus:border-focus focus:ring-focus/20 rounded-control min-h-11 w-full min-w-0 max-w-full border px-4 text-input outline-none transition-[border-color,box-shadow] focus:ring-4 disabled:cursor-not-allowed disabled:bg-disabled-surface";

function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        controlClassName,
        type === "date" && "native-date h-11",
        className,
      )}
      {...props}
    />
  );
}

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(controlClassName, "min-h-28 resize-y py-3", className)}
      {...props}
    />
  );
}

type SelectProps = Omit<
  ComponentProps<"select">,
  "onChange" | "multiple" | "ref"
> & {
  onChange?: (event: { target: { value: string } }) => void;
  optionIcon?: (value: string) => ReactNode;
};
function Select({
  className,
  children,
  value,
  defaultValue,
  onChange,
  optionIcon,
  name,
  disabled,
  required,
  id,
  "aria-label": label,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
}: SelectProps) {
  const options = Children.toArray(children).filter(
    isValidElement<ComponentProps<"option">>,
  );
  const [localValue, setLocalValue] = useState(String(defaultValue ?? ""));
  const selected = String(value ?? localValue);
  const [open, setOpen] = useState(false);
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const search = useRef({ text: "", time: 0 });
  function choose(next: string) {
    setLocalValue(next);
    onChange?.({ target: { value: next } });
  }
  const selectedOption = options.find(
    (option) =>
      String(option.props.value ?? option.props.children) === selected,
  );
  return (
    <>
      {name ? (
        <input type="hidden" name={name} value={selected} disabled={disabled} />
      ) : null}
      <DropdownMenu
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) search.current = { text: "", time: 0 };
        }}
      >
        <DropdownMenuTrigger
          role="combobox"
          aria-haspopup="listbox"
          aria-required={required}
          data-field-name={name}
          id={triggerId}
          aria-label={label}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          disabled={disabled}
          onKeyDown={(event) => {
            if (open) return;
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              return;
            }
            if (
              event.ctrlKey ||
              event.altKey ||
              event.metaKey ||
              event.key.length !== 1
            )
              return;
            const now = Date.now();
            const previous =
              now - search.current.time > 1000 ? "" : search.current.text;
            if (event.key === " " && !previous) return;
            event.preventDefault();
            const text = (previous + event.key).toLocaleLowerCase();
            search.current = { text, time: now };
            const query = [...text].every((char) => char === text[0])
              ? text[0]
              : text;
            const enabled = options.filter((option) => !option.props.disabled);
            const index = enabled.findIndex(
              (option) =>
                String(option.props.value ?? option.props.children) ===
                selected,
            );
            const start = Math.max(0, index + (query.length === 1 ? 1 : 0));
            const ordered = [
              ...enabled.slice(start),
              ...enabled.slice(0, start),
            ];
            const match = ordered.find((option) =>
              String(option.props.children)
                .trim()
                .toLocaleLowerCase()
                .startsWith(query),
            );
            if (match) {
              const next = String(match.props.value ?? match.props.children);
              if (next !== selected) choose(next);
            }
          }}
          className={cn(
            controlClassName,
            "flex items-center justify-between gap-2 text-left [&>span:first-child]:truncate",
            className,
          )}
        >
          <span className="inline-flex min-w-0 items-center gap-2">
            {optionIcon?.(selected)}
            <span className="min-w-0 truncate">
              {selectedOption?.props.children ?? "Choose an option"}
            </span>
          </span>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          role="listbox"
          aria-labelledby={triggerId}
          align="start"
          className="z-[90] max-h-[min(var(--radix-dropdown-menu-content-available-height),20rem)] min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto"
          onFocus={(event) => {
            if (event.target !== event.currentTarget) return;
            event.preventDefault();
            const target =
              event.currentTarget.querySelector<HTMLElement>(
                '[role="option"][aria-selected="true"]:not([data-disabled])',
              ) ??
              event.currentTarget.querySelector<HTMLElement>(
                '[role="option"]:not([data-disabled])',
              );
            target?.focus();
          }}
        >
          {options.map((option, index) => {
            const optionValue = String(
              option.props.value ?? option.props.children,
            );
            return (
              <DropdownMenuItem
                key={`${optionValue}-${index}`}
                role="option"
                aria-selected={selected === optionValue}
                data-value={optionValue}
                disabled={option.props.disabled}
                className="text-ui relative min-w-0 py-2 pr-8"
                onSelect={() => {
                  choose(optionValue);
                }}
              >
                {optionIcon?.(optionValue)}
                <span
                  className="min-w-0 flex-1 truncate"
                  title={
                    typeof option.props.children === "string"
                      ? option.props.children
                      : undefined
                  }
                >
                  {option.props.children}
                </span>
                {selected === optionValue ? (
                  <Check
                    aria-hidden="true"
                    className="absolute right-2 size-4"
                  />
                ) : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export { Input, Select, Textarea };
