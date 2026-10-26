"use client";

import { ArrowUpIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n";
import { useComposerState } from "./ComposerState";

export function ComposerSubmit() {
  const t = useT();
  const { ready, submit } = useComposerState();
  return (
    <Button
      variant="primary"
      size="icon"
      type="button"
      onClick={submit}
      disabled={!ready}
      aria-label={t("Generate app")}
      title={t("Generate app")}
      className="flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-full bg-accent text-white transition-transform hover:bg-accent-strong active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <ArrowUpIcon width={18} height={18} />
    </Button>
  );
}
