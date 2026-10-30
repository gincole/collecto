"use client";
export function RequiredControl({
  disabled,
  required,
  setRequired,
}: {
  disabled?: boolean;
  required: boolean;
  setRequired: (required: boolean) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="flex min-h-11 items-center gap-3 font-semibold">
        <input
          checked={required}
          className="accent-selection-border size-5"
          disabled={disabled}
          onChange={(event) => setRequired(event.target.checked)}
          type="checkbox"
        />
        Required field
      </label>
      <p className="text-foreground-muted text-sm">
        Existing Items may remain empty. The Field is required the next time an
        Item is saved.
      </p>
    </div>
  );
}
