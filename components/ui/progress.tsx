"use client";

import type { ComponentProps } from "react";
import { Progress as Primitive } from "radix-ui";
import { cn } from "@/lib/utils";

export function Progress({
  className,
  value = 0,
  indicatorClassName,
  ...props
}: ComponentProps<typeof Primitive.Root> & { indicatorClassName?: string }) {
  const percent = Math.min(100, Math.max(0, value ?? 0));
  return (
    <Primitive.Root
      data-slot="progress"
      value={value}
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-line",
        className,
      )}
      {...props}
    >
      <Primitive.Indicator
        className={cn(
          "h-full w-full rounded-full bg-accent transition-transform motion-reduce:transition-none",
          indicatorClassName,
        )}
        style={{ transform: `translateX(-${100 - percent}%)` }}
      />
    </Primitive.Root>
  );
}
