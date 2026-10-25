"use client";

import type { App } from "@/lib/mock/types";
import { Spinner } from "@/components/Modal";
import { GeneratedProvider, useGeneratedSession } from "./context";
import { GeneratedLogin } from "./GeneratedLogin";
import { Shell } from "./Shell";

export function GeneratedApp({ app }: { app: App }) {
  const slug = app.slug;
  const [session, setSession] = useGeneratedSession(slug, app);

  if (session === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      {!session ? (
        <GeneratedLogin app={app} onLogin={setSession} />
      ) : (
        <GeneratedProvider app={app} session={session}>
          <Shell />
        </GeneratedProvider>
      )}
    </>
  );
}
