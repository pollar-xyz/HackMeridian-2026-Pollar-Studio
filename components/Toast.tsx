"use client";

import { useState } from "react";
import { create } from "zustand";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

type ToastKind = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastState {
  items: ToastItem[];
  push(message: string, kind: ToastKind): void;
  dismiss(id: number): void;
}

const LIFETIME = 3200;
let counter = 0;
const timers = new Map<number, ReturnType<typeof setTimeout>>();

export const useToastStore = create<ToastState>((set, get) => {
  const schedule = (id: number) => {
    clearTimeout(timers.get(id));
    timers.set(
      id,
      setTimeout(() => get().dismiss(id), LIFETIME),
    );
  };
  return {
    items: [],
    push: (message, kind) => {
      const id = ++counter;
      set((s) => ({ items: [...s.items, { id, message, kind }].slice(-5) }));
      schedule(id);
    },
    dismiss: (id) => {
      clearTimeout(timers.get(id));
      timers.delete(id);
      set((s) => ({ items: s.items.filter((t) => t.id !== id) }));
    },
  };
});

export function toast(message: string, kind: ToastKind = "success") {
  useToastStore.getState().push(message, kind);
}

const VISIBLE = 3;
const HEIGHT = 44;
const GAP = 8;

// Stacked like Sonner: the newest in front, older ones peek out slightly above and behind.
// Hovering the stack spreads it into a list so every message can be read or dismissed.
export function ToastViewport() {
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);
  const [expanded, setExpanded] = useState(false);
  if (!items.length) return null;

  const ordered = [...items].reverse(); // newest first
  const height = expanded ? ordered.length * (HEIGHT + GAP) : HEIGHT + Math.min(ordered.length - 1, VISIBLE - 1) * 8;

  return (
    <div
      className="fixed bottom-4 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2"
      style={{ height }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {ordered.map((t, i) => {
        const hidden = !expanded && i >= VISIBLE;
        const y = expanded ? -i * (HEIGHT + GAP) : -i * 8;
        const scale = expanded ? 1 : 1 - i * 0.05;
        return (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className="modal-overlay-in absolute inset-x-0 bottom-0 flex items-center gap-2 rounded-lg border border-line bg-ink px-3 text-sm text-white shadow-lg transition-all duration-300 ease-out"
            style={{
              height: HEIGHT,
              transform: `translateY(${y}px) scale(${scale})`,
              transformOrigin: "top center",
              zIndex: 100 - i,
              opacity: hidden ? 0 : expanded || i === 0 ? 1 : 0.9,
              pointerEvents: hidden ? "none" : "auto",
            }}
          >
            {/* Cards behind show only their edge while stacked, so just the front message reads. */}
            <div className={`flex min-w-0 flex-1 items-center gap-2 transition-opacity duration-200 ${!expanded && i > 0 ? "opacity-0" : ""}`}>
              {t.kind === "error" ? (
                <AlertCircle size={16} className="shrink-0 text-red-300" />
              ) : (
                <CheckCircle2 size={16} className="shrink-0 text-accent-soft" />
              )}
              <span className="min-w-0 flex-1 truncate">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded p-1 text-white/70 hover:text-white"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
