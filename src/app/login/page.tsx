"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { brand } from "@/config/brand";
import { FREE_TIER } from "@/config/free-tier";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [codeState, setCodeState] = useState<"idle" | "checking" | "error">(
    "idle",
  );
  const [linkFailed, setLinkFailed] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  useEffect(() => {
    setLinkFailed(
      new URLSearchParams(window.location.search).get("error") === "link",
    );
  }, []);

  const next = () =>
    new URLSearchParams(window.location.search).get("next") ?? "/app";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setLinkFailed(false);
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next())}`,
      },
    });
    setState(error ? "error" : "sent");
  }

  async function google() {
    setGoogleBusy(true);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next())}`,
      },
    });
    if (error) {
      setGoogleBusy(false);
      setLinkFailed(true);
    }
  }

  // The code works from any device, unlike the link, which must open in the browser that asked for it.
  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setCodeState("checking");
    const { error } = await createClient().auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });
    if (error) return setCodeState("error");
    window.location.assign(
      `/auth/callback?session=1&next=${encodeURIComponent(next())}`,
    );
  }

  return (
    <main className="login-stage relative isolate grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      <p aria-hidden="true" className="login-mark pointer-events-none absolute inset-x-0 bottom-[-0.12em] -z-10 select-none text-center text-[clamp(6rem,27vw,26rem)] font-semibold leading-none tracking-[-0.07em]">
        {brand.name}
      </p>

      <Link href="/" className="absolute left-6 top-6 text-[17px] font-semibold tracking-[-0.03em] text-white sm:left-10 sm:top-8">
        {brand.name}
      </Link>

      <section className="landing w-full max-w-[26rem] rounded-[28px] bg-white p-7 shadow-[0_50px_100px_-30px_rgb(8_14_80/0.7)] sm:p-9" style={{ background: "#fff" }}>
      <div>
        <h1 className="text-4xl font-light leading-[1] tracking-[-0.05em] sm:text-5xl">
          Welcome to {brand.name}.
        </h1>
        <p className="mt-5 text-[17px] leading-relaxed text-ink-2">
          Sign in to start. New here? Signing in creates your account and gives you {FREE_TIER.credits} free credits.
        </p>

        {linkFailed && (
          <p role="alert" className="mt-6 rounded-2xl border border-danger/40 px-4 py-3 text-sm text-danger">
            That did not work. Request a new email link and open it in the same browser, enter the code from the email, or use Google.
          </p>
        )}

        {state === "sent" ? (
          <div className="mt-8 space-y-6">
            <p className="text-sm text-ink-2">
              We sent an email to <span className="text-ink">{email}</span>. Open the link in it, or enter the code below.
            </p>
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
                className="rounded-2xl border border-line bg-white px-5 py-3.5 text-lg tracking-[0.3em] tabular-nums outline-none transition-shadow focus:shadow-[0_0_0_4px_rgb(229_36_122/0.15)]"
              />
              <button disabled={codeState === "checking" || code.length < 6} className="btn px-5 py-3.5 disabled:opacity-40">
                {codeState === "checking" ? "Checking" : "Sign in"}
              </button>
              {codeState === "error" && (
                <p role="alert" className="text-sm text-danger">
                  That code did not work. Check it or request a new one.
                </p>
              )}
            </form>
            <button
              onClick={() => {
                setState("idle");
                setCode("");
                setCodeState("idle");
              }}
              className="text-sm text-ink-2 underline underline-offset-4 hover:text-ink"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <div className="mt-8">
            <button
              type="button"
              onClick={google}
              disabled={googleBusy}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-line bg-white px-4 py-3.5 font-medium shadow-[0_1px_2px_rgb(14_16_24/0.06)] transition-all hover:-translate-y-px hover:shadow-[0_10px_30px_-12px_rgb(14_16_24/0.25)] disabled:opacity-60"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.5 17.7 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
                <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
                <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
              </svg>
              {googleBusy ? "Opening Google" : "Continue with Google"}
            </button>

            <div className="my-6 flex items-center gap-4 text-xs text-ink-2">
              <span className="h-px flex-1 bg-line" />
              or use your email
              <span className="h-px flex-1 bg-line" />
            </div>

            <form onSubmit={submit} className="flex flex-col gap-3">
              <label htmlFor="email" className="sr-only">
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
                className="rounded-2xl border border-line bg-white px-5 py-3.5 outline-none transition-shadow focus:shadow-[0_0_0_4px_rgb(229_36_122/0.15)]"
              />
              <button disabled={state === "sending"} className="btn px-5 py-3.5 disabled:opacity-60">
                {state === "sending" ? "Sending" : "Email me a sign-in link"}
              </button>
              {state === "error" && (
                <p role="alert" className="text-sm text-danger">
                  That did not work. Try again in a minute.
                </p>
              )}
            </form>
          </div>
        )}
      </div>

        <p className="mt-8 text-xs leading-relaxed text-ink-2">
          By continuing you agree to the{" "}
          <Link href="/terms" className="underline underline-offset-4">
            terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            privacy policy
          </Link>
          .
        </p>
      </section>

      <p className="absolute bottom-6 left-6 hidden text-sm text-white/80 sm:block sm:left-10">
        Make a character once. Use it in every shot.
      </p>
    </main>
  );
}
