"use client";

import { useState } from "react";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import type { App } from "@/lib/mock/types";
import { useStudioStore } from "@/lib/mock/store";
import { useT } from "@/lib/i18n";
import { CopyButton } from "@/components/CopyButton";
import { toast } from "@/components/Toast";
import { Button } from "@/components/ui/Button";

export function EnvTab({ app }: { app: App }) {
  const t = useT();
  const rotateApiKey = useStudioStore((s) => s.rotateApiKey);
  const [reveal, setReveal] = useState(false);
  const mask = (v: string) =>
    reveal ? v : `${v.slice(0, 9)}${"•".repeat(16)}`;

  const vars: Array<{
    key: string;
    value: string;
    secret?: boolean;
    note: string;
  }> = [
    {
      key: "POLLAR_API_KEY",
      value: app.apiKey,
      secret: true,
      note: "Server only. Signs requests to Pollar.",
    },
    {
      key: "NEXT_PUBLIC_POLLAR_APP",
      value: app.slug,
      note: "Public id of this app.",
    },
    {
      key: "STELLAR_NETWORK",
      value: app.network ?? "testnet",
      note: "Where the contract lives.",
    },
    {
      key: "POLLAR_CONTRACT_ID",
      value: app.contractId ?? "",
      note: "Your payment contract.",
    },
    {
      key: "POLLAR_SETTLEMENT_ASSET",
      value: app.asset ?? "USDC",
      note: "Asset users pay in.",
    },
    {
      key: "POLLAR_SPONSOR_WALLET",
      value: app.sponsorWallet,
      note: "Pays your users' network fees. Funded with your credits.",
    },
    ...(app.payoutWallet
      ? [
          {
            key: "POLLAR_PAYOUT_WALLET",
            value: app.payoutWallet,
            note: "Where your earnings go.",
          },
        ]
      : []),
  ];
  const dotenv = vars.map((v) => `${v.key}=${v.value}`).join("\n");

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold">
              {t("Environment variables")}
            </h2>
            <p className="text-xs text-muted">
              {t(
                "What your app runs with. Paste them into .env.local if you work on the code yourself.",
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setReveal((r) => !r)}
            >
              {reveal ? <EyeOff size={14} /> : <Eye size={14} />}{" "}
              {reveal ? t("Hide") : t("Reveal")}
            </Button>
            <CopyButton value={dotenv} label={t("Copy .env")} />
          </div>
        </div>
        <ul className="divide-y divide-line">
          {vars.map((v) => (
            <li
              key={v.key}
              className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="sm:w-64 sm:shrink-0">
                <p className="font-mono text-xs font-semibold">{v.key}</p>
                <p className="text-xs text-muted">{t(v.note)}</p>
              </div>
              <code className="min-w-0 flex-1 truncate rounded-md bg-background px-2 py-1.5 font-mono text-xs">
                {v.secret ? mask(v.value) : v.value}
              </code>
              <div className="flex shrink-0 gap-1">
                <CopyButton value={v.value} compact />
                {v.key === "POLLAR_API_KEY" && (
                  <Button
                    variant="unstyled"
                    type="button"
                    onClick={() => {
                      rotateApiKey(app.id);
                      toast(t("API key rotated"));
                    }}
                    title={t("Rotate")}
                    aria-label={t("Rotate")}
                    className="rounded p-1 text-muted hover:bg-background hover:text-foreground"
                  >
                    <RefreshCw size={14} />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-muted">
        {t(
          "Rotating the API key takes effect on the next deploy. Never share the key in client code.",
        )}
      </p>
    </div>
  );
}
