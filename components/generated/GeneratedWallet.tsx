"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Plus,
  Check,
} from "lucide-react";
import { Spinner } from "@/components/Modal";
import { CopyButton } from "@/components/CopyButton";
import {
  formatAmount,
  formatStable,
  moneyUnit,
  timeAgo,
} from "@/lib/mock/format";
import { shortHash } from "@/lib/mock/random";
import type { Country, Tx } from "@/lib/mock/types";
import { useGenerated } from "./context";
import { AmountInput, FakeQr, PrimaryButton, Sheet } from "./Sheet";
import { GeneratedKyc } from "./GeneratedKyc";

// An app made without countries has no bank rails: money comes in and goes out through Stellar wallets only.
export function useHasBankRails(): boolean {
  const { app } = useGenerated();
  return (app.countries ?? ["BO", "BR", "AR"]).length > 0;
}

export function GeneratedWallet() {
  const { session, txs, openSheet } = useGenerated();
  const bank = useHasBankRails();

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-2xl border border-line bg-surface p-5">
        <p className="text-xs text-muted">Balance</p>
        <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight">
          {formatAmount(session.balance)}
        </p>
        <p className="text-xs text-muted">{moneyUnit()}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <PrimaryButton onClick={() => openSheet("addFunds")}>
            <Plus size={16} /> Add funds
          </PrimaryButton>
          <PrimaryButton
            variant="secondary"
            onClick={() => openSheet("cashOut")}
          >
            {bank ? <Landmark size={16} /> : <ArrowUpRight size={16} />}{" "}
            {bank ? "Cash out to bank" : "Send to a wallet"}
          </PrimaryButton>
        </div>
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Movements</h3>
        {txs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-5 text-center text-sm text-muted">
            No movements yet. Add funds or make a payment.
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
            {txs.map((tx) => (
              <MovementRow key={tx.id} tx={tx} />
            ))}
          </ul>
        )}
      </section>

      <WalletSheets />
    </div>
  );
}

