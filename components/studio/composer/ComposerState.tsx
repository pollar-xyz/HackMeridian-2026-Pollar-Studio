"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { startStudioChat } from "@/lib/ai/use-studio-chat";

interface ComposerState {
  prompt: string;
  setPrompt: (value: string) => void;
  navigating: boolean;
  ready: boolean;
  submit: () => void;
}

const Context = createContext<ComposerState | null>(null);

// This boundary owns behavior only. Its children are composed by the server.
export function ComposerState({ children, canSubmit }: { children: ReactNode; canSubmit: boolean }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [navigating, setNavigating] = useState(false);
  const submitting = useRef(false);
  const ready = canSubmit && !navigating && prompt.trim().length > 0 && prompt.trim().length <= 10_000;

  function submit() {
    if (!ready || submitting.current) return;
    submitting.current = true;
    // Until app creation is connected, open the existing preview workspace.
    const appId = "app_seed_a1b2_1";
    if (!startStudioChat(appId, prompt)) {
      submitting.current = false;
      return;
    }
    setNavigating(true);
    router.push(`/studio/${appId}/preview`);
  }

  return <Context.Provider value={{ prompt, setPrompt, navigating, ready, submit }}>{children}</Context.Provider>;
}

export function useComposerState() {
  const state = useContext(Context);
  if (!state) throw new Error("Composer controls require ComposerState");
  return state;
}

const TargetContext = createContext("web");

export function ComposerTabs({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState("web");
  return (
    <TargetContext.Provider value={target}>
      <Tabs value={target} onValueChange={setTarget} className="drop-shadow-sm">{children}</Tabs>
    </TargetContext.Provider>
  );
}

export function ComposerPanel({ children }: { children: ReactNode }) {
  const target = useContext(TargetContext);
  return <TabsContent value={target} tabIndex={-1} className="composer-panel rounded-2xl rounded-tl-none bg-surface p-3">{children}</TabsContent>;
}
