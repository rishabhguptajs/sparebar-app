import Link from "next/link";
import { brand } from "@/config/brand";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-6">
        <Link href="/" className="font-display text-2xl font-semibold tracking-tight">
          {brand.name}
        </Link>
        <Link href="/app" className="text-sm font-medium text-accent hover:underline">
          Open the app
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-16">{children}</main>
      <footer className="border-t border-line">
        <nav aria-label="Legal" className="mx-auto flex max-w-3xl flex-wrap gap-x-6 gap-y-2 px-5 py-6 text-sm text-ink-2">
          <Link href="/terms" className="hover:text-ink">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
          <Link href="/refunds" className="hover:text-ink">
            Refunds
          </Link>
          <a href={brand.company.site} className="hover:text-ink">
            {brand.company.legalName}
          </a>
          <a href={`mailto:${brand.supportEmail}`} className="hover:text-ink">
            {brand.supportEmail}
          </a>
        </nav>
      </footer>
    </div>
  );
}
