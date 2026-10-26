"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cross2Icon, ImageIcon } from "@radix-ui/react-icons";
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

type Editor = ReturnType<typeof useMarketplaceEditor>;

export function PublishProjectModal({ app, open, onClose }: { app: App; open: boolean; onClose: () => void }) {
  const editor = useMarketplaceEditor(app.id);
  const t = useT();
  return <Modal title={t("Publish to marketplace")} open={open} onClose={editor.saving ? undefined : onClose} size="xl" bare>
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
  const valid = marketplaceInputSchema.safeParse(fields).success;
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
  return <div className="flex max-h-[85dvh] flex-col overflow-y-auto md:flex-row">
    <form onSubmit={publish} className="flex min-w-0 flex-1 flex-col gap-5 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">{t(current?.published ? "Edit marketplace listing" : "Publish to the marketplace")}</h2><p className="mt-1 text-sm text-muted">{t("Choose a public address for your reviewed app. We will configure it and verify it before listing it.")}</p></div><Button variant="ghost" size="icon" type="button" disabled={busy} onClick={onClose} aria-label={t("Close")}><Cross2Icon /></Button></div>
      <label className="flex flex-col gap-1.5 text-sm"><span className="font-medium">{t("App name")}</span><Input value={title} onChange={event => setTitle(event.target.value)} maxLength={80} required className={inputClass} disabled={busy} /></label>
      <label className="flex flex-col gap-1.5 text-sm"><span className="font-medium">{t("App URL")}</span><Input type="url" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://your-app.pollar.studio" required className={inputClass} disabled={busy || !!current?.published} /><span className="text-xs text-muted">{t(current?.published ? "Unpublish before changing the address." : "Choose a subdomain of pollar.studio, different from the preview address.")}</span></label>
      <label className="flex flex-col gap-1.5 text-sm"><span className="flex justify-between"><span className="font-medium">{t("One-liner")}</span><span className="text-xs text-muted">{tagline.length}/80</span></span><Input aria-label={t("One-liner")} value={tagline} onChange={event => setTagline(event.target.value)} minLength={6} maxLength={80} required className={inputClass} disabled={busy} /><span className="text-xs text-muted">{t("Say what the app does, in plain words.")}</span></label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-start gap-2"><span className="text-sm font-medium">{t("Logo")}</span><AppLogo app={preview} art={logo} size={72} /><Button variant="ghost" size="sm" type="button" disabled={busy} onClick={() => logoInput.current?.click()}><ImageIcon />{t("Upload")}</Button><Input ref={logoInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={event => void upload(event.target.files?.[0], "logo")} /></div>
        <div className="flex min-w-0 flex-col gap-2"><span className="text-sm font-medium">{t("Banner")}</span><div className="overflow-hidden rounded-xl border border-line"><Banner app={preview} art={banner} height={100} /></div><Button variant="ghost" size="sm" type="button" disabled={busy} className="self-start" onClick={() => bannerInput.current?.click()}><ImageIcon />{t("Upload")}</Button><Input ref={bannerInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={event => void upload(event.target.files?.[0], "banner")} /><div className="flex flex-wrap gap-2" role="group" aria-label={t("Banner")}>{ART_COLORS.map(color => <button key={color} type="button" disabled={busy} aria-label={color} aria-pressed={banner.color === color && !banner.image} onClick={() => { setBanner({ color, pattern: "dots" }); setLogo({ color, pattern: "none" }); }} className={`h-6 w-6 rounded-full border border-foreground/15 ring-offset-2 ring-offset-surface ${banner.color === color && !banner.image ? "ring-2 ring-accent" : ""}`} style={{ backgroundColor: color }} />)}</div></div>
      </div>
      {(editor.error || uploadError) && <p role="alert" className="text-sm text-danger">{t(editor.error ?? uploadError!)}</p>}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">{app && <Button type="button" variant="ghost" disabled={busy} onClick={() => void remove()}>{t(current?.published ? "Unpublish app" : "Reset publication address")}</Button>}<Button type="button" variant="secondary" className="ml-auto" disabled={busy} onClick={onClose}>{t("Cancel")}</Button><Button type="submit" disabled={!valid || busy}>{t(editor.saving ? "Configuring address and checking app…" : current?.published ? "Save listing" : "Publish")}</Button></div>
    </form>
    <aside className="border-t border-line bg-background p-5 sm:p-6 md:w-72 md:border-l md:border-t-0"><p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">{t("How it will look")}</p><div className="overflow-hidden rounded-2xl border border-line bg-surface"><Banner app={preview} art={banner} height={110} /><div className="px-4 pb-4"><AppLogo app={preview} art={logo} size={52} className="relative -mt-7 border-4 border-surface" /><p className="mt-2 truncate font-semibold">{preview.name}</p><p className="mt-1 text-sm text-muted">{tagline || t("Your one-liner goes here")}</p></div></div></aside>
  </div>;
}
