"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Lock } from "lucide-react";

export interface DropdownItem<T extends string> {
  value: T;
  label: string;
  note?: string;
  locked?: boolean;
  soon?: boolean; // shown greyed out with a "Soon" tag, cannot be picked
  icon?: React.ReactNode;
}

// Pill trigger with a small menu. Opens upward by default so it never gets clipped at the bottom of a hero.
export function Dropdown<T extends string>({
  label,
  icon,
  items,
  value,
  onChange,
  direction = "up",
  align = "left",
  size = "sm",
  menuWidth = "w-64",
}: {
  label: string;
  icon?: React.ReactNode;
  items: DropdownItem<T>[];
  value: T;
  onChange: (value: T) => void;
  direction?: "up" | "down";
  align?: "left" | "right";
  size?: "sm" | "md";
  menuWidth?: string; // tailwind width class for the list
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-background font-medium text-foreground hover:border-accent ${
          size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"
        }`}
      >
        {icon}
        {label}
        <ChevronDown size={14} className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul
          role="listbox"
          className={`rise absolute z-20 ${menuWidth} rounded-xl border border-line bg-surface p-1 text-foreground shadow-sm ${
            direction === "up" ? "bottom-full mb-1.5" : "top-full mt-1.5"
          } ${align === "left" ? "left-0" : "right-0"}`}
        >
          {items.map((item) => {
            const active = item.value === value;
            return (
              <li key={item.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  disabled={item.locked}
                  onClick={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{item.label}</span>
                    {item.note && <span className="block text-xs text-muted">{item.note}</span>}
                  </span>
                  {item.locked ? <Lock size={14} className="text-muted" /> : active && <Check size={14} className="text-accent" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// Same pill trigger, but several values can be on. At least one always stays selected.
export function MultiDropdown<T extends string>({
  label,
  icon,
  items,
  values,
  onChange,
  direction = "up",
  hint,
  allowEmpty,
  soonLabel = "Soon",
}: {
  label: string;
  icon?: React.ReactNode;
  items: DropdownItem<T>[];
  values: T[];
  onChange: (values: T[]) => void;
  direction?: "up" | "down";
  hint?: React.ReactNode;
  allowEmpty?: boolean; // let the maker clear every option, the parent decides what empty means
  soonLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onBlur = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", onBlur);
    };
  }, [open]);

  const toggle = (v: T) => {
    if (values.includes(v)) {
      if (values.length > 1 || allowEmpty) onChange(values.filter((x) => x !== v));
    } else {
      onChange(items.map((i) => i.value).filter((x) => x === v || values.includes(x)));
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:border-accent"
      >
        {icon}
        {label}
        <ChevronDown size={14} className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          className={`rise absolute left-0 z-20 w-64 rounded-xl border border-line bg-surface p-1 text-foreground shadow-sm ${
            direction === "up" ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >
          <ul role="listbox" aria-multiselectable className="max-h-80 overflow-y-auto">
            {items.map((item) => {
              const on = values.includes(item.value);
              return (
                <li key={item.value} role="option" aria-selected={on}>
                  <button
                    type="button"
                    disabled={item.locked || item.soon}
                    onClick={() => toggle(item.value)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-background disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? "border-accent bg-accent text-white" : "border-line bg-surface"}`}
                    >
                      {on && <Check size={11} />}
                    </span>
                    {item.icon && <span className="shrink-0">{item.icon}</span>}
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{item.label}</span>
                      {item.note && <span className="block text-xs text-muted">{item.note}</span>}
                    </span>
                    {item.locked && <Lock size={14} className="text-muted" />}
                    {item.soon && <span className="shrink-0 rounded-full bg-background px-1.5 py-px text-[10px] font-medium text-muted">{soonLabel}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          {hint && <p className="border-t border-line px-2.5 pb-1 pt-2 text-[11px] text-muted">{hint}</p>}
        </div>
      )}
    </div>
  );
}
