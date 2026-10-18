"use client";

import { useEffect, useState } from "react";
import { brand } from "@/config/brand";
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
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Sign in to {brand.name}
        </h1>

        {linkFailed && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-danger/40 px-4 py-3 text-sm text-danger"
          >
            That link could not be used here. Request a new one and open it in
            the same browser, or enter the code from the email.
          </p>
        )}

        {state === "sent" ? (
          <div className="mt-6 space-y-6">
            <p className="text-sm text-ink-2">
              We sent an email to {email}. Open the link in it, or enter the
              code below.
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
                className="rounded-xl border border-line bg-panel px-4 py-3 text-lg tracking-[0.3em] tabular-nums"
              />
              <button
                disabled={codeState === "checking" || code.length < 6}
                className="rounded-full bg-accent px-4 py-3 font-semibold text-accent-ink disabled:opacity-40"
              >
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
              className="text-sm text-ink-2 underline hover:text-ink"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <div className="mt-6">
              <button
                type="button"
                onClick={google}
                disabled={googleBusy}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-line bg-panel px-4 py-3 font-medium transition-colors hover:bg-panel-2 disabled:opacity-60"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.5 17.7 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.100 0 24s.9 7.600 2.600 10.800l7.900-6.100z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.500 0 11.900-2.100 15.900-5.800l-7.500-5.800c-2.100 1.400-4.800 2.300-8.400 2.300-6.300 0-11.600-4-13.500-9.800l-7.900 6.100C6.500 42.600 14.600 48 24 48z"
                  />
                </svg>
                {googleBusy ? "Opening Google" : "Continue with Google"}
              </button>
              <p className="my-5 text-center text-xs text-ink-2">
                or use your email
              </p>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-3">
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
              <button
                disabled={state === "sending"}
                className="rounded-full bg-accent px-4 py-3 font-semibold text-accent-ink disabled:opacity-60"
              >
                {state === "sending" ? "Sending" : "Email me a sign-in link"}
              </button>
              {state === "error" && (
                <p role="alert" className="text-sm text-danger">
                  That did not work. Try again in a minute.
                </p>
              )}
            </form>
          </>
        )}
      </div>
    </main>
  );
}
