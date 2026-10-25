import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-md bg-line motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}
