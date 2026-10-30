"use client";
import { Children, isValidElement, useState, type ComponentProps } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils/cn";

const controlClassName =
  "border-control-border bg-surface text-foreground placeholder:text-foreground-muted focus:border-focus focus:ring-focus/20 rounded-control min-h-11 w-full min-w-0 border px-4 text-base outline-none transition-[border-color,box-shadow] focus:ring-4 disabled:cursor-not-allowed disabled:bg-disabled-surface";

function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlClassName, className)} {...props} />;
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
> & { onChange?: (event: { target: { value: string } }) => void };
function Select({
  className,
  children,
  value,
  defaultValue,
  onChange,
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
  const emptyValue = "__collecto_empty__";
  const selected = String(value ?? localValue);
  return (
    <>
      {name ? (
        <input type="hidden" name={name} value={selected} disabled={disabled} />
      ) : null}
      <SelectPrimitive.Root
        value={selected || emptyValue}
        onValueChange={(next) => {
          const normalized = next === emptyValue ? "" : next;
          setLocalValue(normalized);
          onChange?.({ target: { value: normalized } });
        }}
        disabled={disabled}
        required={required}
      >
        <SelectPrimitive.Trigger
          // Submission uses our controlled hidden input; action resets must preserve drafts.
          form=""
          data-field-name={name}
          id={id}
          aria-label={label}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className={cn(
            controlClassName,
            "flex items-center justify-between gap-2 text-left [&>span:first-child]:truncate",
            className,
          )}
        >
          <SelectPrimitive.Value />
          <SelectPrimitive.Icon>
            <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={6}
            collisionPadding={12}
            className="border-border bg-surface shadow-sheet rounded-control z-[90] max-h-[min(var(--radix-select-content-available-height),20rem)] max-w-[calc(100vw-1.5rem)] min-w-[var(--radix-select-trigger-width)] overflow-hidden border p-1"
          >
            <SelectPrimitive.Viewport>
              {options.map((option, index) => (
                <SelectPrimitive.Item
                  data-value={String(
                    option.props.value ?? option.props.children,
                  )}
                  key={`${option.props.value}-${index}`}
                  value={
                    String(option.props.value ?? option.props.children) ||
                    emptyValue
                  }
                  disabled={option.props.disabled}
                  className="touch-target rounded-control data-[highlighted]:bg-surface-muted relative flex cursor-default items-center gap-2 py-2 pr-8 pl-3 text-base outline-none data-[disabled]:opacity-50"
                >
                  <SelectPrimitive.ItemText>
                    {option.props.children}
                  </SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-2">
                    <Check aria-hidden="true" className="size-4" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </>
  );
}

export { Input, Select, Textarea };
