"use client";

import { Toaster, toast as notify } from "sonner";

export function toast(message: string, kind: "success" | "error" = "success") {
  return notify[kind](message);
}

export function ToastViewport() {
  return (
    <Toaster
      position="bottom-center"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!rounded-xl !border-line !bg-surface !text-foreground !shadow-lg",
          description: "!text-muted",
          closeButton: "!border-line !bg-surface !text-foreground",
        },
      }}
    />
  );
}
