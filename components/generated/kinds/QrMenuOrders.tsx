"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { formatAmount, formatStable } from "@/lib/mock/format";
import { PayButton } from "../PayButton";
import { PrimaryButton } from "../Sheet";

const MENU = [
  { id: "api", name: "Api con pastel", price: 3.5 },
  { id: "saltena", name: "Saltena de pollo", price: 2 },
  { id: "cafe", name: "Cafe con leche", price: 2.5 },
  { id: "sandwich", name: "Sandwich de palta", price: 4 },
  { id: "jugo", name: "Jugo de maracuya", price: 3 },
  { id: "torta", name: "Torta de chocolate", price: 4.5 },
];

export default function QrMenuOrders() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [order, setOrder] = useState<{ number: number; total: number } | null>(null);
  const total = MENU.reduce((sum, item) => sum + (cart[item.id] ?? 0) * item.price, 0);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);

  const change = (id: string, delta: number) =>
    setCart((c) => {
      const next = Math.max(0, (c[id] ?? 0) + delta);
      const copy = { ...c };
      if (next === 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });

  if (order) {
    return (
      <div className="flex flex-col items-center gap-4 p-4 pt-10 text-center">
        <p className="text-xs text-muted">Order number</p>
        <p className="text-5xl font-semibold tabular-nums tracking-tight">#{order.number}</p>
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
          <span className="live-dot h-2 w-2 rounded-full bg-amber-500" /> Preparing
        </span>
        <p className="text-sm text-muted">Paid {formatStable(order.total)}. We will call your number at the counter.</p>
        <PrimaryButton
          variant="secondary"
          onClick={() => {
            setOrder(null);
            setCart({});
          }}
        >
          New order
        </PrimaryButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <p className="text-xs text-muted">Table 4</p>
        <h2 className="text-lg font-semibold">Menu</h2>
      </div>
      <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
        {MENU.map((item) => {
          const qty = cart[item.id] ?? 0;
          return (
            <li key={item.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted tabular-nums">{formatAmount(item.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => change(item.id, -1)}
                  disabled={qty === 0}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-line disabled:opacity-30"
                  aria-label={`Remove ${item.name}`}
                >
                  <Minus size={14} />
                </button>
                <span className="w-4 text-center tabular-nums">{qty}</span>
                <button
                  type="button"
                  onClick={() => change(item.id, 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-accent bg-accent-soft text-accent-strong"
                  aria-label={`Add ${item.name}`}
                >
                  <Plus size={14} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-muted">
            {count} {count === 1 ? "item" : "items"}
          </span>
          <span className="font-semibold tabular-nums">{formatStable(total)}</span>
        </div>
        <PayButton
          amount={Math.round(total * 100) / 100}
          disabled={count === 0}
          label={count === 0 ? "Add something to your order" : "Pay order"}
          onPaid={() => setOrder({ number: 40 + Math.floor(Math.random() * 60), total })}
        />
      </div>
    </div>
  );
}
