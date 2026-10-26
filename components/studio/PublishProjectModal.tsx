"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cross2Icon, ImageIcon, GlobeIcon, RocketIcon, TokensIcon, LayersIcon, CheckCircledIcon } from "@radix-ui/react-icons";
import type { App, ListingArt } from "@/lib/mock/types";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { useT } from "@/lib/i18n";
import { toast } from "@/components/Toast";
import { useMarketplaceEditor } from "@/hooks/use-marketplace-editor";
import { marketplaceInputSchema } from "@/lib/schemas/marketplace";
import { AppLogo, ART_COLORS, Banner, readImage } from "./ListingArt";

import { PublishAddressField } from "./PublishAddressField";
import { PublishSharedSettings } from "./PublishSharedSettings";

type Editor = ReturnType<typeof useMarketplaceEditor>;

export function PublishProjectModal({ app, open, onClose }: { app: App; open: boolean; onClose: () => void }) {
  const editor = useMarketplaceEditor(app.id);
  const t = useT();
  return <Modal title={t("Publish settings")} open={open} onClose={editor.saving ? undefined : onClose} size="lg" bare>
    {editor.loading ? <div className="space-y-4 p-6" aria-busy="true"><div className="h-6 w-2/3 animate-pulse rounded bg-background" /><div className="h-60 animate-pulse rounded-xl bg-background" /></div>
      : app && !editor.initial ? <div className="p-6 text-sm" role="alert"><p>{t(editor.error ?? "Could not load the marketplace listing.")}</p><Button variant="secondary" onClick={() => void editor.reload()}>{t("Try again")}</Button></div>
      : <ListingForm app={app} editor={editor} onClose={onClose} />}
  </Modal>;
}

