import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Alert({
  className,
  variant = "default",
  role = "alert",
  ...props
}: ComponentProps<"div"> & {
  variant?: "default" | "destructive" | "warning";
}) {
  return (
    <div
      data-slot="alert"
      role={role}
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        variant === "destructive"
          ? "border-danger/20 bg-danger-soft text-danger"
          : variant === "warning"
            ? "border-warn-line bg-warn-soft text-warn"
            : "border-accent/20 bg-accent-soft text-accent-strong",
        className,
      )}
      {...props}
    />
  );
}
export function AlertTitle({ className, ...props }: ComponentProps<"h3">) {
  return <h3 className={cn("font-medium", className)} {...props} />;
}
export function AlertDescription({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div className={cn("text-sm leading-relaxed", className)} {...props} />
  );
}
