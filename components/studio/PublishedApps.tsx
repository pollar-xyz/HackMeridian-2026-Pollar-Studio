import { createStudioApi } from "@/app/api/chat/studio-api";
import { AppLogo, Banner } from "./ListingArt";
import { ExternalLinkIcon } from "@radix-ui/react-icons";

export async function PublishedApps({ query = "" }: { query?: string }) {
  let listings;
  try {
    ({ listings } = await createStudioApi("", AbortSignal.timeout(15_000)).listMarketplace());
  } catch {
    return <section aria-label="Published apps" className="border-b border-line pb-6"><h2 className="text-base font-semibold">Published apps</h2><p role="status" className="mt-2 text-sm text-muted">Published apps could not be loaded. Please refresh to try again.</p></section>;
  }
  const search = query.toLowerCase();
  const filtered = listings.filter(app => !search || [app.title, app.tagline, app.makerName].some(value => value.toLowerCase().includes(search)));
  return <section aria-label="Published apps" className="flex flex-col gap-3 border-b border-line pb-6"><div><h2 className="text-base font-semibold">Published apps</h2><p className="mt-1 text-sm text-muted">Open apps published by the community.</p></div>{filtered.length === 0 ? <p className="py-4 text-sm text-muted">{search ? "No published apps match that search." : "No apps published yet."}</p> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map(app => {
    const preview = { name: app.title, kind: "market-orders" as const };
    return <a key={app.projectId} href={app.url} target="_blank" rel="noopener noreferrer" className="group overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-accent" aria-label={`Open ${app.title}`}><Banner app={preview} art={app.banner} height={112} /><div className="px-4 pb-4"><AppLogo app={preview} art={app.logo} size={52} className="relative -mt-7 border-4 border-surface" /><div className="mt-2 flex items-start justify-between gap-3"><h3 className="truncate font-semibold">{app.title}</h3><ExternalLinkIcon className="mt-1 shrink-0 text-muted group-hover:text-accent" /></div><p className="mt-1 line-clamp-2 text-sm text-muted">{app.tagline}</p><p className="mt-3 truncate text-xs text-muted">by {app.makerName}</p></div></a>;
  })}</div>}</section>;
}
