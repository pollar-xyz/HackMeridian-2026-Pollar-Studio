import "server-only";

import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/Button";
import { StellarIcon } from "@/components/AssetIcons";
import { Fuel, Lock } from "lucide-react";
import { CodeIcon } from "@radix-ui/react-icons";
import { getT } from "@/lib/i18n/translate";

export function ComposerInfo() {
  const t = getT("en");
  return <>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-background px-2.5 py-1.5 text-xs font-medium text-foreground">
                  <CodeIcon width={14} height={14} aria-hidden /> Next
                </span>
              </TooltipTrigger>
              <TooltipContent>{t("Currently, Studio only generates Next.js web apps.")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  tabIndex={0}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-background px-2.5 py-1.5 text-xs font-medium text-foreground"
                >
                  <StellarIcon size={14} aria-hidden /> Stellar
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {t(
                  "Every app runs on Stellar. It starts on testnet, move it to mainnet when you publish.",
                )}
              </TooltipContent>
            </Tooltip>
            <SponsoredChip />
  </>;
}

// Always on: every app pays its users' network fees from the maker's own sponsor wallet, funded with credits.
// Shown locked so makers know it is there, with a short why on click.
function SponsoredChip() {
  const t = getT("en");
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="unstyled"
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:border-accent"
        >
          <Fuel size={13} className="text-accent" /> {t("Sponsored")}
          <Lock size={11} className="text-muted" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="start"
        sideOffset={6}
        collisionPadding={8}
        aria-label={t("Always sponsored")}
        className="z-50 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-surface p-3 text-left text-xs shadow-sm"
      >
        <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Fuel size={14} className="text-accent" /> {t("Always sponsored")}
        </p>
        <p className="mt-1 leading-relaxed text-muted">
          {t(
            "Your users pay no fees and never need gas. Your app's sponsor wallet pays them with your credits.",
          )}
        </p>
      </PopoverContent>
    </Popover>
  );
}
