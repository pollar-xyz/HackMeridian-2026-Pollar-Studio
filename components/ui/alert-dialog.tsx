"use client";

import type { ComponentProps } from "react";
import { AlertDialog as Primitive } from "radix-ui";
import { cn } from "@/lib/utils";

export const AlertDialog = Primitive.Root;
export const AlertDialogTrigger = Primitive.Trigger;
export function AlertDialogTitle({
  className,
  ...props
}: ComponentProps<typeof Primitive.Title>) {
  return (
    <Primitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-base font-semibold", className)}
      {...props}
    />
  );
}
export function AlertDialogDescription({
  className,
  ...props
}: ComponentProps<typeof Primitive.Description>) {
  return (
    <Primitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-sm leading-relaxed text-muted", className)}
      {...props}
    />
  );
}
export const AlertDialogCancel = Primitive.Cancel;
export const AlertDialogAction = Primitive.Action;

export function AlertDialogContent({
  className,
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Overlay className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-[2px] dialog-overlay-motion" />
      <Primitive.Content
        data-motion="dialog"
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid max-h-[90dvh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-2xl border border-line bg-surface p-5 text-foreground shadow-xl",
          className,
        )}
        {...props}
      />
    </Primitive.Portal>
  );
}
