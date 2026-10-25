"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { type Asset, type RailCountry } from "@/lib/mock/types";
import { startStudioChat } from "@/lib/ai/studio-chat-store";

interface ComposerState {
  assets: Asset[];
  setAssets: (value: Asset[]) => void;
  countries: RailCountry[];
  setCountries: (value: RailCountry[]) => void;
  prompt: string;
  setPrompt: (value: string) => void;
  navigating: boolean;
  error: string | null;
  ready: boolean;
  submit: () => void;
}

const Context = createContext<ComposerState | null>(null);

// This boundary owns behavior only. Its children are composed by the server.
export function ComposerState({ children, canSubmit }: { children: ReactNode; canSubmit: boolean }) {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>(["USDC"]);
  const [countries, setCountries] = useState<RailCountry[]>(["BO", "BR", "AR"]);
  const [prompt, setPrompt] = useState("");
  const [navigating, setNavigating] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const ready = canSubmit && !navigating && prompt.trim().length > 0 && prompt.trim().length <= 10_000;

  async function submit() {
    if (!ready || submitting.current) return;
    submitting.current = true;
    setNavigating(true);
    setError(null);
    try {
      const appId = await startStudioChat(prompt, { blockchain: "stellar", payments: assets, countries });
      router.push(`/studio/${appId}/preview`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not create the app.");
      setNavigating(false);
      submitting.current = false;
    }
  }

  return <Context.Provider value={{ assets, setAssets, countries, setCountries, prompt, setPrompt, navigating, ready, submit, error }}>{children}</Context.Provider>;
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
