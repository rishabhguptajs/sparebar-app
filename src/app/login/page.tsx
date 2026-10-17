"use client";

import { useState } from "react";
import { brand } from "@/config/brand";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const next = new URLSearchParams(window.location.search).get("next") ?? "/app";
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setState(error ? "error" : "sent");
  }

  return (
    <main className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in to {brand.name}</h1>
        {state === "sent" ? (
          <p className="mt-4 text-sm opacity-80">Check {email} for a sign-in link.</p>
        ) : (
          <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-lg border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
            />
            <button
              disabled={state === "sending"}
              className="rounded-lg bg-foreground text-background px-3 py-2 font-medium disabled:opacity-60"
            >
              {state === "sending" ? "Sending link" : "Email me a link"}
            </button>
            {state === "error" && <p className="text-sm text-red-600">That did not work. Try again in a minute.</p>}
          </form>
        )}
      </div>
    </main>
  );
}
