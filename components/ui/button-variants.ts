import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ink"
  | "ghost"
  | "danger"
  | "link"
  | "unstyled";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<ButtonVariant, string> = {
  link: "text-accent underline-offset-4 hover:underline",
  unstyled: "",
  primary: "bg-accent text-white hover:bg-accent-strong",
  secondary: "border border-line bg-surface text-foreground hover:bg-background",
  ink: "bg-ink text-white hover:opacity-90",
  ghost: "text-muted hover:bg-background hover:text-foreground",
  danger: "bg-danger text-white hover:opacity-90",
};

const SIZES: Record<ButtonSize, string> = {
  icon: "size-9 rounded-lg p-2",
  sm: "px-2.5 py-1.5 text-xs rounded-md gap-1",
  md: "px-4 py-2.5 text-sm rounded-lg gap-2",
  lg: "px-5 py-3 text-base rounded-xl gap-2",
};

const BASE =
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export const buttonVariants = cva(BASE, {
  variants: { variant: VARIANTS, size: SIZES },
  defaultVariants: { variant: "primary", size: "md" },
});

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className = "",
) {
  if (variant === "unstyled")
    return cn("disabled:cursor-not-allowed disabled:opacity-50", className);
  return cn(buttonVariants({ variant, size }), className);
}
