"use client";

import type { ComponentProps } from "react";
import { ToggleGroup as Primitive } from "radix-ui";
import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip";
import { cn } from "@/lib/utils";

export function ToggleGroup({
  className,
  ...props
}: ComponentProps<typeof Primitive.Root>) {
  return (
    <Primitive.Root
      data-slot="toggle-group-root"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  );
}
export function ToggleGroupItem({
  title,
  className,
  ...props
}: ComponentProps<typeof Primitive.Item>) {
  const item = (
    <Primitive.Item
      data-slot="toggle-group-item"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors data-[state=on]:bg-accent-soft data-[state=on]:text-accent disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
  return title ? (
    <Tooltip>
      <TooltipTrigger asChild>{item}</TooltipTrigger>
      <TooltipContent>{title}</TooltipContent>
    </Tooltip>
  ) : (
    item
  );
}
