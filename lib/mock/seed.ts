import { makeRng, pick, txHash, walletAddress, apiKey } from "./random";
import type { App, Job, Tx, Country, Rating, Listing } from "./types";
import { COUNTRIES } from "./types";

const HOUR = 60 * 60 * 1000;

export const SEED_LISTINGS: Record<string, Listing> = {
  "pasanaku-circles-a1b2": {
    tagline: "Save together, one friend collects each week",
    logo: { color: "#0f766e", pattern: "none" },
    banner: { color: "#0f766e", pattern: "dots" },
    listedAt: Date.UTC(2026, 9, 19),
  },
  "qr-menu-orders-c3d4": {
    tagline: "Scan, order and pay from your table",
    logo: { color: "#c2410c", pattern: "none" },
    banner: { color: "#c2410c", pattern: "grid" },
    listedAt: Date.UTC(2026, 9, 20),
  },
  "raffle-hub-e5f6": {
    tagline: "Fair raffles with the prize in escrow",
    logo: { color: "#6d28d9", pattern: "none" },
    banner: { color: "#6d28d9", pattern: "waves" },
    listedAt: Date.UTC(2026, 9, 21),
  },
};

export const SEED_MAKERS: Record<string, { name: string; email: string }> = {
  "pasanaku-circles-a1b2": { name: "Mariela Quispe", email: "mariela@pollar.app" },
  "qr-menu-orders-c3d4": { name: "Diego Fernández", email: "diego@pollar.app" },
  "raffle-hub-e5f6": { name: "Camila Rocha", email: "camila@pollar.app" },
};

export function buildSeed(now: number): { apps: App[]; jobs: Job[]; txs: Tx[]; ratings: Rating[] } {
  const rng = makeRng("pollar-seed-v1");

  const defs: Array<Pick<App, "id" | "slug" | "name" | "kind" | "prompt"> & { ageHours: number }> = [
    {
      id: "app_seed_a1b2_1",
      slug: "pasanaku-circles-a1b2",
      name: "Friends savings circle",
      kind: "pasanaku-circles",
      prompt:
        "A rotating savings circle for 10 friends with weekly contributions of 5 stablecoins. Every week one member collects the pot.",
      ageHours: 70,
    },
    {
      id: "app_seed_c3d4_2",
      slug: "qr-menu-orders-c3d4",
      name: "Corner cafe QR menu",
      kind: "qr-menu-orders",
      prompt:
        "A QR menu for my cafe in La Paz. Customers scan the code, pick from six items and pay from their phone.",
      ageHours: 46,
    },
    {
      id: "app_seed_e5f6_3",
      slug: "raffle-hub-e5f6",
      name: "Neighborhood raffle",
      kind: "raffle-hub",
      prompt:
        "A raffle for my neighborhood with 50 tickets at 2 stablecoins each and a 100 stablecoins prize.",
      ageHours: 30,
    },
  ];

  const apps: App[] = [];
  const jobs: Job[] = [];

  for (const def of defs) {
    const createdAt = now - def.ageHours * HOUR;
    const jobId = `job_seed_${def.slug}`;
    apps.push({
      id: def.id,
      slug: def.slug,
      name: def.name,
      kind: def.kind,
      prompt: def.prompt,
      status: "published",
      // The marketplace only lists real apps, so the showcase apps run on mainnet.
      network: "mainnet",
      url: `https://${def.slug}.pollar.app`,
      apiKey: apiKey(rng),
      sponsorWallet: walletAddress(rng),
      contractId: "C" + walletAddress(rng).slice(1),
      createdAt,
      jobIds: [jobId],
      maker: SEED_MAKERS[def.slug],
      previewSha: def.id.slice(9, 13) + "a1c",
      publishedSha: def.id.slice(9, 13) + "a1c",
      publishedAt: createdAt + 9000,
      listing: SEED_LISTINGS[def.slug],
    });
    jobs.push({
      id: jobId,
      appId: def.id,
      status: "published",
      attempt: 1,
      trigger: "prompt",
      startedAt: createdAt,
      finishedAt: createdAt + 8400,
      logs: [
        "0.0s Job queued",
        "0.6s Reading prompt",
        `1.4s Picked template ${def.kind}`,
        "2.2s Generating app/ and components/",
        "2.7s Wiring Pollar SDK: passkey login, wallet, PayButton",
        "3.1s pnpm install",
        "3.8s tsc",
        "4.5s pnpm build",
        "5.1s Deploying payment contract to Stellar testnet",
        "5.5s Contract live",
        "5.7s Sponsor wallet funded, network fees covered for your users",
        "6.0s Stablecoin rails enabled: QR Bolivia, Pix Brazil, Transfer Argentina",
        "6.2s Identity checks connected for bank cashouts",
        "6.4s Creating API key",
        `6.7s Deploying to ${def.slug}.pollar.app`,
        "6.9s Registered in apps.json",
        "8.4s Published",
      ],
    });
  }

  // 40 transactions: 34 payments, 6 cashouts, spread over the last 24 hours.
  const txs: Tx[] = [];
  const wallets: string[] = [];
  for (let i = 0; i < 18; i++) wallets.push(walletAddress(rng));

  const amounts = [2, 5, 10, 12, 15, 20, 25, 30, 4.5, 7.5];
  for (let i = 0; i < 40; i++) {
    const isCashout = i % 7 === 6; // indexes 6, 13, 20, 27, 34 and one more below
    const app = apps[i % 3];
    const country: Country = pick(rng, COUNTRIES);
    const at = now - Math.floor(rng() * 24 * HOUR);
    txs.push({
      id: `tx_seed_${i.toString().padStart(2, "0")}`,
      appSlug: app.slug,
      hash: txHash(rng),
      from: pick(rng, wallets),
      country,
      amount: isCashout ? pick(rng, [20, 35, 50, 80]) : pick(rng, amounts),
      type: isCashout ? "cashout" : "payment",
      at,
    });
  }
  // Make the sixth cashout explicit so the count is exactly 6.
  txs[2].type = "cashout";
  txs[2].amount = 40;

  txs.sort((a, b) => a.at - b.at);

  // Ratings from event attendees. Weighted so the raffle leads, the circle is close, the menu a bit lower.
  const ratings: Rating[] = [];
  const profile: Array<[string, number, number[]]> = [
    [apps[2].id, 31, [5, 5, 5, 4, 5, 4, 5]],
    [apps[0].id, 23, [5, 4, 5, 4, 5, 4, 4]],
    [apps[1].id, 17, [4, 4, 5, 3, 4, 4, 5]],
  ];
  for (const [appId, count, pattern] of profile) {
    for (let i = 0; i < count; i++) {
      ratings.push({
        id: `rt_seed_${appId}_${i}`,
        appId,
        email: `attendee${i + 1}@event.pollar.app`,
        stars: pattern[i % pattern.length] as Rating["stars"],
        at: now - Math.floor(rng() * 24 * HOUR),
      });
    }
  }
  return { apps, jobs, txs, ratings };
}
