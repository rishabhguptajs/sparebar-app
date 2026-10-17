import Link from "next/link";
import { brand } from "@/config/brand";

// Placeholder until the landing page (build step 7).
export default function Home() {
  return (
    <main className="min-h-screen grid place-items-center px-4">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">{brand.name}</h1>
        <p className="mt-3 opacity-70">Create AI characters and generate UGC style images and videos with them.</p>
        <Link href="/app" className="mt-6 inline-block rounded-lg bg-foreground text-background px-4 py-2 font-medium">
          Open the app
        </Link>
      </div>
    </main>
  );
}
