"use client";

import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { Ticket, Trophy } from "lucide-react";
import { formatStable } from "@/lib/mock/format";
import { useGenerated } from "../context";
import { PayButton } from "../PayButton";
import { PrimaryButton } from "../Sheet";

const PRIZE = 100;
const TICKET = 2;
const TOTAL = 50;
const SOLD_BEFORE = 37;

export default function RaffleHub() {
  const { session } = useGenerated();
  const [mine, setMine] = useState<number[]>([]);
  const [winner, setWinner] = useState<number | null>(null);
  const sold = SOLD_BEFORE + mine.length;
  const canDraw = /@raffle-hub[^.]*\.app$/.test(session.email);

  const draw = () => setWinner(1 + Math.floor(Math.random() * sold));

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-xs text-muted">Neighborhood raffle</p>
        <div className="mt-1 flex items-center gap-2">
          <Trophy size={20} className="text-accent" />
          <h2 className="text-lg font-semibold">Prize {formatStable(PRIZE)}</h2>
        </div>
        <p className="mt-1 text-sm text-muted">
          Tickets {formatStable(TICKET)} each
        </p>
        <div className="mt-3 flex items-center justify-between text-xs text-muted">
          <span>Sold</span>
          <span className="tabular-nums">
            {sold} / {TOTAL}
          </span>
        </div>
        <Progress
          value={(sold / TOTAL) * 100}
          aria-label="Tickets sold"
          className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-background"
        />
        <div className="mt-4">
          <PayButton
            amount={TICKET}
            disabled={sold >= TOTAL || winner !== null}
            label={sold >= TOTAL ? "Sold out" : "Buy ticket"}
            onPaid={() => setMine((m) => [...m, SOLD_BEFORE + m.length + 1])}
          />
        </div>
      </div>

      {mine.length > 0 && (
        <div className="rounded-2xl border border-accent/30 bg-accent-soft p-4">
          <p className="text-xs text-accent-strong">Your tickets</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {mine.map((n) => (
              <span
                key={n}
                className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 font-mono text-sm font-medium"
              >
                <Ticket size={14} className="text-accent" /> #
                {n.toString().padStart(3, "0")}
              </span>
            ))}
          </div>
        </div>
      )}

      {canDraw && (
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">Organizer</p>
          {winner === null ? (
            <PrimaryButton variant="secondary" onClick={draw} className="mt-2">
              <Trophy size={16} /> Draw
            </PrimaryButton>
          ) : (
            <div className="mt-2 text-center">
              <p className="text-sm text-muted">Winning ticket</p>
              <p className="font-mono text-3xl font-semibold">
                #{winner.toString().padStart(3, "0")}
              </p>
              {mine.includes(winner) && (
                <p className="mt-1 text-sm font-medium text-accent-strong">
                  That is yours. Congratulations.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-center text-xs text-muted">
        Draw on Saturday at 20:00 once the 50 tickets are sold.
      </p>
    </div>
  );
}
