"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronsUpDown,
  Coins,
  Home,
  Languages,
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Settings,
  Sparkles,
  Store,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { useStudioStore, STARTING_CREDITS } from "@/lib/mock/store";
import { useUiStore, type SettingsSection } from "@/lib/mock/ui-store";
import { planById } from "@/lib/mock/plans";
import { usePrefs, type Lang } from "@/lib/prefs";
import { useT, LANG_LABELS } from "@/lib/i18n";
import type { Account } from "@/lib/mock/types";
import { Logo, Mark } from "@/components/Logo";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";

const NAV = [
  { href: "/studio", label: "Home", Icon: Home },
  { href: "/studio/marketplace", label: "Marketplace", Icon: Store },
  { href: "/studio/apps", label: "My apps", Icon: LayoutGrid },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/studio") return pathname === "/studio";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLinks({ pathname, onNavigate, rail }: { pathname: string | null; onNavigate?: () => void; rail?: boolean }) {
  const t = useT();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, Icon }) => {
        const active = isActive(pathname, href);
        if (rail) {
          return (
            <Link
              key={href}
              href={href}
              title={t(label)}
              aria-label={t(label)}
              aria-current={active ? "page" : undefined}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-150 ${
                active ? "bg-accent-soft text-accent" : "text-muted hover:bg-background hover:text-foreground"
              }`}
            >
              <Icon size={18} />
            </Link>
          );
        }
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
              active ? "bg-accent-soft text-accent" : "text-foreground hover:bg-background"
            }`}
          >
            <Icon size={18} className={active ? "text-accent" : "text-muted"} />
            {t(label)}
          </Link>
        );
      })}
    </nav>
  );
}

function ActiveNavLinks(props: { onNavigate?: () => void; rail?: boolean }) {
  const pathname = usePathname();
  return <NavLinks pathname={pathname} {...props} />;
}

export function SidebarNav(props: { onNavigate?: () => void; rail?: boolean }) {
  return (
    <Suspense fallback={<NavLinks pathname={null} {...props} />}>
      <ActiveNavLinks {...props} />
    </Suspense>
  );
}

export function Sidebar({ account }: { account: Account }) {
  const [open, setOpen] = useState(false);
  const t = useT();
  const collapsed = usePrefs((s) => s.sidebarCollapsed);

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface px-4 py-3 lg:hidden">
        <button type="button" onClick={() => setOpen(true)} className="rounded-md p-1.5 text-muted hover:bg-background" aria-label={t("Open menu")}>
          <Menu size={20} />
        </button>
        <Link href="/studio">
          <Logo size="sm" />
        </Link>
        <AnimatedCredits credits={account.credits} compact />
      </div>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)}>
          <div className="h-full w-72 max-w-[85%] overflow-y-auto bg-surface" onClick={(e) => e.stopPropagation()}>
            <SidebarContent account={account} onNavigate={() => setOpen(false)} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}

      <aside
        className={`sticky top-0 hidden h-dvh shrink-0 overflow-y-auto border-r border-line bg-surface transition-[width] duration-200 lg:block ${
          collapsed ? "w-[4.5rem]" : "w-72"
        }`}
      >
        {collapsed ? <SidebarRail account={account} /> : <SidebarContent account={account} />}
      </aside>
    </>
  );
}

// Icon only rail for the collapsed desktop sidebar.
function SidebarRail({ account }: { account: Account }) {
  const t = useT();
  const setCollapsed = usePrefs((s) => s.setSidebarCollapsed);
  const setCreditsOpen = useUiStore((s) => s.setCreditsOpen);
  const openSettings = useUiStore((s) => s.openSettings);
  const theme = usePrefs((s) => s.theme);
  const setTheme = usePrefs((s) => s.setTheme);
  const dark = theme === "dark";
  return (
    <div className="flex h-full flex-col items-center gap-2 px-2 py-4">
      <Link href="/studio" aria-label="Pollar" className="mb-2">
        <Mark size={30} />
      </Link>
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-foreground"
        aria-label={t("Expand sidebar")}
        title={t("Expand sidebar")}
      >
        <PanelLeftOpen size={18} />
      </button>
      <SidebarNav rail />
      <div className="mt-auto flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => setTheme(dark ? "light" : "dark")}
          aria-label={dark ? t("Light") : t("Dark")}
          title={dark ? t("Light") : t("Dark")}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-foreground"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button
          type="button"
          onClick={() => setCreditsOpen(true)}
          title={t("{n} credits", { n: account.credits })}
          aria-label={t("Add credits")}
          className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-card-accent text-white"
        >
          <Coins size={14} />
          <span className="text-[10px] font-semibold tabular-nums">{account.credits}</span>
        </button>
        <button
          type="button"
          onClick={() => openSettings("profile")}
          title={account.email}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent"
        >
          {account.email.charAt(0).toUpperCase()}
        </button>
      </div>
    </div>
  );
}

