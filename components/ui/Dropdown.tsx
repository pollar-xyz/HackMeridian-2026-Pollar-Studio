"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuCheckboxItem,
  DropdownMenuItemIndicator,
} from "@/components/ui/dropdown-menu";
import {
  CheckIcon,
  ChevronDownIcon,
  LockClosedIcon,
} from "@radix-ui/react-icons";

export interface DropdownItem<T extends string> {
  value: T;
  label: string;
  note?: string;
  locked?: boolean;
  soon?: boolean;
  icon?: React.ReactNode;
}
const trigger =
  "inline-flex items-center gap-1.5 rounded-full border border-line bg-background font-medium text-foreground hover:border-accent data-[state=open]:border-accent";
const content =
  "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-line bg-surface p-1 text-foreground shadow-lg";
const itemClass =
  "relative flex w-full cursor-default select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm outline-none data-[highlighted]:bg-background data-[disabled]:pointer-events-none data-[disabled]:opacity-60";

function ItemLabel<T extends string>({
  item,
  soonLabel = "Soon",
}: {
  item: DropdownItem<T>;
  soonLabel?: string;
}) {
  return (
    <>
      {item.icon && (
        <span aria-hidden className="shrink-0">
          {item.icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{item.label}</span>
        {item.note && (
          <span className="block text-xs text-muted">{item.note}</span>
        )}
      </span>
      {item.locked && <LockClosedIcon aria-hidden className="text-muted" />}
      {item.soon && (
        <span className="rounded-full bg-background px-1.5 text-[10px] text-muted">
          {soonLabel}
        </span>
      )}
    </>
  );
}

export function Dropdown<T extends string>({
  label,
  icon,
  items,
  value,
  onChange,
  direction = "up",
  align = "left",
  size = "sm",
  menuWidth = "w-64",
}: {
  label: string;
  icon?: React.ReactNode;
  items: DropdownItem<T>[];
  value: T;
  onChange: (value: T) => void;
  direction?: "up" | "down";
  align?: "left" | "right";
  size?: "sm" | "md";
  menuWidth?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`${trigger} ${size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"}`}
      >
        <span aria-hidden>{icon}</span>
        {label}
        <ChevronDownIcon aria-hidden className="text-muted" />
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent
          aria-label={label}
          side={direction === "up" ? "top" : "bottom"}
          align={align === "left" ? "start" : "end"}
          sideOffset={6}
          collisionPadding={8}
          className={`${content} ${menuWidth}`}
        >
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(next) => onChange(next as T)}
          >
            {items.map((item) => (
              <DropdownMenuRadioItem
                key={item.value}
                value={item.value}
                disabled={item.locked || item.soon}
                className={itemClass}
              >
                <ItemLabel item={item} />
                <DropdownMenuItemIndicator>
                  <CheckIcon aria-hidden className="text-accent" />
                </DropdownMenuItemIndicator>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}

export function MultiDropdown<T extends string>({
  label,
  icon,
  items,
  values,
  onChange,
  direction = "up",
  hint,
  allowEmpty,
  soonLabel = "Soon",
}: {
  label: string;
  icon?: React.ReactNode;
  items: DropdownItem<T>[];
  values: T[];
  onChange: (values: T[]) => void;
  direction?: "up" | "down";
  hint?: React.ReactNode;
  allowEmpty?: boolean;
  soonLabel?: string;
}) {
  const toggle = (value: T) => {
    if (values.includes(value)) {
      if (values.length > 1 || allowEmpty)
        onChange(values.filter((v) => v !== value));
    } else
      onChange(
        items
          .map((item) => item.value)
          .filter((v) => v === value || values.includes(v)),
      );
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={`${trigger} px-2.5 py-1.5 text-xs`}>
        <span aria-hidden>{icon}</span>
        {label}
        <ChevronDownIcon aria-hidden className="text-muted" />
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent
          aria-label={label}
          side={direction === "up" ? "top" : "bottom"}
          align="start"
          sideOffset={6}
          collisionPadding={8}
          className={`${content} w-64`}
        >
          {items.map((item) => (
            <DropdownMenuCheckboxItem
              key={item.value}
              checked={values.includes(item.value)}
              disabled={item.locked || item.soon}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={() => toggle(item.value)}
              className={itemClass}
            >
              <span
                aria-hidden
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-line"
              >
                <DropdownMenuItemIndicator>
                  <CheckIcon className="text-accent" />
                </DropdownMenuItemIndicator>
              </span>
              <ItemLabel item={item} soonLabel={soonLabel} />
            </DropdownMenuCheckboxItem>
          ))}
          {hint && (
            <DropdownMenuLabel className="mt-1 border-t border-line px-2.5 py-2 text-[11px] text-muted">
              {hint}
            </DropdownMenuLabel>
          )}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
