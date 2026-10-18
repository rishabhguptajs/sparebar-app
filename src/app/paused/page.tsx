import Link from "next/link";
import { brand } from "@/config/brand";

export const metadata = { title: `${brand.name} is paused` };

export default function Paused() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-6 text-center">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Sign in is paused
        </h1>
        <p className="mt-3 text-ink-2">
          We are finishing payment setup. Sign in and new accounts will be back
          soon.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
