"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint } from "lucide-react";
import { useStudioStore } from "@/lib/mock/store";
import { useT } from "@/lib/i18n";
import { Modal, Spinner } from "@/components/Modal";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { PreferencesRow } from "@/components/studio/Sidebar";

export default function LoginPage() {
  const router = useRouter();
  const t = useT();
  const hydrated = useStudioStore((s) => s.hydrated);
  const account = useStudioStore((s) => s.account);
  const login = useStudioStore((s) => s.login);
  const [email, setEmail] = useState("maker@pollar.app");
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    if (hydrated && account && !waiting) router.replace("/studio");
  }, [hydrated, account, waiting, router]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setWaiting(true);
    setTimeout(() => {
      login(email.trim());
      router.replace("/studio");
    }, 1500);
  };

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="absolute right-4 top-4">
        <PreferencesRow compact />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="lg" />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">{t("Sign in to Studio")}</h1>
          <p className="mt-1 text-sm text-muted">{t("Describe an app and publish it in minutes.")}</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">{t("Email")}</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} text-base`} placeholder="you@example.com" />
          </label>
          <Button type="submit" disabled={!hydrated}>
            <Fingerprint size={16} />
            {t("Continue with passkey")}
          </Button>
          <p className="text-center text-xs text-muted">{t("No password. Your device is the key.")}</p>
        </form>

      </div>

      <Modal open={waiting}>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft">
            <Fingerprint size={26} className="live-dot text-accent" />
          </div>
          <p className="text-sm font-medium">{t("Waiting for your passkey")}</p>
          <Spinner />
        </div>
      </Modal>
    </main>
  );
}
