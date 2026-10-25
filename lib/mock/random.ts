// Deterministic helpers. Same seed, same values. No crypto, this is a mock.

export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type Rng = () => number;

export function makeRng(seed: number | string): Rng {
  let a = typeof seed === "string" ? hashString(seed) : seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HEX = "0123456789abcdef";
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const ALNUM = "abcdefghijklmnopqrstuvwxyz0123456789";

export function pick<T>(rng: Rng, list: readonly T[]): T {
  return list[Math.floor(rng() * list.length)];
}

export function chars(rng: Rng, alphabet: string, length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[Math.floor(rng() * alphabet.length)];
  return out;
}

export function hex(rng: Rng, length: number): string {
  return chars(rng, HEX, length);
}

export function txHash(rng: Rng): string {
  return hex(rng, 64);
}

export function walletAddress(rng: Rng): string {
  return "G" + chars(rng, BASE32, 55);
}

export function apiKey(rng: Rng): string {
  return "plr_live_" + chars(rng, ALNUM, 24);
}

function liveRng(): Rng {
  return makeRng(Date.now() ^ Math.floor(Math.random() * 0xffffffff));
}

// Ids always end in a digit so "even id" has a clear meaning.
export function newId(prefix: string): string {
  const rng = liveRng();
  return `${prefix}_${hex(rng, 6)}${Math.floor(rng() * 10)}`;
}

export function endsEven(id: string): boolean {
  const last = Number(id[id.length - 1]);
  return Number.isInteger(last) && last % 2 === 0;
}

export function randomHash(): string {
  return txHash(liveRng());
}

export function randomWallet(): string {
  return walletAddress(liveRng());
}

export function randomContractId(): string {
  return "C" + chars(liveRng(), BASE32, 55);
}

export function randomApiKey(): string {
  return apiKey(liveRng());
}

export function shortHash(hash: string): string {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

export function shortWallet(wallet: string): string {
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}
