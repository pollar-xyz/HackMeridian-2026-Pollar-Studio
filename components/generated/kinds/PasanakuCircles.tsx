"use client";

import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { StatusChip } from "@/components/StatusChip";
import { formatStable } from "@/lib/mock/format";
import { PayButton } from "../PayButton";

const MEMBERS = [
  "You",
  "Mariela",
  "Jorge",
  "Camila",
  "Rodrigo",
  "Valeria",
  "Pablo",
  "Lucia",
  "Andres",
  "Sofia",
];
const PAID_BEFORE = new Set([
  "Mariela",
  "Camila",
  "Valeria",
  "Lucia",
  "Sofia",
  "Andres",
]);
const WEEKLY = 5;
const ROUND = 3;
const PAYOUT_TO = "Jorge";

export default function PasanakuCircles() {
  const [youPaid, setYouPaid] = useState(false);
  const paidCount = PAID_BEFORE.size + (youPaid ? 1 : 0);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-xs text-muted">
          Round {ROUND} of {MEMBERS.length}
        </p>
        <h2 className="text-lg font-semibold">
          Weekly contribution {formatStable(WEEKLY)}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {paidCount} of {MEMBERS.length} members paid this week
        </p>
        <Progress
          value={(paidCount / MEMBERS.length) * 100}
          aria-label="Members paid"
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-background"
        />
        <div className="mt-4">
          {youPaid ? (
            <div className="rounded-lg bg-accent-soft px-3 py-2.5 text-center text-sm font-medium text-accent-strong">
              You are in for this week
            </div>
          ) : (
            <PayButton
              amount={WEEKLY}
              label={`Pay this week (${formatStable(WEEKLY)})`}
              onPaid={() => setYouPaid(true)}
            />
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-accent/30 bg-accent-soft p-4">
        <p className="text-xs text-accent-strong">Next payout</p>
        <p className="text-base font-semibold">
          {PAYOUT_TO} collects {formatStable(WEEKLY * MEMBERS.length)}
        </p>
        <p className="text-xs text-muted">
          Sunday at 18:00, once all 10 contributions are in
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Members</h3>
        <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
          {MEMBERS.map((m) => {
            const paid = m === "You" ? youPaid : PAID_BEFORE.has(m);
            return (
              <li
                key={m}
                className="flex items-center justify-between px-3 py-2.5 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-background text-xs font-medium">
                    {m.charAt(0)}
                  </span>
                  {m}
                  {m === PAYOUT_TO && (
                    <span className="text-xs text-muted">
                      collects this round
                    </span>
                  )}
                </span>
                <StatusChip status={paid ? "paid" : "pending"} />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
