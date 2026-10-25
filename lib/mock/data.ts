import type { Account } from "./types";
import { buildSeed } from "./seed";
import { STARTING_CREDITS } from "./store-constants";

export const MOCK_NOW = Date.UTC(2026, 9, 23);
export const MOCK_DATA = buildSeed(MOCK_NOW);
export const MOCK_ACCOUNT: Account = {
  email: "maker@pollar.app",
  name: "Pollar Maker",
  credits: STARTING_CREDITS,
  generationsUsed: 2,
  plan: "free",
};
