import Link from "next/link";

/** Switch between the lists that feed a post: who is in it and what they hold. */
export function PeopleTabs({ base, current }: { base: string; current: "characters" | "products" }) {
  const tabs = [
    { key: "characters", label: "Characters", href: `${base}/characters` },
    { key: "products", label: "Products", href: `${base}/products` },
  ] as const;
  return (
    <div className="mb-6 flex gap-1.5" role="tablist" aria-label="Characters and products">
      {tabs.map((t) => (
        <Link key={t.key} href={t.href} role="tab" aria-selected={current === t.key} className={`rounded-full border px-4 py-1.5 text-sm ${current === t.key ? "border-accent text-ink" : "border-line text-ink-2 hover:text-ink"}`}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}
