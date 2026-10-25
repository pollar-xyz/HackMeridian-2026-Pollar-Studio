"use client";

import type { ComponentProps } from "react";
import { Collapsible as Primitive } from "radix-ui";
import { cn } from "@/lib/utils";

export const Collapsible = Primitive.Root;
export const CollapsibleTrigger = Primitive.Trigger;
export function CollapsibleContent({
  className,
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Content
      data-slot="collapsible-content"
      className={cn("overflow-hidden", className)}
      {...props}
    />
  );
}