function MovementRow({ tx }: { tx: Tx }) {
  const isCashout = tx.type === "cashout";
  const bank = useHasBankRails();
  return (
    <li className="flex items-center gap-3 px-3 py-2.5 text-sm">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full ${isCashout ? "bg-background text-muted" : "bg-accent-soft text-accent-strong"}`}
      >
        {isCashout ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {isCashout
            ? bank
              ? "Cash out to bank"
              : "Sent to a wallet"
            : "Payment"}
        </p>
        <p className="truncate font-mono text-[11px] text-muted">
          {tx.country} · {shortHash(tx.hash)}
        </p>
      </div>
      <div className="text-right">
        <p className="tabular-nums">{formatAmount(tx.amount)}</p>
        <p className="text-[11px] text-muted">{timeAgo(tx.at)}</p>
      </div>
    </li>
  );
}

export function WalletSheets() {
  const { sheet, openSheet } = useGenerated();
  const bank = useHasBankRails();
  return (
    <>
      <Sheet
        open={sheet === "addFunds"}
        title="Add funds"
        onClose={() => openSheet(null)}
      >
        {bank ? (
          <AddFundsFlow onDone={() => openSheet(null)} />
        ) : (
          <ReceiveCryptoFlow onDone={() => openSheet(null)} />
        )}
      </Sheet>
      <Sheet
        open={sheet === "cashOut"}
        title={bank ? "Cash out to bank" : "Send to a wallet"}
        onClose={() => openSheet(null)}
      >
        {bank ? (
          <CashOutFlow onDone={() => openSheet(null)} />
        ) : (
          <SendToWalletFlow onDone={() => openSheet(null)} />
        )}
      </Sheet>
    </>
  );
}

const RAILS: Array<{ key: Country; label: string; hint: string }> = [
  { key: "BO", label: "QR (Bolivia)", hint: "Scan with any Bolivian bank app" },
  { key: "BR", label: "Pix (Brazil)", hint: "Pay with Pix from your bank" },
  {
    key: "AR",
    label: "Transfer (Argentina)",
    hint: "Transfer from any Argentine bank",
  },
];

function AddFundsFlow({ onDone }: { onDone: () => void }) {
  const { addFunds, session, app } = useGenerated();
  const [amount, setAmount] = useState("10.00");
  const [rail, setRail] = useState<Country | null>(null);
  const [state, setState] = useState<"pick" | "confirming" | "done">("pick");
  const value = Number(amount);
  const valid = Number.isFinite(value) && value >= 1;

  const paid = () => {
    if (!rail || !valid) return;
    setState("confirming");
    setTimeout(() => {
      addFunds(Math.round(value * 100) / 100, rail);
      setState("done");
    }, 2000);
  };

  if (state === "done") {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Check size={24} />
        </span>
        <p className="text-sm font-medium">Funds added</p>
        <p className="text-sm text-muted">
          {formatStable(value)} are in your wallet. New balance{" "}
          {formatAmount(session.balance)}.
        </p>
        <PrimaryButton onClick={onDone}>Done</PrimaryButton>
      </div>
    );
  }

  if (state === "confirming") {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <Spinner />
        <p className="text-sm font-medium">Confirming</p>
        <p className="text-xs text-muted">Waiting for the bank confirmation</p>
      </div>
    );
  }

  if (rail) {
    const info = RAILS.find((r) => r.key === rail)!;
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-muted">
          {info.label}: pay {formatStable(valid ? value : 0)}
        </p>
        <FakeQr seed={`${rail}-${amount}`} />
        <p className="text-center text-xs text-muted">
          {info.hint}. Funds arrive as {moneyUnit()}.
        </p>
        <PrimaryButton onClick={paid}>I paid</PrimaryButton>
        <Button
          variant="unstyled"
          type="button"
          onClick={() => setRail(null)}
          className="text-sm text-muted hover:text-foreground"
        >
          Choose another method
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <AmountInput value={amount} onChange={setAmount} />
      <div className="flex flex-col gap-2">
        {RAILS.filter((r) =>
          (app.countries ?? ["BO", "BR", "AR"]).includes(
            r.key as "BO" | "BR" | "AR",
          ),
        ).map((r) => (
          <Button
            variant="unstyled"
            key={r.key}
            type="button"
            disabled={!valid}
            onClick={() => setRail(r.key)}
            className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-3 text-left text-sm hover:border-accent disabled:opacity-50"
          >
            <span className="font-medium">{r.label}</span>
            <span className="text-xs text-muted">{r.hint}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

const ACCOUNTS: Record<"BO" | "BR" | "AR", { label: string; value: string }> = {
  BO: { label: "Bank account", value: "Banco Union 1234567890" },
  BR: { label: "Pix key", value: "user@pix.app" },
  AR: { label: "CBU", value: "0170099220000067797370" },
};

function CashOutFlow({ onDone }: { onDone: () => void }) {
  const { session, kycVerified, cashOut, app } = useGenerated();
  const [amount, setAmount] = useState(() =>
    formatAmount(Math.min(10, session.balance)),
  );
  const allowed = app.countries ?? ["BO", "BR", "AR"];
  const preferred = (session.country === "PT" ? "BR" : session.country) as
    "BO" | "BR" | "AR";
  const firstCountry = allowed.includes(preferred) ? preferred : allowed[0];
  const [country, setCountry] = useState<"BO" | "BR" | "AR">(firstCountry);
  const [account, setAccount] = useState(ACCOUNTS[firstCountry].value);
  const [state, setState] = useState<"form" | "sending" | "receipt">("form");
  const [receipt, setReceipt] = useState<Tx | null>(null);
  const [kycDone, setKycDone] = useState(false);
  const value = Number(amount);
  const valid =
    Number.isFinite(value) && value >= 1 && value <= session.balance;

  const pickCountry = (c: "BO" | "BR" | "AR") => {
    setCountry(c);
    setAccount(ACCOUNTS[c].value);
  };

  const send = () => {
    if (!valid) return;
    setState("sending");
    setTimeout(() => {
      setReceipt(cashOut(Math.round(value * 100) / 100, country));
      setState("receipt");
    }, 2500);
  };

  if (!kycVerified && !kycDone) {
    return <GeneratedKyc onDone={() => setKycDone(true)} />;
  }

  if (state === "sending") {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <Spinner />
        <p className="text-sm font-medium">Sending to bank</p>
        <p className="text-xs text-muted">
          {ACCOUNTS[country].label}: {account}
        </p>
      </div>
    );
  }

  if (state === "receipt" && receipt) {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Check size={24} />
        </span>
        <p className="text-sm font-medium">Sent to your bank</p>
        <div className="w-full rounded-xl border border-line bg-background p-3 text-left text-sm">
          <div className="flex justify-between py-1">
            <span className="text-muted">Amount</span>
            <span className="tabular-nums">{formatStable(receipt.amount)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted">Destination</span>
            <span className="truncate pl-4 font-mono text-xs">{account}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-muted">Hash</span>
            <span className="inline-flex items-center gap-1 font-mono text-xs">
              {shortHash(receipt.hash)}{" "}
              <CopyButton value={receipt.hash} compact />
            </span>
          </div>
        </div>
        <PrimaryButton onClick={onDone}>Done</PrimaryButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {kycDone && (
        <p className="rounded-lg bg-accent-soft px-3 py-2 text-xs text-accent-strong">
          Identity verified. You can cash out now.
        </p>
      )}
      <AmountInput value={amount} onChange={setAmount} />
      <p className="-mt-2 text-xs text-muted">
        Available {formatStable(session.balance)}
      </p>
      <div className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Country</span>
        <div className="grid grid-cols-3 gap-2">
          {(["BO", "BR", "AR"] as const)
            .filter((c) => (app.countries ?? ["BO", "BR", "AR"]).includes(c))
            .map((c) => (
              <Button
                variant="unstyled"
                key={c}
                type="button"
                onClick={() => pickCountry(c)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${country === c ? "border-accent bg-accent-soft text-accent-strong" : "border-line bg-surface"}`}
              >
                {c}
              </Button>
            ))}
        </div>
      </div>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Account ({ACCOUNTS[country].label})</span>
        <Input
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          className="rounded-lg border border-line bg-background px-3 py-2.5 font-mono text-sm outline-none focus:border-accent"
        />
      </label>
      <PrimaryButton onClick={send} disabled={!valid || !account.trim()}>
        <Landmark size={16} /> Send {valid ? formatStable(value) : ""}
      </PrimaryButton>
    </div>
  );
}

