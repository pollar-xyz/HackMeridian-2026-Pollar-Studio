"use client";

import type { ComponentProps } from "react";
import { Popover as Primitive } from "radix-ui";
import { cn } from "@/lib/utils";

export const Popover = Primitive.Root;
export const PopoverTrigger = Primitive.Trigger;
export const PopoverClose = Primitive.Close;

export function PopoverContent({
  className,
  align = "center",
  sideOffset = 6,
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        align={align}
        sideOffset={sideOffset}
        collisionPadding={8}
        className={cn(
          "z-50 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-surface p-3 text-foreground shadow-lg",
          className,
        )}
        {...props}
      />
    </Primitive.Portal>
  );
}
