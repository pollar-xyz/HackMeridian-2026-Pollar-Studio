"use client";

import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n";
import { useComposerState } from "./ComposerState";

export function ComposerSubmit({ credits }: { credits: number }) {
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
      title={t("Generate app, {n} credits", { n: credits })}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
    >
      <ArrowUp size={18} />
    </Button>
  );
}
