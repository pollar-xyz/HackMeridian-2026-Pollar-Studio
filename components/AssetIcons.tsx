import type { Asset } from "@/lib/mock/types";

// Inline marks so the composer never loads images from the network.

export function StellarIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12.283 1.851A10.154 10.154 0 0 0 1.846 12.002c0 .259.01.516.03.773A1.847 1.847 0 0 1 .872 14.56L0 15.005v2.074l2.568-1.309.832-.424.82-.417 14.71-7.496 1.653-.842L24 4.85V2.776l-3.387 1.728-2.89 1.473-13.955 7.108a8.376 8.376 0 0 1-.07-1.086 8.313 8.313 0 0 1 12.366-7.247l1.654-.843.247-.126a10.154 10.154 0 0 0-5.682-1.932zM24 6.925 5.055 16.571l-1.653.844L0 19.15v2.072l3.378-1.722 2.89-1.473 13.97-7.117a8.474 8.474 0 0 1 .07 1.092A8.313 8.313 0 0 1 7.93 19.248l-.101.054-1.793.914a10.154 10.154 0 0 0 16.119-8.214c0-.26-.01-.522-.03-.78a1.848 1.848 0 0 1 1.003-1.785L24 8.992z" fill="currentColor" />
    </svg>
  );
}

function Coin({ size, bg, children }: { size: number; bg: string; children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="12" fill={bg} />
      {children}
    </svg>
  );
}

export function UsdcIcon({ size = 16 }: { size?: number }) {
  return (
    <Coin size={size} bg="#2775CA">
      <path d="M9.2 4.6a8 8 0 0 0 0 14.8M14.8 4.6a8 8 0 0 1 0 14.8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <text x="12" y="15.6" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">
        $
      </text>
    </Coin>
  );
}

export function UsdtIcon({ size = 16 }: { size?: number }) {
  return (
    <Coin size={size} bg="#26A17B">
      <path d="M6 6.5h12v2.6h-4.4v1.4c3 .2 5.2 .9 5.2 1.8s-2.2 1.6-5.2 1.8v4.4h-3.2v-4.4c-3-.2-5.2-.9-5.2-1.8s2.2-1.6 5.2-1.8V9.1H6V6.5Zm4.4 5.3v1.3c.5 0 1 .1 1.6.1s1.1 0 1.6-.1v-1.3c-.5 0-1-.1-1.6-.1s-1.1 0-1.6.1Z" fill="#fff" />
    </Coin>
  );
}

export function XlmIcon({ size = 16 }: { size?: number }) {
  return (
    <Coin size={size} bg="#0F1B2D">
      <g transform="translate(5.5 5.5) scale(0.54)" fill="#fff">
        <path d="M12.283 1.851A10.154 10.154 0 0 0 1.846 12.002c0 .259.01.516.03.773A1.847 1.847 0 0 1 .872 14.56L0 15.005v2.074l2.568-1.309.832-.424.82-.417 14.71-7.496 1.653-.842L24 4.85V2.776l-3.387 1.728-2.89 1.473-13.955 7.108a8.376 8.376 0 0 1-.07-1.086 8.313 8.313 0 0 1 12.366-7.247l1.654-.843.247-.126a10.154 10.154 0 0 0-5.682-1.932zM24 6.925 5.055 16.571l-1.653.844L0 19.15v2.072l3.378-1.722 2.89-1.473 13.97-7.117a8.474 8.474 0 0 1 .07 1.092A8.313 8.313 0 0 1 7.93 19.248l-.101.054-1.793.914a10.154 10.154 0 0 0 16.119-8.214c0-.26-.01-.522-.03-.78a1.848 1.848 0 0 1 1.003-1.785L24 8.992z" />
      </g>
    </Coin>
  );
}

export function AssetIcon({ asset, size = 16 }: { asset: Asset; size?: number }) {
  if (asset === "USDC") return <UsdcIcon size={size} />;
  if (asset === "USDT") return <UsdtIcon size={size} />;
  return <XlmIcon size={size} />;
}
