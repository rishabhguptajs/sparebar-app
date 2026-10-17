"use client";

import { useEffect, useState } from "react";
import { brand } from "@/config/brand";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [codeState, setCodeState] = useState<"idle" | "checking" | "error">("idle");
  const [linkFailed, setLinkFailed] = useState(false);

  useEffect(() => {
    setLinkFailed(new URLSearchParams(window.location.search).get("error") === "link");
  }, []);

  const next = () => new URLSearchParams(window.location.search).get("next") ?? "/app";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setLinkFailed(false);
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next())}` },
    });
    setState(error ? "error" : "sent");
  }

  // The code works from any device, unlike the link, which must open in the browser that asked for it.
  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setCodeState("checking");
    const { error } = await createClient().auth.verifyOtp({ email, token: code.trim(), type: "email" });
    if (error) return setCodeState("error");
    window.location.assign(`/auth/callback?session=1&next=${encodeURIComponent(next())}`);
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Sign in to {brand.name}</h1>

        {linkFailed && (
          <p role="alert" className="mt-4 rounded-xl border border-danger/40 px-4 py-3 text-sm text-danger">
            That link could not be used here. Request a new one and open it in the same browser, or enter the code from the email.
          </p>
        )}

        {state === "sent" ? (
          <div className="mt-6 space-y-6">
            <p className="text-sm text-ink-2">We sent an email to {email}. Open the link in it, or enter the code below.</p>
            <form onSubmit={verify} className="flex flex-col gap-3">
              <label htmlFor="code" className="text-sm font-medium">
                Code from the email
              </label>
              <input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6,8}"
                maxLength={8}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="rounded-xl border border-line bg-panel px-4 py-3 text-lg tracking-[0.3em] tabular-nums"
              />
              <button
                disabled={codeState === "checking" || code.length < 6}
                className="rounded-xl bg-accent px-4 py-3 font-semibold text-accent-ink disabled:opacity-40"
              >
                {codeState === "checking" ? "Checking" : "Sign in"}
              </button>
              {codeState === "error" && <p role="alert" className="text-sm text-danger">That code did not work. Check it or request a new one.</p>}
            </form>
            <button
              onClick={() => {
                setState("idle");
                setCode("");
                setCodeState("idle");
              }}
              className="text-sm text-ink-2 underline hover:text-ink"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-xl border border-line bg-panel px-4 py-3"
            />
            <button disabled={state === "sending"} className="rounded-xl bg-accent px-4 py-3 font-semibold text-accent-ink disabled:opacity-60">
              {state === "sending" ? "Sending" : "Email me a sign-in link"}
            </button>
            {state === "error" && <p role="alert" className="text-sm text-danger">That did not work. Try again in a minute.</p>}
          </form>
        )}
      </div>
    </main>
  );
}
