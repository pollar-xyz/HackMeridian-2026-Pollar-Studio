import { StudioShell } from "@/components/studio/StudioShell";
import { getT } from "@/lib/i18n/translate";

export default function StudioLayout({ children }: LayoutProps<"/studio">) {
  const t = getT("en");
  return (
    <>
      <a
        href="#studio-content"
        className="sr-only fixed left-4 top-4 z-50 rounded-lg bg-surface p-3 text-foreground focus:not-sr-only"
      >
        {t("Skip to content")}
      </a>
      <StudioShell>{children}</StudioShell>
    </>
  );
}
