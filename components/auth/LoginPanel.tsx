"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { MfaStep } from "@/components/auth/MfaStep";
import {
  authErrorMessage,
  googleLoginUrl,
  isMfaChallenge,
  loginWithPasskey,
  PASSKEYS_ENABLED,
  sendEmailCode,
  verifyEmailCode,
} from "@/lib/auth/hub";
import { type SessionData, signIn, useSession } from "@/lib/auth/session";
import { useT } from "@/lib/i18n";

// The hub-api login, the same as the dashboard's: email code, Google or a
// passkey, then the passkey as second factor when the account has one.
export function LoginPanel() {
  const t = useT();
  const router = useRouter();
  const session = useSession();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) router.replace("/studio");
  }, [session, router]);

  const enter = (next: SessionData, offerPasskey: boolean) => signIn(next, offerPasskey);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    await action();
    setBusy(false);
  };

  const submitEmail = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    void run(async () => {
      const result = await sendEmailCode(email.trim());
      if (result.ok) setStep("code");
      else setError(t("We couldn't send the code. Try again."));
    });
  };

  const submitCode = (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) return;
    void run(async () => {
      const result = await verifyEmailCode(email.trim(), code.trim());
      if (!result.ok) {
        setError(t(authErrorMessage(result.code)));
        return;
      }
      if (isMfaChallenge(result.content)) setMfaToken(result.content.mfaToken);
      else enter(result.content, true);
    });
  };

  const passkey = () =>
    void run(async () => {
      const result = await loginWithPasskey();
      if (result.ok) enter(result.content, false);
      else setError(t(authErrorMessage(result.code)));
    });

  const reset = () => {
    setStep("email");
    setCode("");
    setMfaToken(null);
    setError(null);
  };

  if (mfaToken) return <MfaStep mfaToken={mfaToken} onSession={(next) => enter(next, false)} onBack={reset} />;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
      {step === "email" ? (
        <form onSubmit={submitEmail} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">{t("Email")}</span>
            <Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="text-base" placeholder="you@example.com" />
          </label>
          <Button type="submit" disabled={busy}>{t("Continue with email")}</Button>
        </form>
      ) : (
        <form onSubmit={submitCode} className="flex flex-col gap-3">
          <p className="text-sm text-muted">{t("We sent a 6-digit code to {email}.", { email })}</p>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">{t("Code")}</span>
            <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} required autoFocus value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} className="font-mono text-base tracking-widest" />
          </label>
          <Button type="submit" disabled={busy || code.length !== 6}>{t("Verify")}</Button>
          <button type="button" className="text-sm text-muted hover:text-foreground" onClick={reset}>{t("Use another email")}</button>
        </form>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
      {step === "email" && (
        <>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" />
            {t("or")}
            <span className="h-px flex-1 bg-line" />
          </div>
          <Button variant="secondary" disabled={busy} onClick={() => window.location.assign(googleLoginUrl())}>{t("Continue with Google")}</Button>
          {PASSKEYS_ENABLED && (
            <Button variant="secondary" disabled={busy} onClick={passkey}>
              <Fingerprint size={16} />
              {t("Sign in with a passkey")}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
