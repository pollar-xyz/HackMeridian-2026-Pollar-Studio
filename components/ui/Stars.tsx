"use client";

import { useState } from "react";
import { Star } from "lucide-react";

export interface RatingSummary {
  avg: number; // 0 when nobody rated
  count: number;
  mine: number | null;
}

// Read only by default. With onRate it becomes a 1 to 5 picker with hover preview.
export function Stars({
  value,
  count,
  mine,
  size = 16,
  onRate,
  label,
  newLabel,
}: {
  value: number;
  count?: number;
  mine?: number | null;
  size?: number;
  onRate?: (stars: 1 | 2 | 3 | 4 | 5) => void;
  label?: string;
  newLabel?: string; // shown instead of a score when nobody rated yet
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? (mine && onRate ? mine : value);
  const interactive = !!onRate;

  return (
    <div className="flex items-center gap-1.5">
      <div
        role={interactive ? "radiogroup" : "img"}
        aria-label={label ?? `${value.toFixed(1)} of 5`}
        className="flex items-center"
        onMouseLeave={() => setHover(null)}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const fill = Math.max(0, Math.min(1, shown - (n - 1)));
          const star = (
            <span className="relative inline-block" style={{ width: size, height: size }}>
              <Star size={size} className="absolute inset-0 text-line" fill="currentColor" strokeWidth={0} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star size={size} className={hover !== null ? "text-accent" : "text-amber-400"} fill="currentColor" strokeWidth={0} />
              </span>
            </span>
          );
          if (!interactive) return <span key={n}>{star}</span>;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={mine === n}
              aria-label={`${n}`}
              onMouseEnter={() => setHover(n)}
              onFocus={() => setHover(n)}
              onBlur={() => setHover(null)}
              onClick={() => onRate(n as 1 | 2 | 3 | 4 | 5)}
              className="rounded-sm p-px transition-transform hover:scale-110"
            >
              {star}
            </button>
          );
        })}
      </div>
      {count !== undefined && (
        <span className="text-xs tabular-nums text-muted">
          {value > 0 ? `${value.toFixed(1)} (${count})` : (newLabel ?? "New")}
        </span>
      )}
    </div>
  );
}
