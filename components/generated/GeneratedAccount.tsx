"use client";

import { Button } from "@/components/ui/Button";
import { LogOut, ShieldCheck, ShieldAlert } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { StatusChip } from "@/components/StatusChip";
import { shortWallet } from "@/lib/mock/random";
import { COUNTRY_NAMES } from "@/lib/mock/types";
import { useGenerated } from "./context";
import { PrimaryButton } from "./Sheet";
import { useHasBankRails } from "./GeneratedWallet";

export function GeneratedAccount() {
  const { session, kycVerified, logout, openSheet } = useGenerated();
  const bank = useHasBankRails();

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-surface">
        <Row label="Email" value={session.email} />
        <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
          <div className="min-w-0">
            <p className="text-xs text-muted">Wallet</p>
            <p className="truncate font-mono" title={session.wallet}>
              {shortWallet(session.wallet)}
            </p>
          </div>
          <CopyButton value={session.wallet} />
        </div>
        <Row label="Country" value={COUNTRY_NAMES[session.country]} />
        {bank && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              {kycVerified ? (
                <ShieldCheck size={18} className="text-accent" />
              ) : (
                <ShieldAlert size={18} className="text-muted" />
              )}
              <div>
                <p className="text-xs text-muted">Identity</p>
                <p>
                  {kycVerified
                    ? "Verified for bank cashouts"
                    : "Not verified yet"}
                </p>
              </div>
            </div>
            {kycVerified ? (
              <StatusChip status="verified" />
            ) : (
              <Button
                variant="unstyled"
                type="button"
                onClick={() => openSheet("cashOut")}
                className="text-xs font-medium text-accent hover:underline"
              >
                Verify
              </Button>
            )}
          </div>
        )}
      </div>

      <PrimaryButton variant="secondary" onClick={logout}>
        <LogOut size={16} /> Log out
      </PrimaryButton>
      <p className="text-center text-[11px] text-muted">
        Passkey session on this device. Your wallet is yours, logging out keeps
        it safe.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3 text-sm">
      <p className="text-xs text-muted">{label}</p>
      <p className="truncate">{value}</p>
    </div>
  );
}
