"use client";

import { useState } from "react";
import { formatStable } from "@/lib/mock/format";
import { PayButton } from "../PayButton";

const STAKE = 5;
type Pick = "home" | "draw" | "away";
const MATCHES = [
  { id: "m1", home: "Bolivar", away: "The Strongest", odds: { home: 2.1, draw: 3.2, away: 3.4 }, when: "Sat 16:00" },
  { id: "m2", home: "Flamengo", away: "Palmeiras", odds: { home: 2.4, draw: 3.1, away: 2.9 }, when: "Sat 21:00" },
  { id: "m3", home: "Boca Juniors", away: "River Plate", odds: { home: 2.7, draw: 3.0, away: 2.6 }, when: "Sun 17:00" },
];

interface Prediction {
  matchId: string;
  pick: Pick;
  odds: number;
}

export default function MatchPredictions() {
  const [selected, setSelected] = useState<Record<string, Pick>>({});
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const chosen = MATCHES.filter((m) => selected[m.id]);
  const total = chosen.length * STAKE;

  const place = () => {
    setPredictions((p) => [
      ...chosen.map((m) => ({ matchId: m.id, pick: selected[m.id], odds: m.odds[selected[m.id]] })),
      ...p,
    ]);
    setSelected({});
  };

  const label = (m: (typeof MATCHES)[number], pick: Pick) => (pick === "home" ? m.home : pick === "away" ? m.away : "Draw");

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h2 className="text-lg font-semibold">This weekend</h2>
        <p className="text-xs text-muted">Pick a result per match, {formatStable(STAKE)} each</p>
      </div>
      <div className="flex flex-col gap-3">
        {MATCHES.map((m) => (
          <div key={m.id} className="rounded-xl border border-line bg-surface p-3">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">
                {m.home} vs {m.away}
              </span>
              <span className="text-xs text-muted">{m.when}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["home", "draw", "away"] as Pick[]).map((pick) => {
                const active = selected[m.id] === pick;
                return (
                  <button
                    key={pick}
                    type="button"
                    onClick={() => setSelected((s) => (active ? Object.fromEntries(Object.entries(s).filter(([k]) => k !== m.id)) : { ...s, [m.id]: pick }))}
                    className={`flex flex-col items-center rounded-lg border px-2 py-2 text-xs ${
                      active ? "border-accent bg-accent-soft text-accent-strong" : "border-line"
                    }`}
                  >
                    <span className="truncate font-medium">{pick === "draw" ? "Draw" : pick === "home" ? m.home : m.away}</span>
                    <span className="tabular-nums text-muted">{m.odds[pick].toFixed(2)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <PayButton
        amount={total}
        disabled={chosen.length === 0}
        label={chosen.length === 0 ? "Pick at least one result" : `Place ${formatStable(total)}`}
        onPaid={place}
      />

      {predictions.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Your predictions</h3>
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
            {predictions.map((p, i) => {
              const m = MATCHES.find((x) => x.id === p.matchId)!;
              return (
                <li key={`${p.matchId}-${i}`} className="flex items-center justify-between px-3 py-2.5 text-sm">
                  <div>
                    <p className="font-medium">{label(m, p.pick)}</p>
                    <p className="text-xs text-muted">
                      {m.home} vs {m.away}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tabular-nums">{formatStable(STAKE)}</p>
                    <p className="text-xs text-muted">pays {(STAKE * p.odds).toFixed(2)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
