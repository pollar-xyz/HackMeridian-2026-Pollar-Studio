"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Cross2Icon } from "@radix-ui/react-icons";
import {
  Sheet as SheetRoot,
  SheetContent,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
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
  return (
    <SheetRoot
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent
        side="bottom"
        aria-describedby={undefined}
        className="top-auto bottom-0 max-h-[92dvh] translate-y-0 rounded-b-none rounded-t-2xl p-4 pb-6"
      >
        <div className="mb-3 flex items-center justify-between">
          <SheetTitle className="text-base font-semibold">{title}</SheetTitle>
          <SheetClose
            aria-label="Close"
            className="rounded-md p-1.5 text-muted hover:bg-background"
          >
            <Cross2Icon />
          </SheetClose>
        </div>
        {children}
      </SheetContent>
    </SheetRoot>
  );
}

export function FakeQr({
  size = 160,
  seed = "",
}: {
  size?: number;
  seed?: string;
}) {
  return (
    <div
      aria-label={`QR code ${seed}`}
      role="img"
      className="relative rounded-md border-4 border-white bg-white"
      style={{ width: size, height: size }}
    >
      <div className="fake-qr absolute inset-2" />
      {["left-2 top-2", "right-2 top-2", "bottom-2 left-2"].map((pos) => (
        <div
          key={pos}
          className={`absolute ${pos} h-9 w-9 border-[5px] border-foreground bg-white`}
        >
          <div
            className="m-1 h-full w-full bg-ink"
            style={{ height: "calc(100% - 8px)", width: "calc(100% - 8px)" }}
          />
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
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled}
      variant={variant}
      className={`w-full py-3 ${className}`}
    >
      {children}
    </Button>
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
      <Input
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
