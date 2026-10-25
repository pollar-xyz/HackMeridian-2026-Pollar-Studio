"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className = "",
  stretch,
  "aria-label": label = "Options",
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  stretch?: boolean;
  "aria-label"?: string;
}) {
  return (
    <RadioGroup
      aria-label={label}
      orientation="horizontal"
      value={value}
      onValueChange={(next) => onChange(next as T)}
      className={`inline-flex rounded-lg border border-line bg-background p-0.5 text-xs ${className}`}
    >
      {options.map((option) => (
        <RadioGroupItem
          key={option.value}
          value={option.value}
          className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 font-medium text-muted transition-colors hover:text-foreground data-[state=checked]:bg-accent data-[state=checked]:text-white ${stretch ? "flex-1" : ""}`}
        >
          {option.label}
        </RadioGroupItem>
      ))}
    </RadioGroup>
  );
}
