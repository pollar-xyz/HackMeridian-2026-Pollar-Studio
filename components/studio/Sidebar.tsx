"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent as SidebarBody,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import {
  ChevronsUpDown,
  Home,
  Languages,
  LayoutGrid,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Store,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { useStudioStore } from "@/lib/mock/store";
import { useUiStore, type SettingsSection } from "@/lib/mock/ui-store";
import { usePrefs, type Lang } from "@/lib/prefs";
import { useT, LANG_LABELS } from "@/lib/i18n";
import type { Account } from "@/lib/mock/types";
import { Logo, Mark } from "@/components/Logo";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { RecentChats } from "@/components/studio/RecentChats";
import { signOut } from "@/lib/auth/session";

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

function NavLinks({
  pathname,
  onNavigate,
  rail,
}: {
  pathname: string | null;
  onNavigate?: () => void;
  rail?: boolean;
}) {
  const t = useT();
  return (
    <nav aria-label={t("Open menu")}>
      <SidebarMenu>
        {NAV.map(({ href, label, Icon }) => (
          <SidebarMenuItem key={href}>
            <SidebarMenuButton
              asChild
              isActive={isActive(pathname, href)}
              tooltip={t(label)}
              className={
                rail ? "mx-auto !size-10 !p-2.5" : "h-auto gap-3 px-3 py-2.5"
              }
            >
              <Link
                href={href}
                onClick={onNavigate}
                aria-label={t(label)}
                aria-current={isActive(pathname, href) ? "page" : undefined}
              >
                <Icon size={18} aria-hidden />
                {!rail && <span>{t(label)}</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
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
  const t = useT();
  const { state, isMobile, setOpenMobile } = useSidebar();
  return (
    <>
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface px-4 py-3 lg:hidden">
        <SidebarTrigger aria-label={t("Open menu")} />
        <Link href="/studio">
          <Logo size="sm" />
        </Link>
      </div>
      <SidebarPrimitive collapsible="icon" className="border-line">
        {state === "collapsed" && !isMobile ? (
          <SidebarRail account={account} />
        ) : (
          <SidebarContent
            account={account}
            onNavigate={isMobile ? () => setOpenMobile(false) : undefined}
            onClose={isMobile ? () => setOpenMobile(false) : undefined}
          />
        )}
      </SidebarPrimitive>
    </>
  );
}

// Icon only rail for the collapsed desktop sidebar.
function SidebarRail({ account }: { account: Account }) {
  const t = useT();
  const setCollapsed = usePrefs((s) => s.setSidebarCollapsed);
  const openSettings = useUiStore((s) => s.openSettings);
  const theme = usePrefs((s) => s.theme);
  const setTheme = usePrefs((s) => s.setTheme);
  const dark = theme === "dark";
  return (
    <div className="flex h-full flex-col items-center gap-2 px-2 py-4">
      <Link href="/studio" aria-label="Pollar" className="mb-2">
        <Mark size={30} />
      </Link>
      <Button
        variant="unstyled"
        type="button"
        onClick={() => setCollapsed(false)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-foreground"
        aria-label={t("Expand sidebar")}
        title={t("Expand sidebar")}
      >
        <PanelLeftOpen size={18} />
      </Button>
      <SidebarNav rail />
      <div className="mt-auto flex flex-col items-center gap-2">
        <Button
          variant="unstyled"
          type="button"
          onClick={() => setTheme(dark ? "light" : "dark")}
          aria-label={dark ? t("Light") : t("Dark")}
          title={dark ? t("Light") : t("Dark")}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-foreground"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </Button>
        <Button
          variant="unstyled"
          type="button"
          onClick={() => openSettings("profile")}
          aria-label={t("Settings")}
          title={account.email}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent"
        >
          {account.email.charAt(0).toUpperCase()}
        </Button>
      </div>
    </div>
  );
}

function SidebarContent({
  account,
  onNavigate,
  onClose,
}: {
  account: Account;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const t = useT();
  const logout = useStudioStore((s) => s.logout);
  const setCollapsed = usePrefs((s) => s.setSidebarCollapsed);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const accountTrigger = useRef<HTMLButtonElement>(null);

  return (
    <div className="flex h-full min-h-0 flex-col p-4">
      <SidebarHeader className="mb-6 flex-row items-center justify-between gap-2 px-2 pt-1">
        <Link href="/studio" onClick={onNavigate} className="shrink-0">
          <Logo size="md" />
        </Link>
        <div className="flex shrink-0 items-center gap-1.5">
          {onClose ? (
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-muted"
              aria-label={t("Close menu")}
            >
              <X size={18} />
            </Button>
          ) : (
            <Button
              variant="unstyled"
              type="button"
              onClick={() => setCollapsed(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-background text-muted hover:border-accent hover:text-foreground"
              aria-label={t("Collapse sidebar")}
              title={t("Collapse sidebar")}
            >
              <PanelLeftClose size={15} />
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarBody>
        <SidebarNav onNavigate={onNavigate} />
        <RecentChats onNavigate={onNavigate} />
      </SidebarBody>

      <SidebarFooter className="mt-auto gap-3 p-0 pt-6">
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <AccountMenu
            triggerRef={accountTrigger}
            account={account}
            onNavigate={onNavigate}
            onLogout={() => setConfirmLogout(true)}
          />
        </div>
      </SidebarFooter>

      <AlertDialog open={confirmLogout} onOpenChange={setConfirmLogout}>
        <AlertDialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            accountTrigger.current?.focus();
          }}
        >
          <AlertDialogTitle>{t("Log out of Studio?")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              "Your apps and credits stay as they are. Sign in again with the same email to pick up where you left off.",
            )}
          </AlertDialogDescription>
          <div className="mt-4 flex gap-2">
            <AlertDialogCancel asChild>
              <Button variant="secondary" className="flex-1">
                {t("Stay")}
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="ink"
                className="flex-1"
                onClick={() => {
                  setConfirmLogout(false);
                  logout();
                  signOut();
                }}
              >
                {t("Log out")}
              </Button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Account menu like a desktop app: who you are, where to manage it, and log out.
function AccountMenu({
  triggerRef,
  account,
  onNavigate,
  onLogout,
}: {
  account: Account;
  onNavigate?: () => void;
  onLogout: () => void;
  triggerRef: React.Ref<HTMLButtonElement>;
}) {
  const t = useT();
  const lang = usePrefs((s) => s.lang);
  const setLang = usePrefs((s) => s.setLang);
  const theme = usePrefs((s) => s.theme);
  const setTheme = usePrefs((s) => s.setTheme);
  const [open, setOpen] = useState(false);
  const name = account.name?.trim() || account.email.split("@")[0];

  const openSettings = useUiStore((s) => s.openSettings);
  const items: Array<{
    key: string;
    label: string;
    Icon: typeof UserRound;
    section?: SettingsSection;
    action?: () => void;
  }> = [
    { key: "settings", label: "Settings", Icon: Settings, section: "profile" },
  ];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          ref={triggerRef}
          variant="unstyled"
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-background ${open ? "bg-background" : ""}`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
            {name.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-foreground">
              {name}
            </span>
            <span className="block truncate text-xs text-muted">
              {account.email}
            </span>
          </span>
          <ChevronsUpDown size={16} className="shrink-0 text-muted" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent
          side="top"
          align="start"
          sideOffset={8}
          collisionPadding={8}
          aria-label={name}
          className="z-50 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-surface p-1.5 text-foreground shadow-xl"
        >
          <div className="px-2.5 pb-2.5 pt-2">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-muted">{account.email}</p>
          </div>
          <div className="my-1 h-px bg-line" />
          {items.map(({ key, section, label, Icon, action }) => (
            <DropdownMenuItem
              key={key}
              onSelect={() => {
                setOpen(false);
                onNavigate?.();
                if (action) action();
                else if (section) openSettings(section);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors duration-150 outline-none data-[highlighted]:bg-background hover:bg-background"
            >
              <Icon size={16} className="shrink-0 text-muted" />{" "}
              <span className="truncate">{t(label)}</span>
            </DropdownMenuItem>
          ))}
          <div className="my-1 h-px bg-line" />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              {t("Preferences")}
              <span aria-hidden>›</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                aria-label={t("Preferences")}
                value={theme}
                onValueChange={(value) => setTheme(value as "light" | "dark")}
              >
                <DropdownMenuRadioItem value="light">
                  {t("Light")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">
                  {t("Dark")}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                aria-label={t("Language")}
                value={lang}
                onValueChange={(value) => setLang(value as Lang)}
              >
                {(Object.keys(LANG_LABELS) as Lang[]).map((language) => (
                  <DropdownMenuRadioItem key={language} value={language}>
                    {LANG_LABELS[language]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-muted transition-colors duration-150 hover:bg-danger-soft hover:text-danger"
          >
            <LogOut size={16} /> {t("Log out")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}

// Theme toggle and language. Shared by the sidebar and the login page.
export function PreferencesRow({
  compact,
  direction = "down",
  menuWidth,
}: {
  compact?: boolean;
  direction?: "up" | "down";
  menuWidth?: string;
}) {
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
        items={(Object.keys(LANG_LABELS) as Lang[]).map((l) => ({
          value: l,
          label: LANG_LABELS[l],
        }))}
      />
      <Button
        variant="unstyled"
        type="button"
        onClick={() => setTheme(dark ? "light" : "dark")}
        aria-label={dark ? t("Light") : t("Dark")}
        title={dark ? t("Light") : t("Dark")}
        className={`flex h-8 w-8 items-center justify-center rounded-full border border-line bg-background text-muted hover:border-accent hover:text-foreground ${compact ? "" : ""}`}
      >
        {dark ? <Sun size={15} /> : <Moon size={15} />}
      </Button>
    </div>
  );
}