function ListingForm({ app, editor, onClose }: { app: App; editor: Editor; onClose: () => void }) {
  const t = useT();
  const router = useRouter();
  const current = editor.initial?.marketplace;
  const [title, setTitle] = useState(current?.title ?? editor.initial?.name ?? app?.name ?? "");
  // The project's stable URL is supplied by the backend. Never default to a per-job preview URL.
  const [url, setUrl] = useState(current?.url ?? (editor.initial?.url ? editor.initial.url.replace(/^(https:\/\/)([^.]+)/, "$1$2-live") : ""));
  const [tagline, setTagline] = useState(current?.tagline ?? "");
  const [logo, setLogo] = useState<ListingArt>(current?.logo ?? { color: ART_COLORS[0], pattern: "none" });
  const [banner, setBanner] = useState<ListingArt>(current?.banner ?? { color: ART_COLORS[0], pattern: "dots" });
  const [publishedUrl, setPublishedUrl] = useState<string>();
  const [uploadError, setUploadError] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const logoInput = useRef<HTMLInputElement>(null), bannerInput = useRef<HTMLInputElement>(null);
  const preview = { name: title || t("New app"), kind: app?.kind ?? "market-orders" as const };
  const fields = { title, url, tagline, logo, banner };
  const valid = marketplaceInputSchema.safeParse(fields).success && /^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.pollar\.studio\/?$/.test(url);
  const busy = editor.saving || uploading;

  async function upload(file: File | undefined, kind: "logo" | "banner") {
    if (!file) return;
    setUploading(true); setUploadError(undefined);
    try {
      const image = await readImage(file, kind === "logo" ? 160 : 960, kind === "logo" ? 160 : 360);
      if (image.length > 350_000) throw new Error("This image is too large. Choose a smaller image.");
      if (kind === "logo") setLogo(value => ({ ...value, image })); else setBanner(value => ({ ...value, image }));
    } catch (error) { setUploadError(error instanceof Error ? error.message : "Could not read the file"); }
    finally { setUploading(false); }
  }
  async function publish(event: React.FormEvent) {
    event.preventDefault(); if (!valid || busy) return;
    const saved = await editor.save(fields);
    if (saved?.marketplace?.published) { setPublishedUrl(saved.marketplace.url); router.refresh(); }
  }
  async function remove() {
    if (await editor.remove()) { toast(t("Removed from the marketplace")); onClose(); router.refresh(); }
  }

  if (publishedUrl) return <div className="flex flex-col gap-5 p-6"><h2 className="text-xl font-semibold">{t("Your app is live")}</h2><p className="break-all text-sm text-muted">{publishedUrl}</p><p className="text-sm text-muted">{t("Your app is available at this address and listed in the marketplace.")}</p><div className="flex flex-wrap gap-3"><a href={publishedUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-accent hover:underline">{t("Open app")}</a><Link href="/studio/marketplace" className="font-medium text-accent hover:underline">{t("Marketplace")}</Link><Button className="ml-auto" onClick={onClose}>{t("Done")}</Button></div></div>;
  const tools = editor.initial?.tools;
  const assets = tools?.payments?.join(", ") || (tools?.payments ? "XLM" : undefined);
  const host = (() => { try { return new URL(url).host; } catch { return "your-app.pollar.studio"; } })();

  return <form onSubmit={publish} className="flex max-h-[88dvh] min-h-0 flex-col">
    <header className="flex shrink-0 items-start justify-between gap-3 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
      <div><h2 className="text-lg font-semibold tracking-tight">{t(current?.published ? "Publish settings" : "Publish your app")}</h2><p className="mt-1 text-sm text-muted">{t(current?.published ? "Your app is live. Update its listing or take it down." : "You reviewed the preview. Pick an address and make it live.")}</p></div>
      <Button variant="ghost" size="icon" type="button" disabled={busy} onClick={onClose} aria-label={t("Close")}><Cross2Icon /></Button>
    </header>

    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6">
      <PublishAddressField url={url} onChange={setUrl} disabled={busy} published={!!current?.published} />
      <PublishSharedSettings />

      <section aria-label={t("Marketplace listing")} className="flex flex-col gap-4 border-t border-line pt-5">
        <div><h3 className="text-sm font-medium">{t("Marketplace listing")}</h3><p className="mt-1 text-xs text-muted">{t("A logo, a banner and one line. That is what people see before they open your app.")}</p></div>
        <label className="flex flex-col gap-2 text-sm"><span className="font-medium">{t("App name")}</span><Input value={title} onChange={event => setTitle(event.target.value)} maxLength={80} required className={inputClass} disabled={busy} /></label>
        <label className="flex flex-col gap-2 text-sm"><span className="flex justify-between"><span className="font-medium">{t("One-liner")}</span><span className="text-xs text-muted">{tagline.length}/80</span></span><Input aria-label={t("One-liner")} value={tagline} onChange={event => setTagline(event.target.value)} minLength={6} maxLength={80} required className={inputClass} disabled={busy} /></label>
        <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 sm:grid-cols-[112px_minmax(0,1fr)]">
          <div className="flex flex-col items-start gap-2"><span className="text-sm font-medium">{t("Logo")}</span><AppLogo app={preview} art={logo} size={72} /><Button variant="ghost" size="sm" type="button" disabled={busy} onClick={() => logoInput.current?.click()}><ImageIcon />{t("Upload")}</Button><Input ref={logoInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={event => void upload(event.target.files?.[0], "logo")} /></div>
          <div className="flex min-w-0 flex-col gap-2"><span className="text-sm font-medium">{t("Banner")}</span><div className="overflow-hidden rounded-xl border border-line"><Banner app={preview} art={banner} height={88} /></div><div className="flex flex-wrap items-center justify-between gap-2"><Button variant="ghost" size="sm" type="button" disabled={busy} onClick={() => bannerInput.current?.click()}><ImageIcon />{t("Upload")}</Button><div className="flex flex-wrap gap-1.5" role="group" aria-label={t("Banner")}>{ART_COLORS.map(color => <button key={color} type="button" disabled={busy} aria-label={color} aria-pressed={banner.color === color && !banner.image} onClick={() => { setBanner({ color, pattern: "dots" }); setLogo({ color, pattern: "none" }); }} className={`h-5 w-5 rounded-full border border-foreground/15 ring-offset-2 ring-offset-surface transition-transform active:scale-95 ${banner.color === color && !banner.image ? "ring-2 ring-accent" : ""}`} style={{ backgroundColor: color }} />)}</div></div><Input ref={bannerInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={event => void upload(event.target.files?.[0], "banner")} /></div>
        </div>
      </section>

      <ul aria-label={t("Publish summary")} className="flex flex-col gap-3 rounded-xl bg-background p-4 text-sm">
        <li className="flex items-start gap-3"><GlobeIcon className="mt-0.5 shrink-0 text-accent" /><span className="min-w-0">{t(current?.published ? "Live at" : "Publish at")} <span className="break-all font-mono font-medium">{host}</span></span></li>
        {tools?.blockchain && <li className="flex items-start gap-3"><LayersIcon className="mt-0.5 shrink-0 text-accent" /><span>{t("Blockchain")}: <span className="capitalize">{tools.blockchain}</span></span></li>}
        {assets && <li className="flex items-start gap-3"><TokensIcon className="mt-0.5 shrink-0 text-accent" /><span>{t("Payment assets")}: {assets}</span></li>}
        <li className="flex items-start gap-3"><CheckCircledIcon className="mt-0.5 shrink-0 text-accent" /><span>{t("Listed in the marketplace after the public address is verified.")}</span></li>
      </ul>
      {(editor.error || uploadError) && <p role="alert" className="rounded-lg border border-danger/25 bg-danger/5 px-3 py-2.5 text-sm text-danger">{t(editor.error ?? uploadError!)}</p>}
      {editor.saving && <p role="status" aria-live="polite" className="text-sm text-muted">{t("Configuring address and checking app…")}</p>}
    </div>

    <footer className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 border-t border-line bg-surface px-5 py-4 sm:px-6">
      <Button type="button" variant="ghost" className="justify-self-start px-1 text-xs sm:px-3 sm:text-sm" disabled={busy} onClick={() => void remove()}>{t(current?.published ? "Unpublish" : "Reset address")}</Button>
      <Button type="button" variant="secondary" className="px-3 text-xs sm:px-4 sm:text-sm" disabled={busy} onClick={onClose}>{t("Cancel")}</Button>
      <Button type="submit" className="px-3 text-xs sm:px-4 sm:text-sm" disabled={!valid || busy}><RocketIcon className="hidden sm:block" />{t(editor.saving ? "Publishing…" : current?.published ? "Save changes" : "Publish")}</Button>
    </footer>
  </form>;
}
