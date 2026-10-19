"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { brand } from "@/config/brand";
import { ThemeToggle, useAppTheme } from "@/components/theme";
import { useMe } from "@/lib/queries";
import {
  CloseIcon,
  CoinIcon,
  GridIcon,
  ImageIcon,
  PeopleIcon,
  SettingsIcon,
  WandIcon,
  ShieldIcon,
  SignOutIcon,
  StudioIcon,
  MoreIcon,
} from "@/components/icons";

type Props = {
  base: string;
  /** Preview only. In the real app the balance comes from the cache. */
  balance?: number;
  email: string | null;
  canSignOut: boolean;
  isAdmin?: boolean;
  children: React.ReactNode;
};

export function AppShell({
  base,
  balance: balanceProp = 0,
  email,
  canSignOut,
  isAdmin: adminProp,
  children,
}: Props) {
  const me = useMe(!canSignOut);
  const balance = canSignOut ? (me.data?.balance ?? 0) : balanceProp;
  const isAdmin = canSignOut ? !!me.data?.isAdmin : adminProp;
  const path = usePathname();
  const { theme, toggle } = useAppTheme();
  const [more, setMore] = useState(false);
  // The sheet closes whenever you move to another page.
  useEffect(() => setMore(false), [path]);
  const nav = [
    { href: base, label: "Studio", icon: StudioIcon, active: path === base },
    {
      href: `${base}/create`,
      label: "Create",
      icon: WandIcon,
      active: path.startsWith(`${base}/create`),
    },
    {
      href: `${base}/ads`,
      label: "Ads",
      icon: ImageIcon,
      active: path.startsWith(`${base}/ads`),
    },
    {
      href: `${base}/characters`,
      label: "Characters",
      icon: PeopleIcon,
      active: path.startsWith(`${base}/characters`),
    },
    {
      href: `${base}/library`,
      label: "Library",
      icon: GridIcon,
      active: path.startsWith(`${base}/library`),
    },
    {
      href: `${base}/credits`,
      label: "Credits",
      icon: CoinIcon,
      active: path.startsWith(`${base}/credits`),
    },
    {
      href: `${base}/settings`,
      label: "Settings",
      icon: SettingsIcon,
      active: path.startsWith(`${base}/settings`),
    },
    ...(isAdmin
      ? [
          {
            href: `${base}/admin`,
            label: "Admin",
            icon: ShieldIcon,
            active: path.startsWith(`${base}/admin`),
          },
        ]
      : []),
  ];

  // Library is the last of the everyday places. Credits, settings and admin go in the More sheet on phones.
  const primary = nav.slice(0, 5);
  const secondary = nav.slice(5);

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line px-4 py-6 md:flex">
        <Link
          href={base}
          className="px-2 font-display text-2xl font-semibold tracking-tight"
        >
          {brand.name}
        </Link>

        <nav className="mt-9 flex flex-col gap-1" aria-label="Main">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={n.active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                n.active
                  ? "bg-panel text-ink shadow-[0_1px_0_var(--line)]"
                  : "text-ink-2 hover:bg-panel/60 hover:text-ink"
              }`}
            >
              <n.icon className={n.active ? "text-accent" : ""} />
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-4">
          <Link
            href={`${base}/credits`}
            className="block rounded-2xl bg-panel p-4 transition-colors hover:bg-panel-2"
          >
            <p className="text-xs text-ink-2">Credits</p>
            <p className="mt-1 font-display text-4xl font-semibold leading-none tabular-nums">
              {balance}
            </p>
            <p className="mt-2 text-xs font-medium text-accent">Add credits</p>
          </Link>
          <div className="flex items-center justify-between gap-2 px-1">
            <p
              className="min-w-0 truncate text-xs text-ink-2"
              title={email ?? undefined}
            >
              {email ?? "Signed in"}
            </p>
            {canSignOut && (
              <div className="flex items-center">
                <ThemeToggle theme={theme} onToggle={toggle} />
                <form action="/auth/signout" method="post">
                  <button
                    className="rounded-lg p-2 text-ink-2 transition-colors hover:bg-panel hover:text-ink"
                    aria-label="Sign out"
                    title="Sign out"
                  >
                    <SignOutIcon />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="min-w-0 pb-20 md:pb-0">
        <header className="flex h-14 items-center justify-between border-b border-line px-4 md:hidden">
          <Link
            href={base}
            className="font-display text-xl font-semibold tracking-tight"
          >
            {brand.name}
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href={`${base}/credits`}
              className="rounded-full bg-panel px-3 py-1 text-sm font-medium tabular-nums"
            >
              {balance} credits
            </Link>
            <ThemeToggle theme={theme} onToggle={toggle} />
          </div>
        </header>
        <main>{children}</main>
      </div>

      {/* Phone navigation: the five everyday places, then a sheet for the rest. */}
      {more && (
        <>
          <button type="button" aria-label="Close menu" onClick={() => setMore(false)} className="fixed inset-0 z-20 bg-black/30 md:hidden" />
          <div role="menu" aria-label="More" className="fixed inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 rounded-3xl border border-line bg-bg p-2 shadow-[0_20px_60px_-16px_rgba(20,20,60,0.35)] md:hidden">
            <div className="flex items-center justify-between px-3 pb-1 pt-2">
              <p className="min-w-0 truncate text-xs text-ink-2">{email ?? "Signed in"}</p>
              <button type="button" onClick={() => setMore(false)} aria-label="Close" className="rounded-lg p-1.5 text-ink-2">
                <CloseIcon />
              </button>
            </div>
            {secondary.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                role="menuitem"
                aria-current={n.active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-[15px] font-medium ${n.active ? "bg-panel text-ink" : "text-ink-2"}`}
              >
                <n.icon className={n.active ? "text-accent" : ""} />
                {n.label}
              </Link>
            ))}
            {canSignOut && (
              <form action="/auth/signout" method="post">
                <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-[15px] font-medium text-ink-2">
                  <SignOutIcon />
                  Sign out
                </button>
              </form>
            )}
          </div>
        </>
      )}

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {primary.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            aria-current={n.active ? "page" : undefined}
            className={`flex min-w-0 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${n.active ? "text-ink" : "text-ink-2"}`}
          >
            <n.icon className={n.active ? "text-accent" : ""} />
            <span className="max-w-full truncate">{n.label}</span>
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setMore((m) => !m)}
          aria-expanded={more}
          className={`flex min-w-0 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${more || secondary.some((n) => n.active) ? "text-ink" : "text-ink-2"}`}
        >
          <MoreIcon className={secondary.some((n) => n.active) ? "text-accent" : ""} />
          More
        </button>
      </nav>
    </div>
  );
}
