"use client";

import { useStudioStore } from "@/lib/mock/store";
import type { Account } from "@/lib/mock/types";
import { Spinner } from "./Modal";

// Returns the signed in account once the store is hydrated, null while loading or logged out.
export function useStudioAccount(): Account | null {
  const hydrated = useStudioStore((s) => s.hydrated);
  const account = useStudioStore((s) => s.account);
  return hydrated ? account : null;
}

export function StudioLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <Spinner />
    </div>
  );
}
