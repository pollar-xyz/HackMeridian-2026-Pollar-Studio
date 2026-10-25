import type { ComponentProps } from "react";
import { UpdateIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

export function Spinner({
  className,
  ...props
}: ComponentProps<typeof UpdateIcon>) {
  return (
    <UpdateIcon
      role="status"
      aria-label="Loading"
      className={cn(
        "size-5 animate-spin motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}
