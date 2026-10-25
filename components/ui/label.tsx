"use client";
import type { ComponentProps } from "react";
import { Label as Primitive } from "radix-ui";
import { cn } from "@/lib/utils";
export function Label({
  className,
  ...props
}: ComponentProps<typeof Primitive.Root>) {
  return (
    <Primitive.Root
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
