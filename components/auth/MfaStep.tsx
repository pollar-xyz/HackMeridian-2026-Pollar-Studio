"use client";

import { useState } from "react";
import { Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { authErrorMessage, confirmWithPasskey, confirmWithRecoveryCode, type HubResult } from "@/lib/auth/hub";
import type { SessionData } from "@/lib/auth/session";
import { useT } from "@/lib/i18n";

// Second factor after an email code or Google login, for an account that has a
// passkey. A recovery code stands in for a lost one.
export function MfaStep({
  mfaToken,
  onSession,
  onBack,
}: {
  mfaToken: string;
  onSession: (session: SessionData) => void;
  onBack: () => void;
}) {
  const t = useT();
  const [mode, setMode] = useState<"passkey" | "recovery">("passkey");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attempt = async (run: () => Promise<HubResult<SessionData>>) => {
    setBusy(true);
    setError(null);
    const result = await run();
    setBusy(false);
    if (result.ok) onSession(result.content);
    else setError(t(authErrorMessage(result.code)));
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
      <div>
        <h2 className="text-base font-semibold">{t("Confirm it's you")}</h2>
        <p className="mt-1 text-sm text-muted">{t("Your account is protected with a passkey. Use it to finish signing in.")}</p>
      </div>
      {mode === "passkey" ? (
        <Button disabled={busy} onClick={() => void attempt(() => confirmWithPasskey(mfaToken))}>
          <Fingerprint size={16} />
          {t("Use passkey")}
        </Button>
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (code.trim()) void attempt(() => confirmWithRecoveryCode(mfaToken, code));
          }}
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">{t("Recovery code")}</span>
            <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="xxxxx-xxxxx" autoComplete="one-time-code" autoFocus className="font-mono" />
          </label>
          <Button type="submit" disabled={busy || !code.trim()}>{t("Continue")}</Button>
        </form>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex items-center justify-between text-sm">
        <button type="button" className="text-muted hover:text-foreground" onClick={onBack}>{t("Back to login")}</button>
        <button
          type="button"
          className="font-medium text-accent hover:underline"
          onClick={() => {
            setMode(mode === "passkey" ? "recovery" : "passkey");
            setError(null);
          }}
        >
          {mode === "passkey" ? t("Use a recovery code instead") : t("Use a passkey instead")}
        </button>
      </div>
    </div>
  );
}
