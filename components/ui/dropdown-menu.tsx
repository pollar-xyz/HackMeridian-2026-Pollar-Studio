"use client";

import type { ComponentProps } from "react";
import { DropdownMenu as Primitive } from "radix-ui";
import { cn } from "@/lib/utils";

export const DropdownMenu = Primitive.Root;
export const DropdownMenuTrigger = Primitive.Trigger;
export const DropdownMenuPortal = Primitive.Portal;
export const DropdownMenuRadioGroup = Primitive.RadioGroup;
export const DropdownMenuItemIndicator = Primitive.ItemIndicator;
export function DropdownMenuLabel({
  className,
  ...props
}: ComponentProps<typeof Primitive.Label>) {
  return (
    <Primitive.Label
      data-slot="dropdown-menu-label"
      className={cn("px-2.5 py-2 text-xs text-muted", className)}
      {...props}
    />
  );
}
export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof Primitive.Separator>) {
  return (
    <Primitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("my-1 h-px bg-line", className)}
      {...props}
    />
  );
}
export function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<typeof Primitive.Item>) {
  return (
    <Primitive.Item
      data-slot="dropdown-menu-item"
      className={cn(
        "relative flex w-full cursor-default select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm outline-none data-[highlighted]:bg-background data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
export function DropdownMenuRadioItem({
  className,
  ...props
}: ComponentProps<typeof Primitive.RadioItem>) {
  return (
    <Primitive.RadioItem
      data-slot="dropdown-menu-radioitem"
      className={cn(
        "relative flex w-full cursor-default select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm outline-none data-[highlighted]:bg-background data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
export function DropdownMenuCheckboxItem({
  className,
  ...props
}: ComponentProps<typeof Primitive.CheckboxItem>) {
  return (
    <Primitive.CheckboxItem
      data-slot="dropdown-menu-checkboxitem"
      className={cn(
        "relative flex w-full cursor-default select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm outline-none data-[highlighted]:bg-background data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Content
      data-slot="dropdown-menu-content"
      sideOffset={sideOffset}
      collisionPadding={8}
      className={cn(
        "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-line bg-surface p-1 text-foreground shadow-lg",
        className,
      )}
      {...props}
    />
  );
}

export const DropdownMenuSub = Primitive.Sub;
export function DropdownMenuSubTrigger({
  className,
  ...props
}: ComponentProps<typeof Primitive.SubTrigger>) {
  return (
    <Primitive.SubTrigger
      data-slot="dropdown-menu-subtrigger"
      className={cn(
        "flex cursor-default select-none items-center justify-between rounded-lg px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-background",
        className,
      )}
      {...props}
    />
  );
}
export function DropdownMenuSubContent({
  className,
  ...props
}: ComponentProps<typeof Primitive.SubContent>) {
  return (
    <Primitive.Portal>
      <Primitive.SubContent
        data-slot="dropdown-menu-subcontent"
        collisionPadding={8}
        className={cn(
          "z-50 min-w-40 rounded-xl border border-line bg-surface p-1 text-foreground shadow-lg",
          className,
        )}
        {...props}
      />
    </Primitive.Portal>
  );
}
