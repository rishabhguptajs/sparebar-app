import Link from "next/link";

type Item = { href: string; label: string };

/** The page links on phones, as a dropdown that works without JavaScript. */
export function MobileMenu({ items }: { items: Item[] }) {
  return (
    <details className="group relative md:hidden">
      <summary
        aria-label="Menu"
        className="grid size-10 cursor-pointer list-none place-items-center rounded-full text-ink-2 hover:text-ink [&::-webkit-details-marker]:hidden"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
          <path className="group-open:hidden" d="M4 7h16M4 12h16M4 17h16" />
          <path className="hidden group-open:block" d="M6 6l12 12M18 6L6 18" />
        </svg>
      </summary>
      <nav aria-label="Menu" className="absolute right-0 top-full z-40 mt-2 w-56 rounded-2xl border border-line bg-bg p-2 text-[15px] shadow-[0_20px_60px_-16px_rgba(20,20,60,0.3)]">
        {items.map((i) =>
          i.href.startsWith("#") ? (
            <a key={i.href} href={i.href} className="block rounded-xl px-3 py-2.5 text-ink hover:bg-panel">
              {i.label}
            </a>
          ) : (
            <Link key={i.href} href={i.href} className="block rounded-xl px-3 py-2.5 text-ink hover:bg-panel">
              {i.label}
            </Link>
          ),
        )}
      </nav>
    </details>
  );
}