// No bank rails: the user tops up by sending from any Stellar wallet or exchange to their own address.
function ReceiveCryptoFlow({ onDone }: { onDone: () => void }) {
  const { addFunds, session } = useGenerated();
  const [amount, setAmount] = useState("10.00");
  const [state, setState] = useState<"show" | "confirming" | "done">("show");
  const value = Number(amount);
  const valid = Number.isFinite(value) && value >= 1;

  if (state === "confirming") {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <Spinner />
        <p className="text-sm font-medium">Waiting for the Stellar network</p>
        <p className="text-xs text-muted">Usually takes about 5 seconds</p>
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Check size={24} />
        </span>
        <p className="text-sm font-medium">Funds received</p>
        <p className="text-sm text-muted">
          {formatStable(value)} are in your wallet. New balance{" "}
          {formatAmount(session.balance)}.
        </p>
        <PrimaryButton onClick={onDone}>Done</PrimaryButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-center text-sm text-muted">
        Send {moneyUnit()} from any Stellar wallet or exchange to your address.
      </p>
      <FakeQr seed={session.wallet} />
      <div className="flex w-full items-center gap-2 rounded-lg border border-line bg-background px-3 py-2">
        <span className="min-w-0 flex-1 truncate font-mono text-xs">
          {session.wallet}
        </span>
        <CopyButton value={session.wallet} compact />
      </div>
      <div className="w-full">
        <AmountInput
          value={amount}
          onChange={setAmount}
          label="Amount you sent"
        />
      </div>
      <PrimaryButton
        disabled={!valid}
        onClick={() => {
          setState("confirming");
          setTimeout(() => {
            addFunds(Math.round(value * 100) / 100, session.country);
            setState("done");
          }, 2000);
        }}
      >
        I sent it
      </PrimaryButton>
    </div>
  );
}

// No bank rails: cash out means sending to another Stellar address. No identity check, no bank.
function SendToWalletFlow({ onDone }: { onDone: () => void }) {
  const { session, cashOut } = useGenerated();
  const [amount, setAmount] = useState(() =>
    formatAmount(Math.min(10, session.balance)),
  );
  const [to, setTo] = useState("");
  const [state, setState] = useState<"form" | "sending" | "receipt">("form");
  const [receipt, setReceipt] = useState<Tx | null>(null);
  const value = Number(amount);
  const valid =
    Number.isFinite(value) && value >= 1 && value <= session.balance;
  const addressOk = /^G[A-Z2-7]{55}$/.test(to.trim());

  if (state === "sending") {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <Spinner />
        <p className="text-sm font-medium">Sending on Stellar</p>
        <p className="font-mono text-xs text-muted">{shortHash(to)}</p>
      </div>
    );
  }

  if (state === "receipt" && receipt) {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Check size={24} />
        </span>
        <p className="text-sm font-medium">Sent</p>
        <div className="w-full rounded-xl border border-line bg-background p-3 text-left text-sm">
          <div className="flex justify-between py-1">
            <span className="text-muted">Amount</span>
            <span className="tabular-nums">{formatStable(receipt.amount)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted">To</span>
            <span className="truncate pl-4 font-mono text-xs">
              {shortHash(to)}
            </span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-muted">Hash</span>
            <span className="inline-flex items-center gap-1 font-mono text-xs">
              {shortHash(receipt.hash)}{" "}
              <CopyButton value={receipt.hash} compact />
            </span>
          </div>
        </div>
        <PrimaryButton onClick={onDone}>Done</PrimaryButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <AmountInput value={amount} onChange={setAmount} />
      <p className="-mt-2 text-xs text-muted">
        Available {formatStable(session.balance)}
      </p>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Stellar address</span>
        <Input
          value={to}
          onChange={(e) =>
            setTo(e.target.value.toUpperCase().replace(/\s/g, ""))
          }
          placeholder="G..."
          spellCheck={false}
          className="rounded-lg border border-line bg-background px-3 py-2.5 font-mono text-xs outline-none focus:border-accent"
        />
        {to && !addressOk && (
          <span className="text-xs text-danger">
            A Stellar address starts with G and has 56 characters.
          </span>
        )}
      </label>
      <PrimaryButton
        disabled={!valid || !addressOk}
        onClick={() => {
          setState("sending");
          setTimeout(() => {
            setReceipt(cashOut(Math.round(value * 100) / 100, session.country));
            setState("receipt");
          }, 2000);
        }}
      >
        <ArrowUpRight size={16} /> Send {valid ? formatStable(value) : ""}
      </PrimaryButton>
    </div>
  );
}
