"use client";

import { useState } from "react";
import { Minus, Plus, Store } from "lucide-react";
import { formatAmount, formatStable, clock } from "@/lib/mock/format";
import { PayButton } from "../PayButton";

const STALLS = [
  { id: "fruit", name: "Dona Rosa, fruit", products: [{ id: "banana", name: "Bananas (kg)", price: 1.5 }, { id: "mango", name: "Mangoes (3)", price: 2.5 }, { id: "papaya", name: "Papaya", price: 3 }] },
  { id: "bread", name: "Panaderia Luz", products: [{ id: "marraqueta", name: "Marraquetas (6)", price: 1.2 }, { id: "empanada", name: "Cheese empanada", price: 1.8 }, { id: "cunape", name: "Cunapes (4)", price: 2 }] },
  { id: "cheese", name: "Queseria del Valle", products: [{ id: "fresco", name: "Fresh cheese (500g)", price: 4 }, { id: "yogur", name: "Yogurt (1L)", price: 3.5 }, { id: "manteca", name: "Butter", price: 2.8 }] },
  { id: "flowers", name: "Flores Mariposa", products: [{ id: "rosas", name: "Roses (12)", price: 6 }, { id: "girasol", name: "Sunflowers (5)", price: 4.5 }, { id: "lirio", name: "Lilies (3)", price: 5 }] },
];

interface Order {
  stall: string;
  items: number;
  total: number;
  at: number;
}

export default function MarketOrders() {
  const [open, setOpen] = useState(STALLS[0].id);
  const [carts, setCarts] = useState<Record<string, Record<string, number>>>({});
  const [orders, setOrders] = useState<Order[]>([]);

  const change = (stallId: string, productId: string, delta: number) =>
    setCarts((all) => {
      const cart = { ...(all[stallId] ?? {}) };
      const next = Math.max(0, (cart[productId] ?? 0) + delta);
      if (next === 0) delete cart[productId];
      else cart[productId] = next;
      return { ...all, [stallId]: cart };
    });

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h2 className="text-lg font-semibold">Mercado Rodriguez</h2>
        <p className="text-xs text-muted">Order from each stall and pay them directly</p>
      </div>

      <div className="flex flex-col gap-2">
        {STALLS.map((stall) => {
          const cart = carts[stall.id] ?? {};
          const count = Object.values(cart).reduce((a, b) => a + b, 0);
          const total = stall.products.reduce((sum, p) => sum + (cart[p.id] ?? 0) * p.price, 0);
          const expanded = open === stall.id;
          return (
            <div key={stall.id} className="rounded-xl border border-line bg-surface">
              <button
                type="button"
                onClick={() => setOpen(expanded ? "" : stall.id)}
                className="flex w-full items-center justify-between px-3 py-3 text-left text-sm"
              >
                <span className="flex items-center gap-2 font-medium">
                  <Store size={16} className="text-accent" /> {stall.name}
                </span>
                <span className="text-xs text-muted">{count > 0 ? `${count} in cart` : `${stall.products.length} products`}</span>
              </button>
              {expanded && (
                <div className="border-t border-line p-3">
                  <ul className="divide-y divide-line">
                    {stall.products.map((p) => {
                      const qty = cart[p.id] ?? 0;
                      return (
                        <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                          <div>
                            <p>{p.name}</p>
                            <p className="text-xs text-muted tabular-nums">{formatAmount(p.price)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => change(stall.id, p.id, -1)}
                              disabled={qty === 0}
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-line disabled:opacity-30"
                              aria-label={`Remove ${p.name}`}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-4 text-center tabular-nums">{qty}</span>
                            <button
                              type="button"
                              onClick={() => change(stall.id, p.id, 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-accent bg-accent-soft text-accent-strong"
                              aria-label={`Add ${p.name}`}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-3">
                    <PayButton
                      amount={Math.round(total * 100) / 100}
                      disabled={count === 0}
                      label={count === 0 ? "Add products" : `Pay stall ${formatAmount(total)}`}
                      onPaid={(tx) => {
                        setOrders((o) => [{ stall: stall.name, items: count, total: tx.amount, at: tx.at }, ...o]);
                        setCarts((all) => ({ ...all, [stall.id]: {} }));
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {orders.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Your orders</h3>
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
            {orders.map((o, i) => (
              <li key={`${o.stall}-${o.at}-${i}`} className="flex items-center justify-between px-3 py-2.5 text-sm">
                <div>
                  <p className="font-medium">{o.stall}</p>
                  <p className="text-xs text-muted">
                    {o.items} {o.items === 1 ? "item" : "items"} · {clock(o.at)} · paid
                  </p>
                </div>
                <span className="tabular-nums">{formatStable(o.total)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
