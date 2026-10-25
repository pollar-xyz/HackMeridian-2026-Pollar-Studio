"use client";

import { useState } from "react";
import Image from "next/image";
import { AssetIcon } from "@/components/AssetIcons";
import { Mark } from "@/components/Logo";

const LOGOS: Record<string, string> = {
  stellar: "/brand/partners/stellar.png",
  defindex: "/brand/partners/defindex.png",
  trustless: "/brand/partners/trustless.png",
  soroswap: "/brand/partners/soroswap.png",
  reflector: "/brand/partners/reflector.png",
  anclap: "/brand/partners/anclap.png",
  expert: "/brand/partners/expert.png",
  blend: "/brand/partners/blend.png",
  passkeys: "/brand/partners/github.png",
  anchors: "/brand/partners/stellar.png",
};

export function ProjectLogo({ id, name, asset, size = 36 }: { id: string; name: string; asset?: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (id === "pollar") return <Mark size={size} />;
  if (id === "usdc") return <AssetIcon asset={(asset as "USDC" | "USDT" | "XLM") ?? "USDC"} size={size} />;
  const src = LOGOS[id];
  if (!src || failed) return <span className="flex shrink-0 items-center justify-center rounded-lg bg-accent-soft font-semibold text-accent" style={{ width: size, height: size }}>{name.charAt(0)}</span>;
  return <Image src={src} alt="" width={size} height={size} unoptimized onError={() => setFailed(true)} className="shrink-0 rounded-lg bg-white object-contain" style={{ width: size, height: size }} />;
}
