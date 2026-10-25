"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useUiStore } from "@/lib/mock/ui-store";
import { GENERATION_LIMIT } from "@/lib/mock/store-constants";
import { useT } from "@/lib/i18n";

export function ComposerLimitNotice({ limitReached, lowCredits, credits, minCredits }: {
  limitReached: boolean; lowCredits: boolean; credits: number; minCredits: number;
}) {
  const t = useT();
  const [barHidden, setBarHidden] = useState(false);
  const setCreditsOpen = useUiStore((s) => s.setCreditsOpen);
  const openSettings = useUiStore((s) => s.openSettings);
  return <>
        {(limitReached || lowCredits) && !barHidden && (
          <div className="mx-3 flex items-center gap-3 rounded-b-xl bg-black/45 px-4 py-2 text-sm text-white/85 backdrop-blur-md">
            <span className="min-w-0 flex-1 truncate">
              {limitReached
                ? t("You used your {limit} free generations.", {
                    limit: GENERATION_LIMIT,
                  })
                : credits <= 0
                  ? t("You are out of credits.")
                  : t("A new app needs {min} credits, you have {have}.", {
                      min: minCredits,
                      have: credits,
                    })}
            </span>
            <Button
              variant="unstyled"
              type="button"
              onClick={() =>
                limitReached ? openSettings("plan") : setCreditsOpen(true)
              }
              className="shrink-0 font-medium text-white hover:underline"
            >
              {limitReached ? t("Upgrade plan") : t("Buy credits")}
            </Button>
            <Button
              variant="unstyled"
              type="button"
              onClick={() => setBarHidden(true)}
              aria-label={t("Close")}
              className="shrink-0 text-white/60 hover:text-white"
            >
              <X size={15} />
            </Button>
          </div>
        )}
  </>;
}
