export type AppKind =
  | "pasanaku-circles"
  | "bill-split"
  | "money-pool"
  | "vendor-pay-link"
  | "qr-menu-orders"
  | "raffle-hub"
  | "event-tickets"
  | "match-predictions"
  | "market-orders";

export type JobStatus =
  | "queued"
  | "generating"
  | "building"
  | "retrying"
  | "publishing"
  | "published"
  | "failed";

export type JobTrigger = "prompt" | "push" | "manual" | "chat";

export interface Job {
  id: string;
  appId: string;
  status: JobStatus;
  attempt: number; // 1 to 3
  logs: string[]; // one line per step, "1.2s text" or "1.2s error: text"
  startedAt: number;
  finishedAt?: number;
  updatedAt?: number; // last log or status change, used to detect orphaned jobs
  trigger: JobTrigger;
  commit?: { sha: string; message: string }; // the source revision this job deployed
  changes?: string[]; // chat jobs: what is being changed
  patch?: Partial<App>; // chat jobs: applied to the app when it publishes
}

export type Asset = "USDC" | "USDT" | "XLM";
export type Network = "testnet" | "mainnet";
export type Target = "web" | "mobile" | "telegram" | "whatsapp";
export type PlanId = "free" | "builder" | "pro";

// Parts an app can share with the maker's other apps instead of having its own copy.
export type SharedPart = "accounts" | "kyc" | "sponsor";
export const SHARED_PARTS: SharedPart[] = ["accounts", "kyc", "sponsor"];

export interface App {
  id: string;
  asset?: Asset; // settlement asset on Stellar, USDC by default
  assets?: Asset[]; // every token the app accepts; asset is the one it settles in
  countries?: Array<"BO" | "BR" | "AR">; // where users can cash in and cash out
  network?: Network;
  target?: Target;
  slug: string; // e.g. "pasanaku-circles-7f3a"
  name: string;
  kind: AppKind;
  prompt: string;
  status: "draft" | "published";
  url: string; // `https://${slug}.pollar.app` as text only, the preview lives at /preview/[slug]
  apiKey: string; // "plr_live_" + 24 chars
  sponsorWallet: string; // "G" + 55 chars
  contractId?: string; // "C" + 55 chars, set when published
  github?: { repoUrl: string; lastPushAt?: number };
  createdAt: number;
  jobIds: string[];
  themeColor?: string; // accent used by the generated app, set from chat
  maker?: { name: string; email: string }; // who built it, shown in the marketplace
  listing?: Listing; // set when the maker publishes the app to the marketplace
  payoutWallet?: string; // mainnet: where the contract sends the maker's money
  shared?: SharedPart[]; // what this app shares with the maker's other apps, picked before publishing
  businessName?: string; // mainnet: shown on receipts
  previewSha?: string; // last build the maker can review
  publishedSha?: string; // build that is live on the public address
  publishedAt?: number;
  rules?: string[]; // contract rules added from chat, on top of the template ones
}

// Logo and banner are either generated (color + icon + pattern) or an uploaded image as a small data URL.
export interface ListingArt {
  color: string;
  pattern: "dots" | "grid" | "waves" | "none";
  image?: string;
}

export interface Listing {
  tagline: string;
  logo: ListingArt;
  banner: ListingArt;
  listedAt: number;
}

export type ChatIntent = "design" | "contract" | "payments" | "screens" | "question";

export interface ChatMessage {
  id: string;
  appId: string;
  role: "user" | "assistant";
  text: string;
  at: number;
  intent?: ChatIntent;
  changes?: string[]; // what the assistant changed, one line each
  jobId?: string; // rebuild started by this message
  credits?: number;
}

export type Country = "BO" | "BR" | "AR" | "PT";

export interface Tx {
  id: string;
  appSlug: string;
  hash: string; // 64 hex
  from: string; // wallet G...
  country: Country;
  amount: number; // in stablecoins
  type: "payment" | "cashout";
  at: number;
}

export interface Rating {
  id: string;
  appId: string;
  email: string; // who rated, one rating per account per app
  stars: 1 | 2 | 3 | 4 | 5;
  at: number;
}

export interface Account {
  email: string;
  credits: number; // starts at 500
  generationsUsed: number; // cap 5
  topUps?: number; // credits added on top of the starting 500
  plan?: PlanId; // free by default
  planSince?: number; // when the paid plan started, renews every 30 days
  name?: string;
  createdAt?: number;
}

export interface CreditEntry {
  id: string;
  at: number;
  amount: number;
  reason: string;
  appId?: string;
  paidUsdc?: number; // purchases only: what the maker paid from their wallet
  hash?: string; // purchases only: the Stellar payment
}

export const COUNTRIES: Country[] = ["BO", "BR", "AR", "PT"];

export const COUNTRY_NAMES: Record<Country, string> = {
  BO: "Bolivia",
  BR: "Brazil",
  AR: "Argentina",
  PT: "Portugal",
};

export const ASSETS: Asset[] = ["USDC", "USDT", "XLM"];

export type RailCountry = "BO" | "BR" | "AR";
export const RAIL_COUNTRIES: Array<{ code: RailCountry; name: string; currency: string; rail: string; flag: string }> = [
  { code: "BO", name: "Bolivia", currency: "BOB", rail: "QR", flag: "🇧🇴" },
  { code: "BR", name: "Brazil", currency: "BRL", rail: "Pix", flag: "🇧🇷" },
  { code: "AR", name: "Argentina", currency: "ARS", rail: "Transfer", flag: "🇦🇷" },
];

// Shown in the country picker as coming soon. Not selectable yet, so they are not RailCountry values.
export const SOON_COUNTRIES: Array<{ code: string; name: string; currency: string; flag: string }> = [
  { code: "PE", name: "Peru", currency: "PEN", flag: "🇵🇪" },
  { code: "MX", name: "Mexico", currency: "MXN", flag: "🇲🇽" },
  { code: "CL", name: "Chile", currency: "CLP", flag: "🇨🇱" },
  { code: "CO", name: "Colombia", currency: "COP", flag: "🇨🇴" },
  { code: "CR", name: "Costa Rica", currency: "CRC", flag: "🇨🇷" },
];

export const TARGET_LABELS: Record<Target, string> = {
  web: "Web app",
  mobile: "Mobile",
  telegram: "Telegram mini app",
  whatsapp: "WhatsApp",
};

export const KIND_LABELS: Record<AppKind, string> = {
  "pasanaku-circles": "Savings circle",
  "bill-split": "Bill split",
  "money-pool": "Money pool",
  "vendor-pay-link": "Pay link",
  "qr-menu-orders": "QR menu",
  "raffle-hub": "Raffle",
  "event-tickets": "Event tickets",
  "match-predictions": "Match predictions",
  "market-orders": "Market orders",
};
