"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

// Avoid repeated segment prefetches for the parallel @chat catch-all in Next 16.4.2.
// Workspace routes load on navigation instead.
export function AppSectionNav({
  appId,
  sections,
  ariaLabel,
}: {
  appId: string;
  sections: Array<{ section: string; label: string }>;
  ariaLabel: string;
}) {
  const active = useSelectedLayoutSegment() ?? "preview";
  return (
    <div className="flex min-w-0 shrink-0 justify-start self-stretch border-b border-foreground/20">
    <nav aria-label={ariaLabel} className="mr-auto flex w-max max-w-full flex-wrap justify-start gap-0.5">
      {sections.map(({ section, label }) => {
        const selected = active === section;
        return <Link key={section} prefetch={false} href={`/studio/${appId}/${section}`} aria-current={selected ? "page" : undefined} className={`workspace-tab -mb-px inline-flex shrink-0 items-center whitespace-nowrap rounded-t-lg border px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${selected ? "border-foreground/20 border-b-surface bg-surface font-medium text-foreground" : "border-transparent text-muted hover:bg-surface/60 hover:text-foreground"}`}>{label}</Link>;
      })}
    </nav>
    </div>
  );
}
