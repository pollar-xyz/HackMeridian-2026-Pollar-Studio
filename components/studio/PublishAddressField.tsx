"use client";

import { GlobeIcon, LockClosedIcon } from "@radix-ui/react-icons";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n";

const DOMAIN = "pollar.studio";
export function PublishAddressField({ url, onChange, disabled, published }: {
  url: string; onChange: (url: string) => void; disabled: boolean; published: boolean;
}) {
  const t = useT();
  let subdomain = "";
  try { subdomain = new URL(url).hostname.replace(new RegExp(`\\.${DOMAIN.replaceAll(".", "\\.")}$`), ""); } catch { /* Empty until an address is entered. */ }
  const valid = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(subdomain);
  const invalid = !!subdomain && !valid;
  return <div className="flex flex-col gap-2 text-sm">
    <label htmlFor="publication-address" className="font-medium">{t("Address")}</label>
    <div className={`flex min-w-0 items-center gap-2 rounded-xl border bg-background px-3 py-2.5 focus-within:border-accent ${invalid ? "border-danger" : "border-line"}`}>
      <GlobeIcon className="shrink-0 text-muted" aria-hidden />
      <Input id="publication-address" aria-label={t("Subdomain")} aria-describedby="publication-address-help" aria-invalid={invalid} value={subdomain} maxLength={63} onChange={event => onChange(`https://${event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")}.${DOMAIN}`)} placeholder="my-app" disabled={disabled || published} className="min-w-0 flex-1 rounded-md border border-line bg-surface px-2.5 py-2 font-mono text-sm outline-none disabled:text-muted" required />
      <span className="shrink-0 font-mono text-xs text-muted sm:text-sm">.{DOMAIN}</span>
      {published && <LockClosedIcon className="shrink-0 text-muted" aria-hidden />}
    </div>
    <p id="publication-address-help" className={`text-xs ${invalid ? "text-danger" : "text-muted"}`}>{t(invalid ? "Use letters, numbers and dashes, with no dash at either end." : published ? "This is your current address. Unpublish before changing it." : "Address availability is confirmed when you publish.")}</p>
  </div>;
}
