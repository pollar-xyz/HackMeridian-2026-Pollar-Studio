"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/Button";
import { authErrorMessage, countPasskeys, registerPasskey } from "@/lib/auth/hub";
import { takePasskeyPrompt } from "@/lib/auth/session";
import { useT } from "@/lib/i18n";

// After a login that used no passkey, offer to set one up. Skippable, offered
// again on the next login, and never to an account that already has one.
export function PasskeyPrompt() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);

  useEffect(() => {
    if (!takePasskeyPrompt()) return;
    void countPasskeys().then((count) => {
      if (count === 0) setOpen(true);
    });
  }, []);

  const close = () => {
    setOpen(false);
    setCodes(null);
    setError(null);
  };

  const setUp = async () => {
    setBusy(true);
    setError(null);
    const result = await registerPasskey(t("Passkey"));
    setBusy(false);
    if (!result.ok) setError(t(authErrorMessage(result.code)));
    else if (result.content.recoveryCodes) setCodes(result.content.recoveryCodes);
    else close();
  };

  const download = () => {
    if (!codes) return;
    const url = URL.createObjectURL(new Blob([`${codes.join("\n")}\n`], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "pollar-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal open={open} onClose={close} title={codes ? t("Save your recovery codes") : t("Protect your account with a passkey")}>
      {codes ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">{t("If you lose your passkey, each code lets you sign in once. They are shown only this time.")}</p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-line bg-background p-4 font-mono text-sm">
            {codes.map((code) => <li key={code}>{code}</li>)}
          </ul>
          <div className="flex justify-between gap-2">
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => void navigator.clipboard.writeText(codes.join("\n"))}>{t("Copy")}</Button>
              <Button variant="secondary" size="sm" onClick={download}>{t("Download")}</Button>
            </div>
            <Button size="sm" onClick={close}>{t("I've saved them")}</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">{t("A passkey uses your fingerprint, face or device PIN. Once you set one up, every sign-in asks for it, and you can also sign in with the passkey alone.")}</p>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={close} disabled={busy}>{t("Not now")}</Button>
            <Button onClick={() => void setUp()} disabled={busy}>{t("Set up passkey")}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
