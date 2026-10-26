"use client";

import { useState } from "react";
import { Blocks, ChevronDown, Coins, Fuel, Globe, Layers, RefreshCw } from "lucide-react";
import { useSession } from "@/lib/auth/session";
import { useAgo, useT } from "@/lib/i18n";
import { projectIdSchema } from "@/app/api/chat/schemas/studio-api";
import { builtWithResponseSchema, builtWithTools, type UsageStatus } from "@/lib/schemas/studio-built-with";
import { useStudioResource } from "@/hooks/use-studio-resource";
import { Button } from "@/components/ui/Button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Spinner } from "@/components/Modal";

const readBuiltWith = async (response: Response) => builtWithResponseSchema.parse(await response.json());
const USAGE: Record<UsageStatus, { label: string; description: string; className: string }> = {
  used: { label: "Used", description: "Found in the generated app.", className: "bg-accent-soft text-accent" },
  configured: { label: "Configured", description: "Configured for this project; usage has not been confirmed.", className: "bg-background text-muted" },
  not_used: { label: "Not used", description: "No usage found in the latest generated app.", className: "bg-background text-muted" },
  declared_not_found: { label: "Unverified", description: "Reported by the app, but no supporting code was found.", className: "bg-warn-soft text-warn" },
  reported: { label: "Reported", description: "Listed in the app summary; usage has not been verified.", className: "bg-background text-muted" },
};
const ICONS: Record<string, typeof Layers> = { blockchain: Blocks, gas: Fuel, payments: Coins, countries: Globe, ramps: Coins };

type Tool = ReturnType<typeof builtWithTools>[number];

export function StudioBuiltWith({ appId }: { appId: string }) {
  const t = useT();
  const ago = useAgo();
  const userId = useSession()?.id;
  const realProject = projectIdSchema.safeParse(appId).success;
  const { data, loading, error, refresh } = useStudioResource(
    realProject ? `/api/built-with?appId=${encodeURIComponent(appId)}` : null,
    userId, readBuiltWith, 10_000,
  );
  const tools = data ? builtWithTools(data) : [];

  if (!realProject) return <div className="p-5 text-sm text-muted">{t("Tool usage is available for apps created in Studio.")}</div>;
  if (!userId) return <div className="p-5 text-sm text-muted">{t("Sign in to view app tools.")}</div>;

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5" aria-busy={loading}>
      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">{t("Built with")}</h2>
            <p className="mt-1 text-sm text-muted">{t("Tools and services reported for this app.")}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw size={13} />{t("Refresh")}
          </Button>
        </div>
        {data?.summary?.description && <p className="mt-4 whitespace-pre-wrap break-words text-sm">{data.summary.description}</p>}
        {data?.summary?.updatedAt && <p className="mt-3 text-xs text-muted">{t("Updated {time}", { time: ago(Date.parse(data.summary.updatedAt)) })}</p>}
      </section>

      {error && <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-5 text-sm text-danger">
        <span>{t(error)}</span><Button variant="secondary" size="sm" onClick={refresh}>{t("Try again")}</Button>
      </div>}
      {loading ? <div role="status" className="flex items-center justify-center gap-2 p-8 text-sm text-muted"><Spinner />{t("Loading app tools…")}</div> : data && <>
        {!data.summary && <p className="rounded-xl border border-line bg-surface p-4 text-sm text-muted">
          {t("Build your app to see which tools it uses. Project settings are shown below.")}
        </p>}
        {tools.length ? <ul className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {tools.map(tool => <ToolCard key={tool.tool} tool={tool} />)}
        </ul> : <div className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-muted">
          <p className="font-medium text-ink">{t("No tools reported yet")}</p>
          <p className="mt-1">{t("Send a message in the chat to build your app and update its tools.")}</p>
        </div>}
        {data.summary?.lastChange && <section className="rounded-2xl border border-line bg-surface p-5">
          <h3 className="text-sm font-semibold">{t("Latest change")}</h3>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted">{data.summary.lastChange}</p>
        </section>}
      </>}
    </div>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const Icon = ICONS[tool.tool] ?? Layers;
  const status = USAGE[tool.status];

  return (
    <li className="min-w-0 rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent"><Icon size={20} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-sm font-semibold">{t(tool.label)}</h3>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${status.className}`}>{t(status.label)}</span>
          </div>
          <p className="mt-1 text-xs text-muted">{t(status.description)}</p>
        </div>
      </div>
      {tool.values.length > 0 && <ul className="mt-4 flex flex-wrap gap-1.5">
        {tool.values.map((value, index) => <li key={`${value.id}:${index}`} className="max-w-full break-words rounded-lg border border-line bg-background px-2.5 py-1 text-xs">{t(value.label)}</li>)}
      </ul>}
      {tool.evidence.length > 0 && <Collapsible open={open} onOpenChange={setOpen} className="mt-4 border-t border-line pt-3">
        <CollapsibleTrigger asChild>
          <Button variant="unstyled" className="flex items-center gap-1 text-xs text-muted hover:text-ink" aria-label={`${t("View evidence")}: ${t(tool.label)}`}>
            {t("View evidence")}<ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="mt-2 space-y-1 text-xs text-muted">
            {tool.evidence.map((evidence, index) => <li key={index} className="break-words font-mono [overflow-wrap:anywhere]">{evidence}</li>)}
          </ul>
        </CollapsibleContent>
      </Collapsible>}
    </li>
  );
}
