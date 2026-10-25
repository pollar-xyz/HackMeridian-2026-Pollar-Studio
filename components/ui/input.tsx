import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const inputStyles =
  "w-full min-w-0 rounded-lg border border-line bg-background px-3 py-2.5 text-foreground transition-colors placeholder:text-muted focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger";
export function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      type={type}
      className={cn(
        type === "checkbox" || type === "radio" || type === "file"
          ? "disabled:cursor-not-allowed disabled:opacity-50"
          : inputStyles,
        className,
      )}
      {...props}
    />
  );
}
