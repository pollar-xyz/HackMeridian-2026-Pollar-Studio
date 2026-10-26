"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Modal, Spinner } from "@/components/Modal";
import { useStudioApps } from "@/hooks/use-studio-apps";
import { forgetStudioApp } from "@/lib/ai/studio-apps-store";
import { useT } from "@/lib/i18n";

/** Deletes a Studio project for good. Typing its name guards against a slip, since nothing can bring it back. */
export function DeleteProject({ appId }: { appId: string }) {
  const t = useT();
  const router = useRouter();
  const { apps } = useStudioApps();
  const name = apps.find((app) => app.id === appId)?.name ?? "";
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch("/api/projects", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ appId }) });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "Could not delete the app. Please try again.");
      forgetStudioApp(appId);
      router.replace("/studio");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not delete the app. Please try again.");
      setDeleting(false);
    }
  }

  const close = () => { if (!deleting) { setOpen(false); setTyped(""); setError(null); } };

  return (
    <section className="rounded-2xl border border-danger/25 bg-surface p-5">
      <h2 className="text-sm font-semibold text-danger">{t("Danger zone")}</h2>
      <p className="mt-1 text-xs text-muted">{t("Deleting the app removes its previews, published address, database and chat. Its Pollar app is archived, so you can restore it from the Pollar dashboard.")}</p>
      <Button variant="danger" size="sm" type="button" onClick={() => setOpen(true)} className="mt-3"><Trash2 size={13} />{t("Delete app")}</Button>
      <Modal open={open} title={t("Delete this app?")} onClose={deleting ? undefined : close}>
        <p className="text-sm text-muted">{t("This cannot be undone. Its data, including what users saved in its database, is deleted.")}</p>
        <label className="mt-4 block text-sm">
          {name ? t("Type {name} to confirm", { name }) : t("Type delete to confirm")}
          <Input value={typed} onChange={(event) => setTyped(event.target.value)} disabled={deleting} autoComplete="off" className="mt-1.5" />
        </label>
        {error && <p role="alert" className="mt-3 text-sm text-danger">{t(error)}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" size="sm" type="button" onClick={close} disabled={deleting}>{t("Cancel")}</Button>
          <Button variant="danger" size="sm" type="button" onClick={remove} disabled={deleting || typed.trim() !== (name || "delete")}>
            {deleting && <Spinner className="h-3.5 w-3.5" />}{t(deleting ? "Deleting…" : "Delete app")}
          </Button>
        </div>
      </Modal>
    </section>
  );
}
