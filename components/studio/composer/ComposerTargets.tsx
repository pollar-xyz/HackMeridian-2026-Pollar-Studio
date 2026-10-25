import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Send, Smartphone, MessageCircle } from "lucide-react";
import { getT } from "@/lib/i18n/translate";
import { TARGET_LABELS, type Target } from "@/lib/mock/types";

const TARGETS: Array<{
  key: Target;
  Icon: typeof Globe;
  state: "ready" | "new" | "soon";
}> = [
  { key: "web", Icon: Globe, state: "ready" },
  { key: "telegram", Icon: Send, state: "new" },
  { key: "mobile", Icon: Smartphone, state: "soon" },
  { key: "whatsapp", Icon: MessageCircle, state: "soon" },
];

export function ComposerTargets() {
  const t = getT("en");
  return (
<TabsList
          aria-label={t("App")}
          className="flex gap-1 pr-4"
        >
          {TARGETS.map(({ key, Icon, state }) => {
            const disabled = state === "soon";
            return (
              <TabsTrigger
                key={key}
                value={key}
                aria-label={t(TARGET_LABELS[key])}
                disabled={disabled}
                className="group relative -mb-px inline-flex min-w-0 flex-initial items-center justify-center gap-2 rounded-none rounded-t-xl bg-white/15 px-3 py-2.5 text-sm font-medium text-white/85 transition-colors hover:bg-white/25 data-[state=active]:bg-surface data-[state=active]:text-foreground disabled:bg-white/10 disabled:text-white/50 sm:px-4"
              >
                <Icon size={16} className="shrink-0" />
                <span
                  className="hidden min-w-0 truncate group-data-[state=active]:inline sm:inline"
                >
                  {key === "telegram" ? "Telegram" : t(TARGET_LABELS[key])}
                </span>
                {state === "new" && (
                  <span
                    className="shrink-0 rounded-full bg-white/20 px-1.5 py-px text-[10px] group-data-[state=active]:bg-accent-soft group-data-[state=active]:text-accent"
                  >
                    {t("New")}
                  </span>
                )}
                {state === "soon" && (
                  <span className="hidden shrink-0 rounded-full bg-white/10 px-1.5 py-px text-[10px] md:inline">
                    {t("Soon")}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
  );
}
