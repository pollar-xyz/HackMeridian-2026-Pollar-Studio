import type { App, ChatIntent } from "./types";
import { integrationsFor } from "./ecosystem";

export interface ChatPlan {
  intent: ChatIntent;
  reply: string; // assistant text, English keys translated at render time are not possible here, so plain English
  changes: string[];
  patch: Partial<App>;
  rebuild: boolean;
}

const COLORS: Record<string, string> = {
  green: "#15803d",
  red: "#b91c1c",
  purple: "#6d28d9",
  violet: "#6d28d9",
  orange: "#c2410c",
  pink: "#be185d",
  teal: "#0f766e",
  black: "#111827",
  blue: "#005db4",
  yellow: "#a16207",
  verde: "#15803d",
  rojo: "#b91c1c",
  morado: "#6d28d9",
  naranja: "#c2410c",
  rosa: "#be185d",
  negro: "#111827",
  azul: "#005db4",
  amarillo: "#a16207",
};

const CONTRACT_WORDS = ["contract", "escrow", "release", "payout", "weekly", "monthly", "fee", "refund", "split", "goal", "deadline", "vault", "yield", "contrato", "liberar", "semanal", "mensual", "comision", "reembolso"];
const PAYMENT_WORDS = ["cashout", "cash out", "bank", "anchor", "pix", "qr", "country", "countries", "kyc", "retiro", "banco", "pais"];

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function has(text: string, words: string[]) {
  return words.some((w) => text.includes(w));
}

