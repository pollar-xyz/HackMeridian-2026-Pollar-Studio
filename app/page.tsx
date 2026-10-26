import { Logo } from "@/components/Logo";
import { PreferencesRow } from "@/components/studio/Sidebar";
import { Suspense } from "react";
import { SignInButton } from "@/components/SignInButton";
import { getT } from "@/lib/i18n/translate";

export default function LoginPage() {
  const t = getT("en");
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="absolute right-4 top-4"><PreferencesRow compact /></div>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="lg" />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">{t("Sign in to Studio")}</h1>
          <p className="mt-1 text-sm text-muted">{t("Describe an app and publish it in minutes.")}</p>
        </div>
        <Suspense>
          <SignInButton />
        </Suspense>
      </div>
    </main>
  );
}
