"use client";

import { useState } from "react";
import { CalendarDays, MapPin } from "lucide-react";
import { toast } from "@/components/Toast";
import { formatStable } from "@/lib/mock/format";
import { shortHash } from "@/lib/mock/random";
import type { Tx } from "@/lib/mock/types";
import { PayButton } from "../PayButton";
import { FakeQr, PrimaryButton } from "../Sheet";

const PRICE = 15;

export default function EventTickets() {
  const [ticket, setTicket] = useState<Tx | null>(null);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="bg-accent px-4 py-6 text-white">
          <p className="text-xs opacity-80">Live music</p>
          <h2 className="text-xl font-semibold">Noche Andina in the Park</h2>
        </div>
        <div className="flex flex-col gap-2 p-4 text-sm">
          <p className="flex items-center gap-2 text-muted">
            <CalendarDays size={16} /> Saturday 14 November, 19:00
          </p>
          <p className="flex items-center gap-2 text-muted">
            <MapPin size={16} /> Parque Urbano, La Paz
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-muted">General entry</span>
            <span className="font-semibold tabular-nums">{formatStable(PRICE)}</span>
          </div>
          {!ticket && <PayButton amount={PRICE} label="Get ticket" onPaid={setTicket} />}
        </div>
      </div>

      {ticket && (
        <div className="rise flex flex-col items-center gap-3 rounded-2xl border border-dashed border-accent bg-surface p-5 text-center">
          <p className="text-xs text-accent-strong">Your ticket</p>
          <FakeQr seed={ticket.hash} size={180} />
          <p className="font-mono text-xs text-muted">{shortHash(ticket.hash)}</p>
          <p className="text-sm">Show this code at the entrance</p>
          <PrimaryButton variant="secondary" onClick={() => toast("Saved")}>
            Add to wallet
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
