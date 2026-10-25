import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { inputStyles } from "./input";

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(inputStyles, "min-h-24 resize-y", className)}
      {...props}
    />
  );
}