// Turns a chat message into a plan: what we understood, what changes, and whether it needs a rebuild.
export function planChat(app: App, raw: string): ChatPlan {
  const text = raw.trim();
  const lower = text.toLowerCase();
  const patch: Partial<App> = {};
  const changes: string[] = [];

  // Questions get an explanation, nothing is rebuilt.
  if (/^(what|how|why|which|where|explain|que|qué|como|cómo|por que|por qué|explica)\b/.test(lower) || lower.endsWith("?")) {
    return { intent: "question", reply: explain(app, lower), changes: [], patch, rebuild: false };
  }

  // Rename
  const rename = lower.match(/(?:rename(?: it| the app)? to|call it|name it|llamala|renombra(?:la)? a)\s+(.+)$/);
  if (rename) {
    const name = capitalize(text.slice(text.length - rename[1].length).replace(/["'.]/g, "").trim()).slice(0, 32);
    patch.name = name;
    changes.push(`Renamed the app to ${name}`);
  }

  // Colors
  const colorWord = Object.keys(COLORS).find((c) => new RegExp(`\\b${c}\\b`).test(lower));
  if (colorWord && has(lower, ["color", "colour", "button", "theme", "accent", "brand", "boton", "tema", colorWord])) {
    patch.themeColor = COLORS[colorWord];
    changes.push(`Accent color set to ${colorWord}`);
  }

  // Asset and network
  const asset = (["XLM", "USDT", "USDC"] as const).find((a) => lower.includes(a.toLowerCase()));
  if (asset && asset !== app.asset) {
    patch.asset = asset;
    changes.push(`Settlement asset switched to ${asset}`);
  }
  if (lower.includes("mainnet") && app.network !== "mainnet") {
    return {
      intent: "payments",
      reply: "Going to mainnet means deploying a new contract with real money, so it has its own form. Click Publish, pick Mainnet, and fill in where the money should go. It costs 200 credits.",
      changes: [],
      patch: {},
      rebuild: false,
    };
  }
  if (lower.includes("testnet") && app.network !== "testnet") {
    patch.network = "testnet";
    changes.push("Contract moved to Stellar testnet");
  }

  // Contract rules
  if (has(lower, CONTRACT_WORDS)) {
    const rule = capitalize(text.replace(/[.!]+$/, ""));
    patch.rules = [...(app.rules ?? []), rule];
    changes.push(`Contract rule added: ${rule}`);
  }

  // Payment rails
  if (has(lower, PAYMENT_WORDS) && !has(lower, CONTRACT_WORDS)) {
    changes.push(`Payment flow updated: ${capitalize(text.replace(/[.!]+$/, ""))}`);
  }

  // Screens fallback
  if (changes.length === 0) {
    changes.push(`Screens updated: ${capitalize(text.replace(/[.!]+$/, ""))}`);
  }

  const intent: ChatIntent = patch.rules
    ? "contract"
    : patch.themeColor || patch.name
      ? "design"
      : patch.asset || patch.network || has(lower, PAYMENT_WORDS)
        ? "payments"
        : "screens";

  const reply =
    intent === "contract"
      ? "Got it. I updated the payment contract in your preview. Check it in the Contract tab, then publish when you are happy."
      : intent === "design"
        ? "On it. I am rebuilding your preview with that change. Review it on the right and publish when you are happy."
        : intent === "payments"
          ? "Understood. I am updating the payment setup in your preview. Your users keep the live version until you publish."
          : "Done planning. I am rebuilding your preview with that change.";

  return { intent, reply, changes, patch, rebuild: true };
}

function explain(app: App, lower: string): string {
  const items = integrationsFor(app);
  const picked = items.filter((i) => !i.core).map((i) => `${i.project.name} (${i.role.replace(/\.$/, "").toLowerCase()})`);
  const asset = app.asset ?? "USDC";
  const network = app.network ?? "testnet";
  if (lower.includes("contract") || lower.includes("contrato")) {
    const rules = [...templateRules(app), ...(app.rules ?? [])];
    return `Your app has its own payment contract on Stellar ${network}${app.contractId ? ` (${app.contractId.slice(0, 6)}...${app.contractId.slice(-4)})` : ""}. Every payment from a user goes into it in ${asset}, and it follows these rules: ${rules.join("; ")}. Your sponsor wallet, funded with your credits, pays the network fees so your users never need gas. You can change any rule from this chat, for example "release funds weekly".`;
  }
  if (lower.includes("connect") || lower.includes("service") || lower.includes("built") || lower.includes("conect") || lower.includes("servicio")) {
    return `This app connects ${picked.join(", ")}, on top of what every Pollar app has: passkey smart wallets, cash in with QR, Pix and bank transfer through Stellar anchors, settlement in ${asset} and a public record on Stellar Expert. The Built with tab draws the whole picture.`;
  }
  if (lower.includes("credit") || lower.includes("cost") || lower.includes("credito") || lower.includes("cuesta")) {
    return "Each change you ask for here rebuilds your preview for 15 credits. Publishing it is free. Questions are free too.";
  }
  return `${app.name} is a ${app.kind.replace(/-/g, " ")} app published at ${app.url}. Users sign in with a passkey, pay in ${asset} and the contract on Stellar ${network} settles it. Ask me about the contract, the connected services, or tell me what to change.`;
}

// What the template contract does, by kind. Chat rules get appended to these.
export function templateRules(app: App): string[] {
  const asset = app.asset ?? "USDC";
  const base = [`Accepts payments in ${asset} from any passkey wallet`, "Network fees paid by your sponsor wallet"];
  const byKind: Record<App["kind"], string[]> = {
    "pasanaku-circles": ["Holds each round in escrow until all members paid", "Pays the round to the member whose turn it is"],
    "bill-split": ["Collects every share in escrow", "Pays the restaurant when the bill is complete"],
    "money-pool": ["Keeps contributions in a yield vault until the goal", "Releases the pool to the organizer when the goal is met"],
    "vendor-pay-link": ["Forwards each payment to the vendor wallet", "Swaps other assets to the settlement asset on arrival"],
    "qr-menu-orders": ["Settles each order to the restaurant wallet", "Daily cashout to the bank account"],
    "raffle-hub": ["Keeps the prize in escrow until the draw", "Pays the winner picked by the on-chain draw"],
    "event-tickets": ["Holds ticket money until the event date", "Refunds everyone if the event is cancelled"],
    "match-predictions": ["Keeps stakes in escrow until the match ends", "Settles against the oracle result"],
    "market-orders": ["Pays each stall when the order is picked up", "Weekly cashout for stall owners"],
  };
  return [...base, ...byKind[app.kind]];
}
