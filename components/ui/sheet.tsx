"use client";

import { useRef, type ComponentProps } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogTitle,
  DialogDescription,
  DialogContent,
} from "./dialog";
import { cn } from "@/lib/utils";

export {
  Dialog as Sheet,
  DialogTrigger as SheetTrigger,
  DialogClose as SheetClose,
  DialogTitle as SheetTitle,
  DialogDescription as SheetDescription,
};
export function SheetContent({
  side = "right",
  className,
  ...props
}: ComponentProps<typeof DialogContent> & {
  side?: "left" | "right" | "bottom";
}) {
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <DialogContent
      onOpenAutoFocus={() => {
        returnFocus.current =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
      }}
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        if (returnFocus.current?.isConnected) returnFocus.current.focus();
      }}
      data-slot="sheet-content"
      data-motion="sheet"
      data-side={side}
      className={cn(
        side === "bottom"
          ? "bottom-0 top-auto max-h-[92dvh] translate-y-0 rounded-b-none rounded-t-2xl"
          : "top-0 h-dvh max-h-dvh w-72 max-w-[85vw] translate-x-0 translate-y-0 rounded-none border-0 p-0",
        side === "left" && "left-0",
        side === "right" && "left-auto right-0",
        className,
      )}
      {...props}
    />
  );
}

export function SheetHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-2", className)} {...props} />;
}
