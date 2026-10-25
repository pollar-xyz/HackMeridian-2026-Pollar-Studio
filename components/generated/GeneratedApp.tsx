"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useStudioStore } from "@/lib/mock/store";
import { Spinner } from "@/components/Modal";
import { GeneratedProvider, useGeneratedSession } from "./context";
import { GeneratedLogin } from "./GeneratedLogin";
import { Shell } from "./Shell";

export function GeneratedApp() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const hydrated = useStudioStore((s) => s.hydrated);
  const app = useStudioStore((s) => s.apps.find((a) => a.slug === slug));
  const [session, setSession] = useGeneratedSession(slug, app);

  if (!hydrated || session === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-lg font-semibold">This app does not exist</p>
        <p className="text-sm text-muted">The slug {slug} is not registered in Pollar.</p>
        <Link href="/" className="text-sm font-medium text-accent hover:underline">
          Go to Pollar Studio
        </Link>
      </div>
    );
  }

  if (!app.previewSha && app.status !== "published") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-lg font-semibold">{app.name} is not published yet</p>
        <p className="text-sm text-muted">Finish the build in Studio and come back.</p>
        <Link href="/" className="text-sm font-medium text-accent hover:underline">
          Go to Pollar Studio
        </Link>
      </div>
    );
  }

  // The app's own accent and the preview notice wrap every screen, login included.
  return (
    <div
      className="flex min-h-dvh flex-col"
      style={app.themeColor ? ({ "--accent": app.themeColor, "--accent-strong": app.themeColor } as React.CSSProperties) : undefined}
    >
      {app.status !== "published" && (
        <div className="bg-amber-400 px-4 py-1 text-center text-[11px] font-medium text-[#3b2a00]">Preview, not published yet</div>
      )}
      {!session ? (
        <GeneratedLogin app={app} onLogin={setSession} />
      ) : (
        <GeneratedProvider app={app} session={session}>
          <Shell />
        </GeneratedProvider>
      )}
    </div>
  );
}
