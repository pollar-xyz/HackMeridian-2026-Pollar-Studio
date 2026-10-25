"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { PrefsProvider } from "@/lib/prefs";
import { UiProvider } from "@/lib/mock/ui-store";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return <PrefsProvider><UiProvider><TooltipProvider delayDuration={300}>{children}</TooltipProvider></UiProvider></PrefsProvider>;
}
