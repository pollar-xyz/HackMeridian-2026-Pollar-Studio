"use client";

import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/lib/i18n";
import { useComposerState } from "./ComposerState";

export function ComposerInput({ autoFocus }: { autoFocus?: boolean }) {
  const t = useT();
  const { prompt, setPrompt, navigating, submit, error } = useComposerState();
  return (
    <>
    <Textarea
      aria-label={t("Describe your app")}
      autoFocus={autoFocus}
      value={prompt}
      onChange={(event) => setPrompt(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && !event.nativeEvent.isComposing) {
          event.preventDefault();
          submit();
        }
      }}
      maxLength={10_000}
      disabled={navigating}
      rows={3}
      placeholder={t("Describe your app. Example: a rotating savings circle for 10 friends with weekly contributions")}
      className="composer-input w-full resize-none rounded-none border-0 bg-transparent px-1 py-1 text-base text-foreground shadow-none placeholder:text-muted/70 focus-visible:outline-none"
    />
    {error && <p role="alert" className="px-1 py-2 text-sm text-danger">{t(error)}</p>}
    </>
  );
}
