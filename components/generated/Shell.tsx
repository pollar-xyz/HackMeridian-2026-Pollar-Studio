"use client";

import { useState } from "react";
import { Home, User, Wallet } from "lucide-react";
import { formatAmount, moneyUnit } from "@/lib/mock/format";
import { Mark } from "@/components/Logo";
import { useGenerated } from "./context";
import { GeneratedWallet, WalletSheets } from "./GeneratedWallet";
import { GeneratedAccount } from "./GeneratedAccount";
import { KIND_SCREENS } from "./kinds";

type Tab = "home" | "wallet" | "account";

export function Shell() {
  const { app, session } = useGenerated();
  const [tab, setTab] = useState<Tab>("home");
  const Screen = KIND_SCREENS[app.kind];

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background sm:border-x sm:border-line">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/95 px-4 py-3 backdrop-blur">
        <h1 className="truncate text-base font-semibold">{app.name}</h1>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-background px-2 py-0.5 text-[11px] font-medium text-muted">
          <Mark size={14} />
          Powered by Pollar
        </span>
      </header>

      <main className="flex-1 pb-20">
        {tab === "home" && (
          <>
            <div className="flex items-center justify-between px-4 pt-3 text-xs text-muted">
              <span>Your balance</span>
              <button type="button" onClick={() => setTab("wallet")} className="font-medium text-foreground tabular-nums">
                {formatAmount(session.balance)} {moneyUnit()}
              </button>
            </div>
            <Screen />
            <WalletSheets />
          </>
        )}
        {tab === "wallet" && <GeneratedWallet />}
        {tab === "account" && (
          <>
            <GeneratedAccount />
            <WalletSheets />
          </>
        )}
      </main>

      <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-line bg-surface">
        <ul className="grid grid-cols-3">
          {(
            [
              { key: "home", label: "Home", Icon: Home },
              { key: "wallet", label: "Wallet", Icon: Wallet },
              { key: "account", label: "Account", Icon: User },
            ] as const
          ).map(({ key, label, Icon }) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => setTab(key)}
                className={`flex w-full flex-col items-center gap-0.5 py-2.5 text-[11px] ${tab === key ? "text-accent" : "text-muted"}`}
              >
                <Icon size={20} />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
