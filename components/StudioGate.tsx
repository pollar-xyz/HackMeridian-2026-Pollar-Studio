"use client";

import { useSession } from "@/lib/auth/session";
import { useStudioStore } from "@/lib/mock/store";
import type { Account } from "@/lib/mock/types";
import { Spinner } from "./Modal";

// The signed in account: who it is comes from the hub-api session, credits and
// plan still from the mock store. Null while loading or logged out.
export function useStudioAccount(): Account | null {
  const hydrated = useStudioStore((s) => s.hydrated);
  const account = useStudioStore((s) => s.account);
  const session = useSession();
  if (!hydrated || !account || !session) return null;
  const name = [session.data.first_name, session.data.last_name].filter(Boolean).join(" ");
  return { ...account, email: session.data.mail, name: name || account.name };
}

export function StudioLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <Spinner />
    </div>
  );
}
