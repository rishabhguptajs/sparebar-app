"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { brand } from "@/config/brand";
import { CoinIcon, GridIcon, PeopleIcon, ShieldIcon, SignOutIcon, StudioIcon } from "@/components/icons";

type Props = {
  base: string;
  balance: number;
  email: string | null;
  canSignOut: boolean;
  isAdmin?: boolean;
  children: React.ReactNode;
};

export function AppShell({ base, balance, email, canSignOut, isAdmin, children }: Props) {
  const path = usePathname();
  const nav = [
    { href: base, label: "Studio", icon: StudioIcon, active: path === base },
    { href: `${base}/characters`, label: "Characters", icon: PeopleIcon, active: path.startsWith(`${base}/characters`) },
    { href: `${base}/library`, label: "Library", icon: GridIcon, active: path.startsWith(`${base}/library`) },
    { href: `${base}/credits`, label: "Credits", icon: CoinIcon, active: path.startsWith(`${base}/credits`) },
    ...(isAdmin ? [{ href: `${base}/admin`, label: "Admin", icon: ShieldIcon, active: path.startsWith(`${base}/admin`) }] : []),
  ];

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line px-4 py-6 md:flex">
        <Link href={base} className="px-2 font-display text-2xl font-semibold tracking-tight">
          {brand.name}
        </Link>

        <nav className="mt-9 flex flex-col gap-1" aria-label="Main">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={n.active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                n.active ? "bg-panel text-ink shadow-[0_1px_0_var(--line)]" : "text-ink-2 hover:bg-panel/60 hover:text-ink"
              }`}
            >
              <n.icon className={n.active ? "text-accent" : ""} />
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-4">
          <Link href={`${base}/credits`} className="block rounded-2xl bg-panel p-4 transition-colors hover:bg-panel-2">
            <p className="text-xs text-ink-2">Credits</p>
            <p className="mt-1 font-display text-4xl font-semibold leading-none tabular-nums">{balance}</p>
            <p className="mt-2 text-xs font-medium text-accent">Add credits</p>
          </Link>
          <div className="flex items-center justify-between gap-2 px-1">
            <p className="min-w-0 truncate text-xs text-ink-2" title={email ?? undefined}>
              {email ?? "Signed in"}
            </p>
            {canSignOut && (
              <form action="/auth/signout" method="post">
                <button
                  className="rounded-lg p-2 text-ink-2 transition-colors hover:bg-panel hover:text-ink"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <SignOutIcon />
                </button>
              </form>
            )}
          </div>
        </div>
      </aside>

      <div className="min-w-0 pb-20 md:pb-0">
        <header className="flex h-14 items-center justify-between border-b border-line px-4 md:hidden">
          <Link href={base} className="font-display text-xl font-semibold tracking-tight">
            {brand.name}
          </Link>
          <Link href={`${base}/credits`} className="rounded-full bg-panel px-3 py-1 text-sm font-medium tabular-nums">{balance} credits</Link>
        </header>
        <main>{children}</main>
      </div>

      <nav
        aria-label="Main"
        style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}
        className="fixed inset-x-0 bottom-0 z-20 grid border-t border-line bg-bg/90 backdrop-blur md:hidden"
      >
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            aria-current={n.active ? "page" : undefined}
            className={`flex flex-col items-center gap-1 py-2.5 text-xs font-medium ${n.active ? "text-ink" : "text-ink-2"}`}
          >
            <n.icon className={n.active ? "text-accent" : ""} />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
