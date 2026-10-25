"use client";

import { useState } from "react";
import { formatAmount, formatStable, moneyUnit } from "@/lib/mock/format";
import { AmountInput } from "../Sheet";
import { PayButton } from "../PayButton";

const GOAL = 200;
const START_RAISED = 135;
const START_BACKERS = 7;

export default function MoneyPool() {
  const [raised, setRaised] = useState(START_RAISED);
  const [backers, setBackers] = useState(START_BACKERS);
  const [amount, setAmount] = useState("10.00");
  const [contributed, setContributed] = useState(0);
  const value = Number(amount);
  const valid = Number.isFinite(value) && value >= 1;
  const pct = Math.min(100, (raised / GOAL) * 100);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-xs text-muted">Community pool</p>
        <h2 className="text-lg font-semibold">New roof for the neighborhood hall</h2>
        <div className="mt-3 flex items-end justify-between">
          <span className="text-3xl font-semibold tabular-nums tracking-tight">{formatAmount(raised)}</span>
          <span className="text-sm text-muted">of {formatStable(GOAL)}</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-background">
          <div className="h-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted">
          {backers} contributors · {Math.round(pct)}% funded
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
        <AmountInput value={amount} onChange={setAmount} label={`Your contribution in ${moneyUnit()}`} />
        <PayButton
          amount={valid ? Math.round(value * 100) / 100 : 0}
          disabled={!valid}
          label={valid ? `Contribute ${formatAmount(value)}` : "Enter an amount"}
          onPaid={(tx) => {
            setRaised((r) => Math.round((r + tx.amount) * 100) / 100);
            setBackers((b) => (contributed === 0 ? b + 1 : b));
            setContributed((c) => c + tx.amount);
          }}
        />
        {contributed > 0 && (
          <p className="text-center text-xs text-accent-strong">You contributed {formatStable(contributed)}. Thank you.</p>
        )}
      </div>
    </div>
  );
}
