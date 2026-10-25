"use client";

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

// A small pill switch for two to four mutually exclusive options.
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className = "",
  stretch,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  stretch?: boolean;
}) {
  return (
    <div role="radiogroup" className={`inline-flex rounded-lg border border-line bg-background p-0.5 text-xs ${className}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors ${
              stretch ? "flex-1" : ""
            } ${active ? "bg-accent text-white" : "text-muted hover:text-foreground"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
