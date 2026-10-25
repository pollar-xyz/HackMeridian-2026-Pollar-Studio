import type { AppKind } from "./types";

const RULES: Array<{ words: string[]; kind: AppKind }> = [
  { words: ["pasanaku", "rotating", "circle"], kind: "pasanaku-circles" },
  { words: ["split", "bill", "dinner"], kind: "bill-split" },
  { words: ["pool", "collect", "fund"], kind: "money-pool" },
  { words: ["link", "invoice", "vendor"], kind: "vendor-pay-link" },
  { words: ["menu", "restaurant", "order", "qr"], kind: "qr-menu-orders" },
  { words: ["raffle", "lottery", "draw"], kind: "raffle-hub" },
  { words: ["ticket", "event", "entry"], kind: "event-tickets" },
  { words: ["match", "predict", "bet"], kind: "match-predictions" },
  { words: ["market", "stall", "shop"], kind: "market-orders" },
];

export function classifyPrompt(prompt: string): AppKind {
  const text = prompt.toLowerCase();
  const tokens = text.split(/[^a-z]+/).filter(Boolean);
  let best: { kind: AppKind; score: number } | null = null;
  for (const rule of RULES) {
    let score = 0;
    for (const word of rule.words) {
      if (tokens.some((t) => t.startsWith(word))) score += 1;
    }
    if (score > 0 && (!best || score > best.score)) best = { kind: rule.kind, score };
  }
  return best ? best.kind : "money-pool";
}

export function deriveName(prompt: string): string {
  const first = prompt
    .trim()
    .split(/[.!?\n]/)[0]
    .replace(/\s+/g, " ")
    .trim();
  const cleaned = first.replace(/^(a|an|the)\s+/i, "");
  const base = cleaned.length > 0 ? cleaned : "Untitled app";
  const capitalized = base.charAt(0).toUpperCase() + base.slice(1);
  if (capitalized.length <= 32) return capitalized;
  const cut = capitalized.slice(0, 32);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 16 ? cut.slice(0, lastSpace) : cut).trim();
}

export const EXAMPLE_PROMPTS: string[] = [
  "A rotating savings circle for 10 friends with weekly contributions",
  "A QR menu for my restaurant so customers order and pay from the table",
  "A raffle for my community with 50 tickets and one prize",
  "Split the dinner bill between 4 friends and track who paid",
];
