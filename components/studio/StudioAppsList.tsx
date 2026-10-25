"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useStudioApps } from "@/lib/ai/studio-apps";
import { useT } from "@/lib/i18n";

export function StudioAppsList({ query, headings }: { query: string; headings: ReactNode }) {
  const { apps, loading } = useStudioApps();
  const t = useT();
  if (loading) return <div className="h-32 animate-pulse rounded-xl border border-line bg-surface" aria-busy="true" />;
  const shown = apps.filter((app) => `${app.name} ${app.prompt}`.toLowerCase().includes(query.toLowerCase()));
  if (!apps.length) return <div className="border-t border-line py-16 text-center"><p className="font-medium">{t("No apps yet")}</p><p className="mt-2 text-sm text-muted">{t("Start a conversation on the home page to create your first app.")}</p></div>;
  if (!shown.length) return <p className="py-12 text-center text-sm text-muted">{t("Nothing here with this filter.")}</p>;
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <Table>
        {headings}
        <TableBody>
          {shown.map((app) => (
            <TableRow key={app.id}>
              <TableCell className="max-w-0">
                <Link href={`/studio/${app.id}/preview`} className="block min-w-0 rounded-lg py-1">
                  <span className="block truncate text-sm font-medium">{app.name}</span>
                  <span className="mt-1 block truncate font-mono text-xs text-muted">{app.id}</span>
                </Link>
              </TableCell>
              <TableCell className="w-24 text-xs text-muted">{t("Draft")}</TableCell>
              <TableCell className="w-32 text-right text-xs text-muted"><time dateTime={new Date(app.createdAt).toISOString()}>{new Date(app.createdAt).toLocaleDateString()}</time></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
