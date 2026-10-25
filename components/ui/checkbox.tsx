"use client";

import type { ComponentProps } from "react";
import { Checkbox as Primitive } from "radix-ui";
import { CheckIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

export function Checkbox({
  className,
  ...props
}: ComponentProps<typeof Primitive.Root>) {
  return (
    <Primitive.Root
      data-slot="checkbox"
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center rounded border border-line bg-surface data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=checked]:text-white disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <Primitive.Indicator>
        <CheckIcon aria-hidden />
      </Primitive.Indicator>
    </Primitive.Root>
  );
}
