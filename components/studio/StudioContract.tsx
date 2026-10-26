"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, FileCode2, Fingerprint, RefreshCw, Sparkles } from "lucide-react";
import { useSession } from "@/lib/auth/session";
import { useAgo, useT } from "@/lib/i18n";
import { projectIdSchema } from "@/app/api/chat/schemas/studio-api";
import { projectContractsSchema, type ProjectContract } from "@/lib/schemas/studio-contracts";
import { useStudioResource } from "@/hooks/use-studio-resource";
import { shortHash } from "@/lib/mock/random";
import { Button } from "@/components/ui/Button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CopyButton } from "@/components/CopyButton";
import { Spinner } from "@/components/Modal";

const readContracts = async (response: Response) => projectContractsSchema.parse(await response.json());

// The app's real Soroban contracts: written by the AI, compiled and deployed to testnet by soroban-factory.
export function StudioContract({ appId }: { appId: string }) {
  const t = useT();
  const userId = useSession()?.id;
  const realProject = projectIdSchema.safeParse(appId).success;
  const { data, loading, error, refresh } = useStudioResource(
    realProject ? `/api/contracts?appId=${encodeURIComponent(appId)}` : null,
    userId, readContracts, 10_000,
  );

  if (!realProject) return <div className="p-5 text-sm text-muted">{t("Contracts are available for apps created in Studio.")}</div>;
  if (!userId) return <div className="p-5 text-sm text-muted">{t("Sign in to view the contract.")}</div>;

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5" aria-busy={loading}>
      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold"><FileCode2 size={16} className="text-accent" /> {t("Your contract on Stellar {network}", { network: data?.network ?? "testnet" })}</h2>
            <p className="mt-1 text-sm text-muted">{t("Rules the app enforces on-chain. The AI writes the contract in Rust; Studio compiles it and deploys it to testnet with every message that changes it.")}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={refresh} disabled={loading}><RefreshCw size={13} />{t("Refresh")}</Button>
        </div>
        {data?.address && <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted">
          <Fingerprint size={12} /> {t("Deployed by")} <span className="font-mono">{shortHash(data.address)}</span> <CopyButton value={data.address} compact />
        </p>}
      </section>

      {error && <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-5 text-sm text-danger">
        <span>{t(error)}</span><Button variant="secondary" size="sm" onClick={refresh}>{t("Try again")}</Button>
      </div>}

      {loading ? <div role="status" className="flex items-center justify-center gap-2 p-8 text-sm text-muted"><Spinner />{t("Loading the contract…")}</div> : data && (
        data.contracts.length === 0
          ? <div className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center">
              <Sparkles size={20} className="mx-auto text-accent" />
              <p className="mt-2 text-sm font-medium">{t("This app has no smart contract yet.")}</p>
              <p className="mt-1 text-sm text-muted">{t("Ask the chat for a rule the app must enforce on-chain, for example \"hold the money in a contract and release it when the goal is met\".")}</p>
            </div>
          : data.contracts.map((contract) => <ContractCard key={contract.name} contract={contract} />)
      )}
    </div>
  );
}

function ContractCard({ contract }: { contract: ProjectContract }) {
  const t = useT();
  const ago = useAgo();
  const [open, setOpen] = useState(false);
  const library = contract.files.find((file) => file.path.endsWith("/src/lib.rs")) ?? contract.files[0];
  const deployed = contract.status === "deployed" && contract.contractId;
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <span className="font-mono">{contract.name}</span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${deployed ? "bg-accent-soft text-accent" : "bg-warn-soft text-warn"}`}>{t(deployed ? "Deployed" : "Pending")}</span>
          </h3>
          {deployed
            ? <p className="mt-1 flex flex-wrap items-center gap-1.5 font-mono text-xs"><span className="break-all">{contract.contractId}</span><CopyButton value={contract.contractId!} compact /></p>
            : <p className="mt-1 text-xs text-muted">{t("Written, not deployed yet. If the last message failed, the compile error is in the chat; ask it to fix the contract.")}</p>}
          {contract.deployedAt && <p className="mt-1 text-xs text-muted">{t("Deployed {time}", { time: ago(Date.parse(contract.deployedAt)) })}{contract.wasmHash ? ` · WASM ${shortHash(contract.wasmHash)}` : ""}</p>}
        </div>
        {contract.explorerUrl && <a href={contract.explorerUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
          {t("Every movement is public on stellar.expert")} <ExternalLink size={12} />
        </a>}
      </div>
      {library && <Collapsible open={open} onOpenChange={setOpen} className="mt-4">
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-line bg-background px-3 py-2 text-xs font-medium hover:bg-surface/60">
          <span className="font-mono">{library.path}</span>
          <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <pre className="mt-2 max-h-[32rem] overflow-auto rounded-lg border border-line bg-background p-3 font-mono text-[11px] leading-relaxed"><code>{library.content}</code></pre>
        </CollapsibleContent>
      </Collapsible>}
    </section>
  );
}
