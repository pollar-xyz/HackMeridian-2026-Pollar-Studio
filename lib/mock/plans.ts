import type { PlanId } from "./types";

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  priceUsdc: number; // per month, 0 for free
  monthlyCredits: number;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "For the event",
    priceUsdc: 0,
    monthlyCredits: 500,
    features: ["500 credits", "5 generations", "Publish on Stellar testnet", "Login, wallet, payments and cashout included"],
  },
  {
    id: "builder",
    name: "Builder",
    tagline: "Ship to real users",
    priceUsdc: 10,
    monthlyCredits: 1000,
    features: [
      "1,000 credits a month",
      "Unlimited generations",
      "Publish on Stellar mainnet",
      "Export to GitHub with push to deploy",
      "Custom domain",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For teams",
    priceUsdc: 30,
    monthlyCredits: 4000,
    features: [
      "4,000 credits a month",
      "Everything in Builder",
      "3 team seats",
      "Priority builds",
      "Lower payment fees on cashouts",
    ],
  },
];

export function planById(id: PlanId | undefined): Plan {
  return PLANS.find((p) => p.id === (id ?? "free")) ?? PLANS[0];
}
