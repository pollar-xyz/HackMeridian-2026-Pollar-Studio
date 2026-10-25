"use client";

import type { ComponentProps } from "react";
import { RadioGroup as Primitive } from "radix-ui";
import { cn } from "@/lib/utils";

export function RadioGroup({
  className,
  ...props
}: ComponentProps<typeof Primitive.Root>) {
  return (
    <Primitive.Root
      data-slot="radio-group-root"
      className={cn("grid gap-2", className)}
      {...props}
    />
  );
}
export function RadioGroupItem({
  className,
  ...props
}: ComponentProps<typeof Primitive.Item>) {
  return (
    <Primitive.Item
      data-slot="radio-group-item"
      className={cn(
        "inline-flex items-center justify-center rounded-md disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
export const RadioGroupIndicator = Primitive.Indicator;
