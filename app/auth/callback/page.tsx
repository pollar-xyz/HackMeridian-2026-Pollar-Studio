"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Spinner } from "@/components/Modal";
import { MfaStep } from "@/components/auth/MfaStep";
import { exchangeOAuthCode, isMfaChallenge } from "@/lib/auth/hub";
import { signIn } from "@/lib/auth/session";
import { useT } from "@/lib/i18n";

// hub-api bounces the browser here after Google with a one-time `?code=`.
function Callback() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const code = params.get("code");
  const failed = !!params.get("error") || !code;
  const [error, setError] = useState(false);
  const [mfaToken, setMfaToken] = useState<string | null>(null);

  useEffect(() => {
    if (failed || !code) return;
    void exchangeOAuthCode(code).then((result) => {
      if (!result.ok) return setError(true);
      if (isMfaChallenge(result.content)) return setMfaToken(result.content.mfaToken);
      signIn(result.content, true);
      router.replace("/studio");
    });
  }, [code, failed, router]);

  if (mfaToken) {
    return (
      <MfaStep
        mfaToken={mfaToken}
        onSession={(session) => {
          signIn(session, false);
          router.replace("/studio");
        }}
        onBack={() => router.replace("/")}
      />
    );
  }

  if (failed || error) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm font-medium">{t("We couldn't sign you in with Google.")}</p>
        <Link href="/" className="text-sm font-medium text-accent hover:underline">{t("Back to login")}</Link>
      </div>
    );
  }

  return <Spinner />;
}

export default function AuthCallbackPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Suspense>
          <Callback />
        </Suspense>
      </div>
    </main>
  );
}
