"use client";

import { useSearchParams } from "next/navigation";
import { ButtonAnchor } from "@/components/ui/Button";
import { useT } from "@/lib/i18n";

// /auth/callback lands here with `?error=` when the sign-in did not finish.
const ERRORS: Record<string, string> = {
  cancelled: "Sign-in was cancelled.",
  expired: "This sign-in expired. Start again.",
  signin: "We couldn't sign you in. Try again.",
};

export function SignInButton() {
  const t = useT();
  const error = useSearchParams().get("error");
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
      {/* A plain link: /auth/login is a route handler that leaves for the Pollar sign-in page. */}
      <ButtonAnchor href="/auth/login">{t("Sign in with Pollar")}</ButtonAnchor>
      {error && <p className="text-sm text-danger">{t(ERRORS[error] ?? ERRORS.signin)}</p>}
    </div>
  );
}
