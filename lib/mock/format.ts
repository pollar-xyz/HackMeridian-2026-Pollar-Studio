export function formatAmount(n: number): string {
  return n.toFixed(2);
}

// The unit a generated app shows money in. An app made without stablecoins works only in XLM.
// Each generated app renders alone in its own page (preview, iframe, thumbnail), so its provider sets this once.
let unit = "stablecoins";
export function setMoneyUnit(next: string) {
  unit = next;
}
export function moneyUnit(): string {
  return unit;
}
export function unitFor(assets: string[] | undefined): string {
  return assets && assets.length > 0 && assets.every((a) => a === "XLM") ? "XLM" : "stablecoins";
}

export function formatStable(n: number): string {
  return `${n.toFixed(2)} ${unit}`;
}

export function timeAgo(at: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - at);
  const s = Math.floor(diff / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function clock(at: number): string {
  const d = new Date(at);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
