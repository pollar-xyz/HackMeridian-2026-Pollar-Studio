import { Suspense } from "react";
import Image from "next/image";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Input } from "@/components/ui/input";
import { PublishedApps } from "@/components/studio/PublishedApps";
import { getT } from "@/lib/i18n/translate";
import hero from "@/public/brand/hero.jpg";

type SearchParams = Promise<{ q?: string }>;

export default function MarketplacePage({ searchParams }: { searchParams: SearchParams }) {
  return <Suspense fallback={<div className="mx-auto w-full max-w-6xl px-4 py-8" aria-busy="true" />}><MarketplaceContent searchParams={searchParams} /></Suspense>;
}

async function MarketplaceContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const t = getT("en");
  return <div className="flex flex-col">
    <section className="relative isolate overflow-hidden px-4 pb-8 pt-10 text-white sm:px-6 lg:px-8">
      <Image src={hero} alt="" fill placeholder="blur" sizes="100vw" className="-z-20 object-cover object-[50%_45%]" />
      <div className="absolute inset-0 -z-10 bg-[#0b1a33]/55" aria-hidden />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <div><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("Marketplace")}</h1><p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">{t("Explore apps built and published by the Pollar community.")}</p></div>
        <form action="/studio/marketplace" className="flex max-w-xl items-center gap-2 rounded-full bg-surface px-4 py-2.5 text-foreground shadow-sm">
          <MagnifyingGlassIcon className="shrink-0 text-muted" aria-hidden /><Input name="q" aria-label={t("Search apps, makers or what they do")} defaultValue={params.q} placeholder={t("Search apps, makers or what they do")} className="min-w-0 flex-1 border-0 bg-transparent text-sm shadow-none outline-none placeholder:text-muted" />
        </form>
      </div>
    </section>
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="grid gap-4 sm:grid-cols-2" aria-busy="true">{[0, 1].map(item => <div key={item} className="h-60 animate-pulse rounded-2xl border border-line bg-background motion-reduce:animate-none" />)}</div>}><PublishedApps query={params.q} /></Suspense>
    </div>
  </div>;
}
