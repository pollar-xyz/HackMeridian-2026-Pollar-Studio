"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  title?: string;
  onClose?: () => void;
  size?: "sm" | "lg" | "xl";
  bare?: boolean; // no padding or header, the child draws its own chrome
  children: React.ReactNode;
}

const EXIT_MS = 180;

export function Modal({ open, title, onClose, size = "sm", bare, children }: ModalProps) {
  // Stay mounted for a moment after closing so the dialog can fade out instead of vanishing.
  const [mounted, setMounted] = useState(open);
  const [lastChildren, setLastChildren] = useState<React.ReactNode>(children);
  if (open && !mounted) setMounted(true);
  if (open && lastChildren !== children) setLastChildren(children);
  useEffect(() => {
    if (open || !mounted) return;
    const id = setTimeout(() => setMounted(false), EXIT_MS);
    return () => clearTimeout(id);
  }, [open, mounted]);

  // Parents pass a new onClose every render. Keep it in a ref so the effect below only runs on open and close,
  // otherwise its cleanup would blur the focused input on every keystroke.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    // Keep text selection and scrolling inside the dialog while it is open.
    const previousSelect = document.body.style.userSelect;
    const previousOverflow = document.body.style.overflow;
    document.body.style.userSelect = "none";
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.userSelect = previousSelect;
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      // The button that opened the dialog keeps focus otherwise and shows a ring after closing.
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    };
  }, [open]);

  if (!mounted || typeof document === "undefined") return null;
  const leaving = !open;
  // Portal to body: page transitions use transform, which would trap a fixed overlay inside the page.
  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-[2px] ${leaving ? "modal-overlay-out" : "modal-overlay-in"}`}
      onClick={leaving ? undefined : onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`${leaving ? "modal-panel-out" : "modal-panel-in"} w-full select-text overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl ${bare ? "" : "p-5"} ${
          size === "xl" ? "max-w-5xl" : size === "lg" ? "max-w-2xl" : "max-w-sm"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {!bare && (title || onClose) && (
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">{title}</h2>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded p-1 text-muted hover:bg-background"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
        {open ? children : lastChildren}
      </div>
    </div>,
    document.body,
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`spinner inline-block h-5 w-5 rounded-full border-2 border-line border-t-accent ${className}`}
    />
  );
}
