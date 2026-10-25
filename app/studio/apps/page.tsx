import Link from "next/link";
import { Suspense } from "react";
import { Plus, Search } from "lucide-react";
import { TableCaption, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { buttonClass } from "@/components/ui/button-variants";
import { StudioAppsList } from "@/components/studio/StudioAppsList";
import { getT } from "@/lib/i18n/translate";

type SearchParams = Promise<{ q?: string }>;

export default function MyAppsPage({ searchParams }: { searchParams: SearchParams }) {
  return <Suspense fallback={<div className="mx-auto w-full max-w-5xl px-4 py-8" aria-busy="true" />}><MyAppsContent searchParams={searchParams} /></Suspense>;
}

async function MyAppsContent({ searchParams }: { searchParams: SearchParams }) {
  const { q } = await searchParams;
  const t = getT("en");
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <header className="flex items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t("My apps")}</h1>
        <Link href="/studio" className={buttonClass("primary", "md")}><Plus size={16} />{t("New app")}</Link>
      </header>
      <form action="/studio/apps" className="relative w-full sm:w-72">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
        <Input name="q" aria-label={t("Search")} defaultValue={q} placeholder={t("Search")} className="w-full rounded-lg border border-line bg-transparent py-1.5 pl-8 pr-3 text-sm" />
      </form>
      <StudioAppsList query={q?.trim() ?? ""} headings={<>
        <TableCaption className="sr-only">{t("My apps")}</TableCaption>
        <TableHeader><TableRow className="text-[11px] uppercase tracking-wide"><TableHead>{t("App")}</TableHead><TableHead>{t("Status")}</TableHead><TableHead className="text-right">{t("Created")}</TableHead></TableRow></TableHeader>
      </>} />
    </div>
  );
}
