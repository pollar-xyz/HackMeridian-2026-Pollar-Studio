"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useStudioAccount, StudioLoading } from "@/components/StudioGate";
import { Composer } from "@/components/studio/Composer";
import Image from "next/image";
import { Mark } from "@/components/Logo";
import hero from "@/public/brand/hero.jpg";

export default function StudioHomePage() {
  const account = useStudioAccount();
  const t = useT();

  if (!account) return <StudioLoading />;

  return (
    <section className="relative isolate flex flex-1 flex-col items-center justify-center overflow-hidden bg-hero px-4 py-16 text-white sm:px-10 lg:min-h-dvh">
      <Image src={hero} alt="" fill priority placeholder="blur" sizes="100vw" className="-z-20 object-cover object-[50%_60%]" />
      {/* Flat scrim, no gradient, so white text reads on the bright sky. */}
      <div className="absolute inset-0 -z-10 bg-[#0b1a33]/35" aria-hidden />
      <div className="w-full max-w-3xl text-center [text-shadow:0_1px_12px_rgba(0,0,0,0.25)]">
        <Mark size={56} light className="mx-auto mb-6" />
        <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
          {t("Launch an app")}
          <br />
          {t("in minutes")}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base opacity-90 sm:text-lg">
          {t("Describe it once. Pollar adds login, a wallet, stablecoin payments and bank cashouts, then publishes it with its own link.")}
        </p>
      </div>
      <div className="mt-10 w-full max-w-2xl">
        <Composer account={account} autoFocus />
      </div>
      <Link href="/studio/marketplace" className="mt-8 inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white hover:underline">
        {t("See what others built this event")} <ArrowRight size={14} />
      </Link>
    </section>
  );
}
