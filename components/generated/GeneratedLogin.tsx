"use client";

import { useState } from "react";
import { Fingerprint } from "lucide-react";
import type { App } from "@/lib/mock/types";
import { Spinner } from "@/components/Modal";
import { Logo } from "@/components/Logo";
import { buildSession, sessionSeedFor, type GeneratedSession } from "./context";
import { PrimaryButton } from "./Sheet";

export function GeneratedLogin({ app, onLogin }: { app: App; onLogin: (s: GeneratedSession) => void }) {
  const [waiting, setWaiting] = useState(false);

  const start = () => {
    setWaiting(true);
    setTimeout(() => onLogin(buildSession(sessionSeedFor(app))), 1200);
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-xl font-bold text-white">
        {app.name.charAt(0)}
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{app.name}</h1>
      <p className="mt-2 max-w-xs text-sm text-muted">Sign in with your passkey. No seed phrase, no app to install.</p>
      {app.shared?.includes("accounts") && (
        <p className="mt-2 max-w-xs text-xs text-muted">Already used another app on Pollar? Your account works here too.</p>
      )}
      <div className="mt-8 w-full max-w-xs">
        {waiting ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-surface p-5">
            <Fingerprint size={28} className="live-dot text-accent" />
            <p className="text-sm font-medium">Waiting for passkey</p>
            <Spinner />
          </div>
        ) : (
          <PrimaryButton onClick={start}>
            <Fingerprint size={16} /> Continue with passkey
          </PrimaryButton>
        )}
      </div>
      <p className="mt-8 flex items-center gap-1.5 text-[11px] text-muted">
        Powered by <Logo size="sm" />
      </p>
    </div>
  );
}
