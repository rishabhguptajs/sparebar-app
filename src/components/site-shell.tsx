import Link from "next/link";
import { brand } from "@/config/brand";

/** Header and footer for the public content pages. The footer links every section so crawlers reach each one. */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6">
        <Link href="/" className="text-[17px] font-semibold tracking-[-0.03em]">
          {brand.name}
        </Link>
        <nav
          aria-label="Main"
          className="flex items-center gap-1 text-sm text-ink-2 sm:gap-2"
        >
          <Link href="/models" className="px-3 py-2 hover:text-ink">
            Models
          </Link>
          <Link href="/pricing" className="px-3 py-2 hover:text-ink">
            Pricing
          </Link>
          <Link href="/login" className="btn-ghost px-4 py-2 text-ink">
            Sign in
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-5 pb-20">{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto grid max-w-5xl gap-8 px-5 py-10 text-sm text-ink-2 sm:grid-cols-3">
          <nav aria-label="Product" className="flex flex-col gap-2">
            <p className="font-medium text-ink">Product</p>
            <Link href="/models" className="hover:text-ink">
              AI models
            </Link>
            <Link href="/pricing" className="hover:text-ink">
              Pricing
            </Link>
            <Link href="/about" className="hover:text-ink">
              About Sparebar
            </Link>
          </nav>
          <nav aria-label="Guides" className="flex flex-col gap-2">
            <p className="font-medium text-ink">Guides</p>
            <Link href="/ai-ugc-generator" className="hover:text-ink">
              AI UGC generator
            </Link>
            <Link href="/ai-influencer-generator" className="hover:text-ink">
              AI influencer generator
            </Link>
            <Link href="/consistent-character-ai" className="hover:text-ink">
              Consistent character AI
            </Link>
          </nav>
          <nav aria-label="Legal" className="flex flex-col gap-2">
            <p className="font-medium text-ink">Company</p>
            <Link href="/terms" className="hover:text-ink">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-ink">
              Privacy
            </Link>
            <Link href="/refunds" className="hover:text-ink">
              Refunds
            </Link>
            <a href={`mailto:${brand.supportEmail}`} className="hover:text-ink">
              {brand.supportEmail}
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export function Crumbs({
  trail,
}: {
  trail: { name: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="pt-2 text-sm text-ink-2">
      {trail.map((t, i) => (
        <span key={t.name}>
          {i > 0 && <span aria-hidden="true"> / </span>}
          {t.href ? (
            <Link href={t.href} className="hover:text-ink">
              {t.name}
            </Link>
          ) : (
            <span>{t.name}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
