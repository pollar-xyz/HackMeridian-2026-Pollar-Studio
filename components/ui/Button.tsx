"use client";

import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip";
import { Slot } from "radix-ui";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ComponentProps } from "react";

type Variant =
  "primary" | "secondary" | "ink" | "ghost" | "danger" | "link" | "unstyled";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<Variant, string> = {
  link: "text-accent underline-offset-4 hover:underline",
  unstyled: "",
  primary: "bg-accent text-white hover:bg-accent-strong",
  secondary:
    "border border-line bg-surface text-foreground hover:bg-background",
  ink: "bg-ink text-white hover:opacity-90",
  ghost: "text-muted hover:bg-background hover:text-foreground",
  danger: "bg-danger text-white hover:opacity-90",
};

const SIZES: Record<Size, string> = {
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
  variant: Variant = "primary",
  size: Size = "md",
  className = "",
) {
  if (variant === "unstyled")
    return cn("disabled:cursor-not-allowed disabled:opacity-50", className);
  return cn(buttonVariants({ variant, size }), className);
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  asChild = false,
  type = "button",
  title,
  ...rest
}: ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot.Root : "button";
  const button = (
    <Comp
      type={asChild ? undefined : type}
      data-slot="button"
      className={buttonClass(variant, size, className)}
      {...rest}
    />
  );
  return title ? (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{title}</TooltipContent>
    </Tooltip>
  ) : (
    button
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}

export function ButtonAnchor({
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: ComponentProps<"a"> & { variant?: Variant; size?: Size }) {
  return <a className={buttonClass(variant, size, className)} {...rest} />;
}
