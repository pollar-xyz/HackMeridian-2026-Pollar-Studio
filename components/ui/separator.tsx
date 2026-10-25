"use client";
import type { ComponentProps } from "react";
import { Separator as Primitive } from "radix-ui";
import { cn } from "@/lib/utils";
export function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: ComponentProps<typeof Primitive.Root>) {
  return (
    <Primitive.Root
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-line",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
}
