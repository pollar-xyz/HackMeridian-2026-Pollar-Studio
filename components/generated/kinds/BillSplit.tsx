"use client";

import { useState } from "react";
import { StatusChip } from "@/components/StatusChip";
import { formatAmount, formatStable } from "@/lib/mock/format";
import { PayButton } from "../PayButton";

const TOTAL = 48;
const PEOPLE = [
  { name: "You", paid: false },
  { name: "Daniela", paid: true },
  { name: "Mateo", paid: false },
  { name: "Renata", paid: true },
];
const SHARE = TOTAL / PEOPLE.length;

export default function BillSplit() {
  const [youPaid, setYouPaid] = useState(false);
  const collected = PEOPLE.filter((p) => (p.name === "You" ? youPaid : p.paid)).length * SHARE;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-xs text-muted">Dinner at Casa Verde</p>
        <h2 className="text-lg font-semibold">Total {formatStable(TOTAL)}</h2>
        <p className="text-sm text-muted">Split between {PEOPLE.length}, {formatStable(SHARE)} each</p>
        <div className="mt-3 flex items-center justify-between text-xs text-muted">
          <span>Collected</span>
          <span className="tabular-nums">
            {formatAmount(collected)} / {formatAmount(TOTAL)}
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-background">
          <div className="h-full bg-accent transition-all" style={{ width: `${(collected / TOTAL) * 100}%` }} />
        </div>
        <div className="mt-4">
          {youPaid ? (
            <div className="rounded-lg bg-accent-soft px-3 py-2.5 text-center text-sm font-medium text-accent-strong">Your share is paid</div>
          ) : (
            <PayButton amount={SHARE} label={`Pay my share ${formatAmount(SHARE)}`} onPaid={() => setYouPaid(true)} />
          )}
        </div>
      </div>

      <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
        {PEOPLE.map((p) => {
          const paid = p.name === "You" ? youPaid : p.paid;
          return (
            <li key={p.name} className="flex items-center justify-between px-3 py-2.5 text-sm">
              <span>{p.name}</span>
              <span className="flex items-center gap-3">
                <span className="tabular-nums text-muted">{formatAmount(SHARE)}</span>
                <StatusChip status={paid ? "paid" : "pending"} />
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