function SidebarContent({ account, onNavigate, onClose }: { account: Account; onNavigate?: () => void; onClose?: () => void }) {
  const router = useRouter();
  const t = useT();
  const logout = useStudioStore((s) => s.logout);
  const setCreditsOpen = useUiStore((s) => s.setCreditsOpen);
  const setCollapsed = usePrefs((s) => s.setSidebarCollapsed);
  const openSettings = useUiStore((s) => s.openSettings);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const plan = planById(account.plan);
  const total = STARTING_CREDITS + (account.topUps ?? 0);
  const pct = Math.max(0, Math.min(100, (account.credits / total) * 100));
  const low = pct < 15;

  return (
    <div className="flex min-h-full flex-col p-4">
      <div className="mb-6 flex items-center justify-between gap-2 px-2 pt-1">
        <Link href="/studio" onClick={onNavigate} className="shrink-0">
          <Logo size="md" />
        </Link>
        <div className="flex shrink-0 items-center gap-1.5">
          {onClose ? (
            <button type="button" onClick={onClose} className="rounded-md p-1 text-muted" aria-label={t("Close menu")}>
              <X size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-background text-muted hover:border-accent hover:text-foreground"
              aria-label={t("Collapse sidebar")}
              title={t("Collapse sidebar")}
            >
              <PanelLeftClose size={15} />
            </button>
          )}
        </div>
      </div>

      <SidebarNav onNavigate={onNavigate} />

      <div className="mt-auto flex flex-col gap-3 pt-6">
        {/* Account and the one next step, in a single card. Credits live in the account menu, not on every screen. */}
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <AccountMenu account={account} onNavigate={onNavigate} onLogout={() => setConfirmLogout(true)} />
          <button
            type="button"
            onClick={() => {
              if (low || plan.id === "pro") setCreditsOpen(true);
              else openSettings("plan");
              onNavigate?.();
            }}
            className={`flex w-full items-center gap-2 border-t border-line px-3.5 py-2.5 text-left text-sm font-medium transition-colors hover:bg-background ${
              low ? "text-warn" : "text-accent"
            }`}
          >
            {low ? <Coins size={15} /> : plan.id === "pro" ? <Coins size={15} /> : <Sparkles size={15} />}
            <span className="flex-1">{low ? t("Low on credits") : plan.id === "pro" ? t("Buy credits") : t("Upgrade plan")}</span>
            {low && <span className="text-xs">{t("Buy")}</span>}
          </button>
        </div>
      </div>

      <Modal open={confirmLogout} title={t("Log out of Studio?")} onClose={() => setConfirmLogout(false)}>
        <p className="text-sm text-muted">{t("Your apps and credits stay as they are. Sign in again with the same email to pick up where you left off.")}</p>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmLogout(false)}>
            {t("Stay")}
          </Button>
          <Button
            variant="ink"
            className="flex-1"
            onClick={() => {
              setConfirmLogout(false);
              logout();
              router.replace("/");
            }}
          >
            {t("Log out")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// Account menu like a desktop app: who you are, where to manage it, and log out.
function AccountMenu({ account, onNavigate, onLogout }: { account: Account; onNavigate?: () => void; onLogout: () => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  // Where the menu sits: it is portaled above a dimmed page, anchored to the account button.
  const [anchor, setAnchor] = useState<{ left: number; bottom: number; width: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const plan = planById(account.plan);
  const name = account.name?.trim() || account.email.split("@")[0];

  const toggle = () => {
    if (open) return setOpen(false);
    const r = ref.current?.getBoundingClientRect();
    if (r) setAnchor({ left: r.left, bottom: window.innerHeight - r.top + 8, width: r.width });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onResize = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const openSettings = useUiStore((s) => s.openSettings);
  const setCreditsOpen = useUiStore((s) => s.setCreditsOpen);
  const total = STARTING_CREDITS + (account.topUps ?? 0);
  const pct = Math.max(0, Math.min(100, (account.credits / total) * 100));
  // Three things, nothing repeated: upgrading lives in the card under the menu.
  const items: Array<{ key: string; label: string; Icon: typeof UserRound; section?: SettingsSection; action?: () => void }> = [
    { key: "settings", label: "Settings", Icon: Settings, section: "profile" },
    { key: "billing", label: "Billing and invoices", Icon: Receipt, section: "billing" },
    { key: "credits", label: "Buy credits", Icon: Coins, action: () => setCreditsOpen(true) },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-background ${open ? "bg-background" : ""}`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
          {name.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-foreground">{name}</span>
          <span className="block truncate text-xs text-muted">{t("{plan} plan", { plan: t(plan.name) })}</span>
        </span>
        <ChevronsUpDown size={16} className="shrink-0 text-muted" />
      </button>

      {open &&
        anchor &&
        createPortal(
          <>
            {/* Dim the page so it is obvious the menu is open. Clicking it closes the menu. */}
            <div className="modal-overlay-in fixed inset-0 z-40 bg-black/30" aria-hidden />
            <div
              ref={menuRef}
              role="menu"
              style={{ left: anchor.left, bottom: anchor.bottom, width: Math.max(anchor.width, 240) }}
              className="rise fixed z-50 rounded-xl border border-line bg-surface p-1.5 shadow-2xl"
            >
          {/* Who you are and what is left. Flat, no boxes inside the menu. */}
          <div className="px-2.5 pb-2.5 pt-2">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-muted">{account.email}</p>
            <div className="mt-3 flex items-baseline justify-between gap-2 text-xs">
              <span className="text-muted">{t("Credits")}</span>
              <span className="font-mono tabular-nums">
                {account.credits}
                <span className="text-muted">/{total}</span>
              </span>
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-line">
              <div className={`h-full rounded-full ${pct < 15 ? "bg-amber-400" : "bg-accent"}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="my-1 h-px bg-line" />
          {items.map(({ key, section, label, Icon, action }) => (
            <button
              key={key}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
                if (action) action();
                else if (section) openSettings(section);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors duration-150 hover:bg-background"
            >
              <Icon size={16} className="shrink-0 text-muted" /> <span className="truncate">{t(label)}</span>
            </button>
          ))}
          <div className="my-1 h-px bg-line" />
          <div className="flex items-center justify-between gap-2 px-2.5 py-1.5">
            <span className="whitespace-nowrap text-xs text-muted">{t("Preferences")}</span>
            <PreferencesRow compact direction="up" menuWidth="w-44" />
          </div>
          <div className="my-1 h-px bg-line" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-muted transition-colors duration-150 hover:bg-danger-soft hover:text-danger"
          >
            <LogOut size={16} /> {t("Log out")}
          </button>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

// Theme toggle and language. Shared by the sidebar and the login page.
export function PreferencesRow({ compact, direction = "down", menuWidth }: { compact?: boolean; direction?: "up" | "down"; menuWidth?: string }) {
  const t = useT();
  const theme = usePrefs((s) => s.theme);
  const lang = usePrefs((s) => s.lang);
  const setTheme = usePrefs((s) => s.setTheme);
  const setLang = usePrefs((s) => s.setLang);
  const dark = theme === "dark";

  return (
    <div className="flex items-center gap-1.5">
      <Dropdown<Lang>
        label={lang.toUpperCase()}
        icon={<Languages size={14} />}
        value={lang}
        onChange={setLang}
        direction={direction}
        align="right"
        menuWidth={menuWidth}
        items={(Object.keys(LANG_LABELS) as Lang[]).map((l) => ({ value: l, label: LANG_LABELS[l] }))}
      />
      <button
        type="button"
        onClick={() => setTheme(dark ? "light" : "dark")}
        aria-label={dark ? t("Light") : t("Dark")}
        title={dark ? t("Light") : t("Dark")}
        className={`flex h-8 w-8 items-center justify-center rounded-full border border-line bg-background text-muted hover:border-accent hover:text-foreground ${compact ? "" : ""}`}
      >
        {dark ? <Sun size={15} /> : <Moon size={15} />}
      </button>
    </div>
  );
}

// Counts down smoothly when credits are spent.
export function AnimatedCredits({ credits, compact }: { credits: number; compact?: boolean }) {
  const t = useT();
  const [shown, setShown] = useState(credits);
  const [flash, setFlash] = useState(false);
  const previous = useRef(credits);

  useEffect(() => {
    const from = previous.current;
    const to = credits;
    previous.current = credits;
    if (from === to) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 500);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(from + (to - from) * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    let flashTimer = 0;
    if (to < from) {
      setFlash(true);
      flashTimer = window.setTimeout(() => setFlash(false), 600);
    }
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(flashTimer);
    };
  }, [credits]);

  if (compact) {
    return (
      <span
        className={`ml-auto inline-flex items-center gap-1.5 rounded-full border border-line bg-background px-2.5 py-1 text-xs font-medium tabular-nums ${flash ? "text-danger" : ""}`}
      >
        <Coins size={14} className="text-accent" />
        {t("{n} credits", { n: shown })}
      </span>
    );
  }
  return <span className={flash ? "text-amber-200" : ""}>{shown}</span>;
}
