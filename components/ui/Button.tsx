"use client";

import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip";
import { Slot } from "radix-ui";
import { buttonClass } from "./button-variants";
import type { ButtonSize, ButtonVariant } from "./button-variants";
import Link from "next/link";
import type { ComponentProps } from "react";
export { buttonClass, buttonVariants } from "./button-variants";
export type { ButtonSize, ButtonVariant } from "./button-variants";

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  asChild = false,
  type = "button",
  title,
  ...rest
}: ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
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
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}

export function ButtonAnchor({
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: ComponentProps<"a"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <a className={buttonClass(variant, size, className)} {...rest} />;
}
