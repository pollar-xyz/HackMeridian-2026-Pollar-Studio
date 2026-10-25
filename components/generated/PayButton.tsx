"use client";

import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { Spinner } from "@/components/Modal";
import { useGenerated } from "./context";
import type { Tx } from "@/lib/mock/types";

interface PayButtonProps {
  amount: number;
  label: string;
  onPaid?: (tx: Tx) => void;
  disabled?: boolean;
}

// Reusable payment action. If the balance is short it opens the Add funds sheet instead.
export function PayButton({ amount, label, onPaid, disabled }: PayButtonProps) {
  const { canPay, pay, openSheet } = useGenerated();
  const [paying, setPaying] = useState(false);

  const click = () => {
    if (paying || disabled) return;
    if (!canPay(amount)) {
      openSheet("addFunds");
      return;
    }
    setPaying(true);
    setTimeout(() => {
      const tx = pay(amount);
      setPaying(false);
      onPaid?.(tx);
    }, 1500);
  };

  return (
    <Button variant="unstyled"
      type="button"
      onClick={click}
      disabled={disabled || paying}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
    >
      {paying ? (
        <>
          <Spinner className="h-4 w-4 border-white/40 border-t-white" /> Paying
        </>
      ) : (
        label
      )}
    </Button>
  );
}
