"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { formatStable, clock, moneyUnit } from "@/lib/mock/format";
import { shortHash } from "@/lib/mock/random";
import type { Tx } from "@/lib/mock/types";
import { PayButton } from "../PayButton";
import { PrimaryButton } from "../Sheet";

const AMOUNT = 30;

export default function VendorPayLink() {
  const [receipt, setReceipt] = useState<Tx | null>(null);

  if (receipt) {
    return (
      <div className="flex flex-col items-center gap-4 p-4 pt-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Check size={28} />
        </span>
        <h2 className="text-xl font-semibold">Paid</h2>
        <p className="text-sm text-muted">Carla Ferreira received {formatStable(receipt.amount)}</p>
        <div className="w-full rounded-xl border border-line bg-surface p-3 text-left text-sm">
          <div className="flex justify-between py-1">
            <span className="text-muted">Concept</span>
            <span>Logo design, final files</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted">Time</span>
            <span>{clock(receipt.at)}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-muted">Hash</span>
            <span className="inline-flex items-center gap-1 font-mono text-xs">
              {shortHash(receipt.hash)} <CopyButton value={receipt.hash} compact />
            </span>
          </div>
        </div>
        <PrimaryButton variant="secondary" onClick={() => setReceipt(null)}>
          Back to the link
        </PrimaryButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background text-lg font-semibold">C</span>
        <div>
          <p className="text-base font-semibold">Carla Ferreira</p>
          <p className="text-xs text-muted">Freelance designer · Sao Paulo</p>
        </div>
        <p className="text-sm text-muted">Logo design, final files</p>
        <p className="text-4xl font-semibold tabular-nums tracking-tight">{AMOUNT.toFixed(2)}</p>
        <p className="-mt-2 text-xs text-muted">{moneyUnit()}</p>
        <PayButton amount={AMOUNT} label={`Pay ${AMOUNT.toFixed(2)}`} onPaid={setReceipt} />
      </div>
      <p className="text-center text-xs text-muted">Link expires in 6 days. The vendor is notified as soon as you pay.</p>
    </div>
  );
}
