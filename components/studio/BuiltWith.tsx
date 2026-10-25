"use client";

import { useState } from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import type { App } from "@/lib/mock/types";
import { integrationsFor, type Integration } from "@/lib/mock/ecosystem";
import { useT } from "@/lib/i18n";
import { shortHash } from "@/lib/mock/random";
import { CopyButton } from "@/components/CopyButton";
import { AssetIcon } from "@/components/AssetIcons";
import { Mark } from "@/components/Logo";

// Logos live in public/brand/partners. Missing ones fall back to the first letter.
const LOGOS: Record<string, string> = {
  stellar: "/brand/partners/stellar.png",
  defindex: "/brand/partners/defindex.png",
  trustless: "/brand/partners/trustless.png",
  soroswap: "/brand/partners/soroswap.png",
  reflector: "/brand/partners/reflector.png",
  anclap: "/brand/partners/anclap.png",
  expert: "/brand/partners/expert.png",
  blend: "/brand/partners/blend.png",
  passkeys: "/brand/partners/github.png",
  anchors: "/brand/partners/stellar.png",
};

export function ProjectLogo({ id, name, asset, size = 36 }: { id: string; name: string; asset?: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (id === "pollar") return <Mark size={size} />;
  if (id === "usdc") return <AssetIcon asset={(asset as "USDC" | "USDT" | "XLM") ?? "USDC"} size={size} />;
  const src = LOGOS[id];
  if (!src || failed) {
    return (
      <span className="flex shrink-0 items-center justify-center rounded-lg bg-accent-soft font-semibold text-accent" style={{ width: size, height: size }}>
        {name.charAt(0)}
      </span>
    );
  }
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      unoptimized
      onError={() => setFailed(true)}
      className="shrink-0 rounded-lg bg-white object-contain"
      style={{ width: size, height: size }}
    />
  );
}

function ServiceChip({ item, asset }: { item: Integration; asset: string }) {
  const t = useT();
  return (
    <a
      href={item.project.url}
      target="_blank"
      rel="noreferrer"
      title={t(item.project.what)}
      className="flex min-w-0 items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2 transition-colors hover:border-accent"
    >
      <ProjectLogo id={item.project.id} name={item.project.name} asset={asset} size={28} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 text-sm font-semibold">
          <span className="truncate">{item.project.name}</span>
          <ExternalLink size={11} className="shrink-0 text-muted" />
        </span>
        <span className="block text-xs text-muted">{t(item.role)}</span>
      </span>
    </a>
  );
}

// How one payment travels through the app, step by step, with the services that make each step happen.
export function BuiltWith({ app }: { app: App }) {
  const t = useT();
  const items = integrationsFor(app);
  const byId = (id: string) => items.find((i) => i.project.id === id);
  const asset = app.asset ?? "USDC";
  const network = app.network ?? "testnet";
  const specific = items.filter((i) => !i.core);

  const steps: Array<{ title: string; text: string; services: Integration[]; contract?: boolean }> = [
    {
      title: t("A user opens your link"),
      text: t("They sign in with Face ID or a fingerprint. A smart wallet is created for them on the spot, no seed phrase."),
      services: [byId("passkeys"), byId("pollar")].filter(Boolean) as Integration[],
    },
    {
      title: t("They add money and pay"),
      text: t("Cash in with a QR in Bolivia, Pix in Brazil or a bank transfer in Argentina. It arrives as {asset}.", { asset }),
      services: [byId("anchors"), byId("usdc")].filter(Boolean) as Integration[],
    },
    {
      title: t("Your contract holds the money"),
      text: t("The payment lands in your app's own contract on Stellar {network}. Your sponsor wallet pays the network fee.", { network }),
      services: [byId("stellar")].filter(Boolean) as Integration[],
      contract: true,
    },
    ...(specific.length
      ? [
          {
            title: t("Extra services do their part"),
            text: t("These were picked for this kind of app."),
            services: specific,
          },
        ]
      : []),
    {
      title: t("Money goes out, in public"),
      text: t("It reaches the right person or a bank account, and every movement can be checked by anyone."),
      services: [byId("expert")].filter(Boolean) as Integration[],
    },
  ];

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="text-base font-semibold">{t("How a payment travels through your app")}</h2>
      <p className="mt-1 text-sm text-muted">{t("Every step, and the Stellar services that make it happen. Tap a service to learn more.")}</p>

      <ol className="mt-6 flex flex-col">
        {steps.map((step, i) => (
          <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
            {i < steps.length - 1 && <span className="absolute left-4 top-9 h-[calc(100%-2.25rem)] w-px bg-line" aria-hidden />}
            <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{step.title}</p>
              <p className="mt-0.5 text-sm text-muted">{step.text}</p>
              {step.contract && app.contractId && (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-card-accent px-3 py-2 text-white">
                  <AssetIcon asset={asset as "USDC" | "USDT" | "XLM"} size={20} />
                  <span className="text-xs opacity-80">{t("Your contract")}</span>
                  <span className="font-mono text-sm">{shortHash(app.contractId)}</span>
                  <CopyButton value={app.contractId} compact />
                  <a
                    href={`https://stellar.expert/explorer/${network === "mainnet" ? "public" : "testnet"}/contract/${app.contractId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto inline-flex items-center gap-1 text-xs opacity-90 hover:underline"
                  >
                    stellar.expert <ExternalLink size={11} />
                  </a>
                </div>
              )}
              {step.services.length > 0 && (
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {step.services.map((s) => (
                    <ServiceChip key={s.project.id} item={s} asset={asset} />
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
