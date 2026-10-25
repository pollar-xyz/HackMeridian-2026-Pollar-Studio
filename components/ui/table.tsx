import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}
export function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return (
    <thead
      className={cn("[&_tr]:border-b [&_tr]:border-line", className)}
      {...props}
    />
  );
}
export function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return (
    <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  );
}
export function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "border-b border-line transition-colors hover:bg-background/50",
        className,
      )}
      {...props}
    />
  );
}
export function TableHead({
  className,
  scope = "col",
  ...props
}: ComponentProps<"th">) {
  return (
    <th
      scope={scope}
      className={cn("px-4 py-2 text-left font-medium text-muted", className)}
      {...props}
    />
  );
}
export function TableCell({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-4 py-3 align-middle", className)} {...props} />;
}
export function TableCaption({
  className,
  ...props
}: ComponentProps<"caption">) {
  return (
    <caption className={cn("mt-4 text-sm text-muted", className)} {...props} />
  );
}
