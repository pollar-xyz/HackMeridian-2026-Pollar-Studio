"use client";

import { useId, type ComponentProps } from "react";
import { Label } from "./label";
import { Input, inputStyles } from "./input";

export function Field({
  label,
  hint,
  error,
  id,
  className = "",
  ...rest
}: ComponentProps<"input"> & { label: string; hint?: string; error?: string }) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const describedBy =
    [
      rest["aria-describedby"],
      hint && `${fieldId}-hint`,
      error && `${fieldId}-error`,
    ]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <div className="flex flex-col gap-2 text-sm">
      <Label htmlFor={fieldId} className="text-muted">
        {label}
      </Label>
      <Input
        {...rest}
        id={fieldId}
        aria-invalid={error ? true : rest["aria-invalid"]}
        aria-describedby={describedBy}
        className={className}
      />
      {hint && (
        <p id={`${fieldId}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${fieldId}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
export const inputClass = inputStyles;
