"use client";

import { X } from "lucide-react";
import { moneyUnit } from "@/lib/mock/format";

export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-40 flex items-end bg-black/50" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="sheet-in max-h-[92%] w-full overflow-y-auto rounded-t-2xl border-t border-line bg-surface p-4 pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-muted hover:bg-background" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function FakeQr({ size = 160, seed = "" }: { size?: number; seed?: string }) {
  return (
    <div
      aria-label={`QR code ${seed}`}
      role="img"
      className="relative rounded-md border-4 border-white bg-white"
      style={{ width: size, height: size }}
    >
      <div className="fake-qr absolute inset-2" />
      {["left-2 top-2", "right-2 top-2", "bottom-2 left-2"].map((pos) => (
        <div key={pos} className={`absolute ${pos} h-9 w-9 border-[5px] border-foreground bg-white`}>
          <div className="m-1 h-full w-full bg-ink" style={{ height: "calc(100% - 8px)", width: "calc(100% - 8px)" }} />
        </div>
      ))}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const styles =
    variant === "primary"
      ? "bg-accent text-white hover:bg-accent-strong"
      : "border border-line bg-surface hover:bg-background";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function AmountInput({
  value,
  onChange,
  min = 1,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  min?: number;
  label?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-muted">{label ?? `Amount in ${moneyUnit()}`}</span>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        step="0.5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-line bg-background px-3 py-2.5 text-lg tabular-nums outline-none focus:border-accent"
      />
    </label>
  );
}
