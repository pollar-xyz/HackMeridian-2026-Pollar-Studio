"use client";

import { useRef, useState } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { useT } from "@/lib/i18n";

interface ModalProps {
  open: boolean;
  title?: string;
  onClose?: () => void;
  size?: "sm" | "lg" | "xl";
  bare?: boolean;
  children: React.ReactNode;
}

export function Modal({
  open,
  title,
  onClose,
  size = "sm",
  bare,
  children,
}: ModalProps) {
  const t = useT();
  // Keep the last open content while Radix plays the exit animation.
  const [lastChildren, setLastChildren] = useState(children);
  if (open && lastChildren !== children) setLastChildren(children);
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
    >
      <DialogContent
        aria-describedby={undefined}
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
        onEscapeKeyDown={(event) => {
          if (!onClose) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (!onClose) event.preventDefault();
        }}
        className={`${bare ? "p-0 overflow-hidden" : ""} ${size === "xl" ? "max-w-5xl" : size === "lg" ? "max-w-2xl" : "max-w-sm"}`}
      >
        <DialogTitle
          className={bare ? "sr-only" : "mb-3 pr-8 text-base font-semibold"}
        >
          {title ?? t("Details")}
        </DialogTitle>
        {!bare && onClose && (
          <DialogClose
            aria-label={t("Close")}
            className="absolute right-4 top-4 rounded-md p-1.5 text-muted hover:bg-background"
          >
            <Cross2Icon />
          </DialogClose>
        )}
        {open ? children : lastChildren}
      </DialogContent>
    </Dialog>
  );
}

export { Spinner } from "@/components/ui/spinner";
