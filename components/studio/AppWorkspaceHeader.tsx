"use client";

import { useState } from "react";
import { Lock, Rocket, Store } from "lucide-react";
import type { App } from "@/lib/mock/types";
import { AppLogo } from "@/components/studio/ListingArt";
import { CopyButton } from "@/components/CopyButton";
import { Button, buttonClass } from "@/components/ui/Button";
import { useT } from "@/lib/i18n";
import { PublishListingModal } from "@/components/studio/PublishListingModal";
import { PublishModal } from "@/components/studio/PublishModal";
import { PublishProjectModal } from "./PublishProjectModal";
import { MainnetModal } from "@/components/studio/MainnetModal";

const NET_STYLE = {
  testnet: {
    button: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300",
    dot: "bg-amber-400",
  },
  mainnet: {
    button: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
} as const;

export function AppWorkspaceHeader({ app, origin }: { app: App; origin?: string }) {
  const t = useT();
  const [publishOpen, setPublishOpen] = useState(false);
  const [listingOpen, setListingOpen] = useState(false);
  const [mainnetOpen, setMainnetOpen] = useState(false);
  const [mainnetSub, setMainnetSub] = useState<string>();
  const sub = app.url.replace("https://", "").replace(".pollar.app", "");
  const realProject = app.id.startsWith("prj_");
  const live = realProject ? !!app.listing : app.status === "published";
  const ready = !!origin || (!realProject && !!app.previewSha);
  const hasChanges = live && app.previewSha !== app.publishedSha;
  const net = app.network === "mainnet" && live ? "mainnet" : "testnet";
  const iconBtn = "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-background hover:text-foreground";

  return (
    <>
      <div className="flex shrink-0 items-center gap-1.5 border-b border-foreground/15 bg-surface px-3 py-2">
        <span className="mr-1 hidden shrink-0 items-center gap-1.5 md:flex" aria-hidden="true">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </span>
        <a href={origin ?? (ready ? `/preview/${app.slug}` : undefined)} target="_blank" rel="noreferrer" title={ready ? t("Open in new tab") : undefined} className="group ml-2 flex min-w-0 flex-1 items-center gap-2 rounded-full bg-background px-3 py-1.5 text-sm transition-colors hover:bg-accent-soft/60">
          <Lock size={13} className="shrink-0 text-accent" />
          <span className="truncate font-mono text-[13px]">{origin ? origin.replace(/^https?:\/\//, "").replace(/\/$/, "") : app.id.startsWith("prj_") ? <span className="text-muted">Esperando URL de la app…</span> : live ? <><span className="text-foreground">{sub}</span><span className="text-muted">.pollar.app</span></> : <span className="text-muted">preview--{sub}.pollar.app</span>}</span>
          <span className={`ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-px text-[11px] font-semibold ${NET_STYLE[net].button}`}><span className={`h-1.5 w-1.5 rounded-full ${NET_STYLE[net].dot}`} />{net === "mainnet" ? "Mainnet" : "Testnet"}</span>
          {hasChanges && <span className="hidden shrink-0 rounded-full bg-warn-soft px-2 py-px text-[11px] font-medium text-warn sm:inline">{t("Unpublished changes")}</span>}
        </a>
        {(live || origin) && <CopyButton value={origin ?? app.url} compact />}
        {!realProject && live && app.network === "mainnet" && <Button variant="unstyled" type="button" onClick={() => setListingOpen(true)} title={app.listing ? t("In marketplace") : t("Publish to marketplace")} aria-label={app.listing ? t("In marketplace") : t("Publish to marketplace")} className={iconBtn}>{app.listing ? <AppLogo app={app} art={app.listing.logo} size={18} className="rounded" /> : <Store size={15} />}</Button>}
        <Button variant="unstyled" type="button" onClick={() => setPublishOpen(true)} disabled={!ready} className={`${live && !hasChanges ? buttonClass("secondary", "sm", "ml-1 shrink-0") : buttonClass("primary", "sm", "ml-1 shrink-0")} relative`}>
          {hasChanges && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-amber-400" />}
          <Rocket size={13} />{live ? (hasChanges ? t("Update") : t("Published")) : t("Publish")}
        </Button>
      </div>
      {realProject && publishOpen ? <PublishProjectModal app={app} open onClose={() => setPublishOpen(false)} /> : <PublishModal app={app} open={publishOpen} onClose={() => setPublishOpen(false)} onListInMarketplace={() => setListingOpen(true)} onMainnet={(subdomain) => { setMainnetSub(subdomain); setMainnetOpen(true); }} />}
      <PublishListingModal app={app} open={listingOpen} onClose={() => setListingOpen(false)} />
      <MainnetModal app={app} open={mainnetOpen} publishTo={mainnetSub} onClose={() => setMainnetOpen(false)} onListInMarketplace={() => setListingOpen(true)} />
    </>
  );
}
