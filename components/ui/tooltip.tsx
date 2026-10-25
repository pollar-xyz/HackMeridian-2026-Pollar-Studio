"use client";

import type { ComponentProps } from "react";
import { Tooltip as Primitive } from "radix-ui";
import { cn } from "@/lib/utils";

export const TooltipProvider = Primitive.Provider;
export const Tooltip = Primitive.Root;
export const TooltipTrigger = Primitive.Trigger;

export function TooltipContent({
  className,
  sideOffset = 6,
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        sideOffset={sideOffset}
        collisionPadding={8}
        className={cn(
          "z-50 max-w-72 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-foreground shadow-lg",
          className,
        )}
        {...props}
      />
    </Primitive.Portal>
  );
}
