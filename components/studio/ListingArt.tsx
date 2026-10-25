"use client";

import { CalendarDays, Link2, PiggyBank, QrCode, Receipt, Store, Ticket, Trophy, Users } from "lucide-react";
import type { App, AppKind, ListingArt } from "@/lib/mock/types";

export const KIND_ICONS: Record<AppKind, typeof Users> = {
  "pasanaku-circles": Users,
  "bill-split": Receipt,
  "money-pool": PiggyBank,
  "vendor-pay-link": Link2,
  "qr-menu-orders": QrCode,
  "raffle-hub": Ticket,
  "event-tickets": CalendarDays,
  "match-predictions": Trophy,
  "market-orders": Store,
};

export const ART_COLORS = ["#005db4", "#0f766e", "#6d28d9", "#be185d", "#c2410c", "#15803d", "#111827"];
export const ART_PATTERNS: ListingArt["pattern"][] = ["dots", "grid", "waves", "none"];

// Patterns are SVG tiles, not gradients, so they stay inside the flat design rules.
function patternUrl(pattern: ListingArt["pattern"]): string | undefined {
  const stroke = "rgba(255,255,255,0.16)";
  const svg =
    pattern === "dots"
      ? `<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18'><circle cx='2' cy='2' r='1.6' fill='${stroke}'/></svg>`
      : pattern === "grid"
        ? `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><path d='M24 0H0V24' fill='none' stroke='${stroke}' stroke-width='1'/></svg>`
        : pattern === "waves"
          ? `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='16'><path d='M0 8 Q10 0 20 8 T40 8' fill='none' stroke='${stroke}' stroke-width='1.5'/></svg>`
          : null;
  return svg ? `url("data:image/svg+xml,${encodeURIComponent(svg)}")` : undefined;
}

export function Banner({ app, art, className = "", height = 128 }: { app: Pick<App, "kind" | "name">; art: ListingArt; className?: string; height?: number }) {
  const Icon = KIND_ICONS[app.kind];
  if (art.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={art.image} alt="" className={`w-full object-cover ${className}`} style={{ height }} />;
  }
  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={{ height, backgroundColor: art.color, backgroundImage: patternUrl(art.pattern) }}>
      <Icon className="absolute -bottom-4 right-4 text-white/20" size={height * 0.9} strokeWidth={1.25} aria-hidden />
    </div>
  );
}

export function AppLogo({ app, art, size = 56, className = "" }: { app: Pick<App, "kind" | "name">; art: ListingArt; size?: number; className?: string }) {
  const Icon = KIND_ICONS[app.kind];
  if (art.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={art.image} alt="" className={`shrink-0 rounded-2xl object-cover ${className}`} style={{ width: size, height: size }} />;
  }
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-2xl text-white ${className}`}
      style={{ width: size, height: size, backgroundColor: art.color }}
      aria-hidden
    >
      <Icon size={size * 0.5} strokeWidth={1.75} />
    </span>
  );
}

// Reads a picked file, scales it down and returns a small JPEG data URL, so it fits in localStorage.
export function readImage(file: File, maxW: number, maxH: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file is not an image"));
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width, maxH / img.height);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
