"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useStudioStore } from "@/lib/mock/store";
import { useLocalState, useLocalValue, writeLocal } from "@/lib/mock/local-state";
import { hashString, makeRng, newId, randomHash, walletAddress } from "@/lib/mock/random";
import type { App, Country, Tx } from "@/lib/mock/types";
import { COUNTRIES } from "@/lib/mock/types";
import { setMoneyUnit, unitFor } from "@/lib/mock/format";

export interface GeneratedSession {
  email: string;
  wallet: string;
  country: Country;
  balance: number;
  createdAt: number;
}

export type SheetKind = "addFunds" | "cashOut" | null;

export const STARTING_BALANCE = 25;

export function sessionKey(slug: string) {
  return `pollar-app-session-${slug}`;
}

export function kycKey(slug: string) {
  return `pollar-app-kyc-${slug}`;
}

export function buildSession(slug: string): GeneratedSession {
  const seed = hashString(slug);
  return {
    email: `user@${slug}.app`,
    wallet: walletAddress(makeRng(seed)),
    country: COUNTRIES[seed % COUNTRIES.length],
    balance: STARTING_BALANCE,
    createdAt: Date.now(),
  };
}

// Apps that share accounts or KYC use one key for all of Pollar, so a user signs in or verifies once for every app that opts in.
function sharedScope(_app: Pick<App, "maker" | "slug">) {
  void _app;
  return "pollar-network";
}

export function sessionKeyFor(app: Pick<App, "maker" | "slug" | "shared"> | undefined, slug: string) {
  return app?.shared?.includes("accounts") ? sessionKey(sharedScope(app)) : sessionKey(slug);
}

export function kycKeyFor(app: Pick<App, "maker" | "slug" | "shared">) {
  return app.shared?.includes("kyc") ? kycKey(sharedScope(app)) : kycKey(app.slug);
}

export function sessionSeedFor(app: Pick<App, "maker" | "slug" | "shared">) {
  return app.shared?.includes("accounts") ? sharedScope(app) : app.slug;
}

export function useGeneratedSession(slug: string, app?: App) {
  return useLocalState<GeneratedSession>(sessionKeyFor(app, slug));
}

interface GeneratedContextValue {
  app: App;
  slug: string;
  session: GeneratedSession;
  txs: Tx[];
  kycVerified: boolean;
  sheet: SheetKind;
  openSheet(sheet: SheetKind): void;
  completeKyc(): void;
  logout(): void;
  canPay(amount: number): boolean;
  pay(amount: number): Tx;
  addFunds(amount: number, country: Country): Tx;
  cashOut(amount: number, country: Country): Tx;
}

const Ctx = createContext<GeneratedContextValue | null>(null);

export function useGenerated(): GeneratedContextValue {
  const value = useContext(Ctx);
  if (!value) throw new Error("useGenerated must be used inside GeneratedProvider");
  return value;
}

export function GeneratedProvider({
  app,
  session,
  children,
}: {
  app: App;
  session: GeneratedSession;
  children: React.ReactNode;
}) {
  const slug = app.slug;
  // XLM-only apps show XLM everywhere instead of stablecoins.
  setMoneyUnit(unitFor(app.assets));
  const addTx = useStudioStore((s) => s.addTx);
  const allTxs = useStudioStore((s) => s.txs);
  const wallet = session.wallet;
  const txs = useMemo(
    () => allTxs.filter((t) => t.appSlug === slug && t.from === wallet).sort((a, b) => b.at - a.at),
    [allTxs, slug, wallet],
  );
  const kyc = useLocalValue<boolean>(kycKeyFor(app));
  const [sheet, setSheet] = useState<SheetKind>(null);

  const updateBalance = useCallback(
    (delta: number) => {
      writeLocal(sessionKeyFor(app, slug), { ...session, balance: Math.round((session.balance + delta) * 100) / 100 });
    },
    [app, slug, session],
  );

  const record = useCallback(
    (type: Tx["type"], amount: number, country: Country): Tx => {
      const tx: Tx = {
        id: newId("tx"),
        appSlug: slug,
        hash: randomHash(),
        from: session.wallet,
        country,
        amount,
        type,
        at: Date.now(),
      };
      addTx(tx);
      return tx;
    },
    [addTx, slug, session.wallet],
  );

  const value = useMemo<GeneratedContextValue>(
    () => ({
      app,
      slug,
      session,
      txs,
      kycVerified: kyc === true,
      sheet,
      openSheet: setSheet,
      completeKyc: () => writeLocal(kycKeyFor(app), true),
      logout: () => writeLocal(sessionKeyFor(app, slug), null),
      canPay: (amount) => session.balance >= amount,
      pay: (amount) => {
        updateBalance(-amount);
        return record("payment", amount, session.country);
      },
      addFunds: (amount, country) => {
        updateBalance(amount);
        return record("payment", amount, country);
      },
      cashOut: (amount, country) => {
        updateBalance(-amount);
        return record("cashout", amount, country);
      },
    }),
    [app, slug, session, txs, kyc, sheet, updateBalance, record],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
