import type { App, AppKind } from "./types";

// Stellar ecosystem projects an app can be wired to. Short, honest roles so a maker who never
// heard of a project understands what it does for them. URLs checked on 2026-10-22.
export interface EcoProject {
  id: string;
  name: string;
  url: string;
  what: string; // one line, what the project is
}

export const PROJECTS: Record<string, EcoProject> = {
  pollar: { id: "pollar", name: "Pollar", url: "https://pollar.app", what: "Passkey login, wallets, stablecoin payments and bank cashouts as an SDK." },
  stellar: { id: "stellar", name: "Stellar and Soroban", url: "https://developers.stellar.org", what: "The network and its smart contract platform. Settlement in seconds, fees under a cent." },
  usdc: { id: "usdc", name: "USDC on Stellar", url: "https://stellar.org/products-and-tools/circle-usdc-eurc", what: "Circle's dollar stablecoin, issued natively on Stellar." },
  passkeys: { id: "passkeys", name: "passkey-kit", url: "https://github.com/kalepail/passkey-kit", what: "Smart wallets controlled by passkeys. No seed phrase, no extension." },
  anchors: { id: "anchors", name: "Stellar anchors (SEP-24)", url: "https://developers.stellar.org/docs/learn/fundamentals/anchors", what: "Regulated on and off ramps that move money between banks and Stellar." },
  anclap: { id: "anclap", name: "Anclap", url: "https://home.anclap.com", what: "Anchor for Latin America. Bank transfers in and out in local currency." },
  defindex: { id: "defindex", name: "DeFindex", url: "https://www.defindex.io", what: "Yield vaults on Stellar. Idle balances earn while they wait." },
  trustless: { id: "trustless", name: "Trustless Work", url: "https://www.trustlesswork.com", what: "Escrow as a service on Stellar. Funds release when the conditions are met." },
  soroswap: { id: "soroswap", name: "Soroswap", url: "https://soroswap.finance", what: "Swap aggregator on Stellar. Accept any asset, settle in the one you want." },
  blend: { id: "blend", name: "Blend", url: "https://blend.capital", what: "Lending markets on Stellar." },
  reflector: { id: "reflector", name: "Reflector", url: "https://reflector.network", what: "Price and data oracle on Stellar for settling outcomes." },
  expert: { id: "expert", name: "Stellar Expert", url: "https://stellar.expert", what: "Block explorer. Every payment of your app is public and checkable." },
};

export interface Integration {
  project: EcoProject;
  role: string; // what it does inside this app
  core?: boolean; // part of every Pollar app
}

const CORE: Array<[string, string]> = [
  ["pollar", "Login, wallet, PayButton, cash in with QR, Pix and transfer, cashout to bank, identity checks."],
  ["stellar", "Runs the payment contract. Every payment and cashout is a transaction on the network."],
  ["usdc", "Settlement asset for balances, payments and cashouts."],
  ["passkeys", "Each user gets a smart wallet opened with Face ID or fingerprint."],
  ["anchors", "Cash in from Bolivia, Brazil and Argentina, and cashouts to bank accounts."],
  ["expert", "Explorer link for the contract and every transaction."],
];

const BY_KIND: Record<AppKind, Array<[string, string]>> = {
  "pasanaku-circles": [
    ["trustless", "Holds each round's pot in escrow and releases it to the member who collects."],
    ["defindex", "The pot earns yield between contribution day and payout day."],
  ],
  "bill-split": [["trustless", "Collects every share in escrow and pays the restaurant once the bill is complete."]],
  "money-pool": [
    ["defindex", "Pooled funds earn yield until the goal is reached."],
    ["trustless", "Releases the pool to the organizer only when the goal is met."],
  ],
  "vendor-pay-link": [
    ["soroswap", "Clients can pay in XLM or USDT, the vendor always receives USDC."],
    ["anclap", "Settles the vendor's earnings to a bank account in local currency."],
  ],
  "qr-menu-orders": [
    ["soroswap", "Diners pay with any Stellar asset, the restaurant settles in USDC."],
    ["anclap", "Daily cashout of the till to the restaurant's bank account."],
  ],
  "raffle-hub": [
    ["trustless", "The prize sits in escrow until the draw and goes straight to the winner."],
    ["reflector", "On-chain randomness source for a draw nobody can rig."],
  ],
  "event-tickets": [
    ["trustless", "Ticket money is held until the event happens, refunds if it is cancelled."],
  ],
  "match-predictions": [
    ["reflector", "Match results come from an oracle feed, so settlement is automatic."],
    ["trustless", "Stakes stay in escrow until the final whistle."],
  ],
  "market-orders": [
    ["trustless", "Each stall gets paid when the order is marked as picked up."],
    ["anclap", "Stall owners cash out to their bank accounts weekly."],
  ],
};

export function integrationsFor(app: App): Integration[] {
  const core: Integration[] = CORE.map(([id, role]) => ({ project: PROJECTS[id], role, core: true }));
  if (app.asset && app.asset !== "USDC") {
    core[2] = {
      project: { ...PROJECTS.usdc, name: `${app.asset} on Stellar`, what: app.asset === "XLM" ? "The native asset of the Stellar network." : "Tether's dollar stablecoin, issued on Stellar." },
      role: "Settlement asset for balances, payments and cashouts.",
      core: true,
    };
  }
  const specific: Integration[] = BY_KIND[app.kind].map(([id, role]) => ({ project: PROJECTS[id], role }));
  return [...specific, ...core];
}
