"use client";

import { ArrowRight, ExternalLink, FileCode2, Fingerprint, Landmark, Sparkles, Users } from "lucide-react";
import type { App } from "@/lib/mock/types";
import { templateRules } from "@/lib/mock/chat";
import { integrationsFor } from "@/lib/mock/ecosystem";
import { useT } from "@/lib/i18n";
import { shortHash } from "@/lib/mock/random";
import { CopyButton } from "@/components/CopyButton";
import { AssetIcon } from "@/components/AssetIcons";

const OUT_BY_KIND: Record<App["kind"], string> = {
  "pasanaku-circles": "Member whose turn it is",
  "bill-split": "The restaurant",
  "money-pool": "The organizer",
  "vendor-pay-link": "The vendor",
  "qr-menu-orders": "The restaurant",
  "raffle-hub": "The winner",
  "event-tickets": "The organizer, or refunds",
  "match-predictions": "Winning predictions",
  "market-orders": "Each stall",
};

// The contract explained as a picture: who pays in, what the contract does, where the money ends up.
export function ContractView({ app }: { app: App }) {
  const t = useT();
  const asset = (app.asset ?? "USDC") as "USDC" | "USDT" | "XLM";
  const network = app.network ?? "testnet";
  const base = templateRules(app);
  const added = app.rules ?? [];
  const helpers = integrationsFor(app).filter((i) => !i.core);

  return (
    <div className="flex flex-col gap-4">
      <div className="@container rounded-2xl border border-line bg-surface p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <FileCode2 size={16} className="text-accent" /> {t("How the money moves")}
        </h2>
        <p className="mt-1 text-sm text-muted">{t("Your app has its own contract on Stellar. It holds the money and follows the rules below, nobody can skip them.")}</p>

        <div className="mt-5 grid grid-cols-1 items-stretch gap-3 @xl:grid-cols-[1fr_auto_1.4fr_auto_1fr]">
          <Step icon={<Users size={18} />} title={t("Your users")} lines={[t("Sign in with a passkey"), t("Pay with QR, Pix, transfer or their wallet")]} />
          <Arrow />
          <div className="rounded-2xl bg-card-accent p-4 text-white">
            <p className="text-[11px] font-medium uppercase tracking-wide opacity-80">{t("Your contract on Stellar {network}", { network })}</p>
            {app.contractId && (
              <p className="mt-1 flex items-center gap-1.5 font-mono text-sm">
                {shortHash(app.contractId)} <CopyButton value={app.contractId} compact />
              </p>
            )}
            <div className="mt-2 flex items-center gap-2 text-xs opacity-90">
              <AssetIcon asset={asset} size={16} /> {t("Holds {asset}", { asset })}
            </div>
            <ol className="mt-3 flex flex-col gap-1.5 text-xs">
              {base.map((r, i) => (
                <li key={r} className="flex gap-2 rounded-lg bg-white/10 px-2.5 py-1.5">
                  <span className="opacity-70">{i + 1}</span> <span>{t(r)}</span>
                </li>
              ))}
              {added.map((r, i) => (
                <li key={r + i} className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 text-[#0f1b2d]">
                  <Sparkles size={12} className="shrink-0 text-[#005db4]" /> <span className="min-w-0 flex-1">{r}</span>
                  <span className="shrink-0 text-[10px] font-medium text-[#005db4]">{t("From chat")}</span>
                </li>
              ))}
            </ol>
          </div>
          <Arrow />
          <Step icon={<Landmark size={18} />} title={t(OUT_BY_KIND[app.kind])} lines={[t("Receives {asset} in their wallet", { asset }), t("Or cashes out to a bank account")]} />
        </div>

        {app.contractId && (
          <a
            href={`https://stellar.expert/explorer/${network === "mainnet" ? "public" : "testnet"}/contract/${app.contractId}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
          >
            {t("Every movement is public on stellar.expert")} <ExternalLink size={12} />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Fact icon={<Fingerprint size={16} />} title={t("No seed phrases")} text={t("Each user gets a smart wallet opened with a passkey.")} />
        <Fact icon={<Sparkles size={16} />} title={t("No gas for users")} text={t("Pollar's sponsor wallet pays every network fee.")} />
        <Fact
          icon={<FileCode2 size={16} />}
          title={t("Helpers it calls")}
          text={helpers.length ? helpers.map((h) => h.project.name).join(", ") : t("Only the Pollar template")}
        />
      </div>

      <p className="text-xs text-muted">{t("Want a different rule? Write it in the chat, for example \"refund if the goal is not met by Friday\".")}</p>
    </div>
  );
}

function Step({ icon, title, lines }: { icon: React.ReactNode; title: string; lines: string[] }) {
  return (
    <div className="flex flex-col justify-center rounded-2xl border border-line bg-background p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">{icon}</span>
      <p className="mt-2 text-sm font-semibold">{title}</p>
      {lines.map((l) => (
        <p key={l} className="text-xs text-muted">
          {l}
        </p>
      ))}
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex items-center justify-center text-muted" aria-hidden>
      <ArrowRight size={18} className="rotate-90 @xl:rotate-0" />
    </div>
  );
}

function Fact({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-accent">{icon}</span> {title}
      </p>
      <p className="mt-1 text-xs text-muted">{text}</p>
    </div>
  );
}
