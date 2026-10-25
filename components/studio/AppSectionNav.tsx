"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

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
    <nav aria-label={ariaLabel} className="flex shrink-0 gap-0.5 overflow-x-auto border-b border-line bg-background px-2 pt-1.5">
      {sections.map(({ section, label }) => {
        const selected = active === section;
        return <Link key={section} href={`/studio/${appId}/${section}`} aria-current={selected ? "page" : undefined} className={`workspace-tab -mb-px inline-flex shrink-0 items-center whitespace-nowrap rounded-t-lg border px-3.5 py-1.5 text-sm transition-colors ${selected ? "border-line border-b-background bg-background font-medium text-foreground" : "border-transparent text-muted hover:bg-surface/60 hover:text-foreground"}`}>{label}</Link>;
      })}
    </nav>
  );
}
