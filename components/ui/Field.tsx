import type { ComponentProps } from "react";

const INPUT = "rounded-lg border border-line bg-background px-3 py-2.5 text-foreground outline-none focus:border-accent";

export function Field({ label, hint, className = "", ...rest }: ComponentProps<"input"> & { label: string; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <input className={`${INPUT} ${className}`} {...rest} />
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

export const inputClass = INPUT;
