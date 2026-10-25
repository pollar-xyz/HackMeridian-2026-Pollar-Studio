"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { Modal, Spinner } from "@/components/Modal";
import { useStudioStore } from "@/lib/mock/store";

export function LoginForm({ labels }: { labels: { email: string; continue: string; note: string; waiting: string } }) {
  const router = useRouter();
  const hydrated = useStudioStore((s) => s.hydrated);
  const account = useStudioStore((s) => s.account);
  const login = useStudioStore((s) => s.login);
  const [email, setEmail] = useState("maker@pollar.app");
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    if (hydrated && account && !waiting) router.replace("/studio");
  }, [hydrated, account, waiting, router]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setWaiting(true);
    setTimeout(() => { login(email.trim()); router.replace("/studio"); }, 1500);
  };

  return (
    <>
      <form onSubmit={submit} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">{labels.email}</span>
          <Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={`${inputClass} text-base`} placeholder="you@example.com" />
        </label>
        <Button type="submit" disabled={!hydrated}><Fingerprint size={16} />{labels.continue}</Button>
        <p className="text-center text-xs text-muted">{labels.note}</p>
      </form>
      <Modal open={waiting}>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft"><Fingerprint size={26} className="live-dot text-accent" /></div>
          <p className="text-sm font-medium">{labels.waiting}</p>
          <Spinner />
        </div>
      </Modal>
    </>
  );
}
