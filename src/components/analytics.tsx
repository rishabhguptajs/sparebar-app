"use client";

import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { useEffect, useState } from "react";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
const CONSENT = "sb_consent";

let started = false;

function start() {
  if (!KEY || started) return;
  started = true;
  posthog.init(KEY, {
    api_host: HOST,
    person_profiles: "identified_only",
    // We send page views ourselves so single page navigation is counted.
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
    // Off on purpose: recordings can contain people's photos and prompts.
    disable_session_recording: true,
  });
}

function readConsent(): "yes" | "no" | null {
  try {
    const v = localStorage.getItem(CONSENT);
    return v === "yes" || v === "no" ? v : null;
  } catch {
    return null;
  }
}

/** A product event from the browser. Does nothing until someone has accepted analytics. */
export function track(event: string, props?: Record<string, string | number | boolean | null>) {
  if (started) posthog.capture(event, props);
}

/** Ties browser activity to the signed in account. Call it once the user id is known. */
export function identify(userId: string) {
  if (started) posthog.identify(userId);
}

export function Analytics() {
  const path = usePathname();
  const [consent, setConsent] = useState<"yes" | "no" | null | "loading">("loading");

  useEffect(() => {
    const c = readConsent();
    setConsent(c);
    if (c === "yes") start();
  }, []);

  useEffect(() => {
    if (started) posthog.capture("$pageview", { $current_url: window.location.href });
  }, [path, consent]);

  function choose(v: "yes" | "no") {
    try {
      localStorage.setItem(CONSENT, v);
    } catch {
      // Without storage the choice only lasts for this visit.
    }
    setConsent(v);
    if (v === "yes") start();
  }

  return (
    <>
      {/* Counts visits and pages without cookies or personal data, so it needs no consent. */}
      <VercelAnalytics />
      {KEY && consent === null && (
        <div role="dialog" aria-label="Analytics" className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md rounded-2xl border border-line bg-bg p-4 text-sm shadow-[0_20px_60px_-16px_rgba(20,20,60,0.3)] md:bottom-4 md:left-4 md:right-auto md:mx-0">
          <p className="text-ink-2">
            We use analytics to see what is confusing and what works, so we can improve Sparebar. No ads, and we never sell your data.{" "}
            <a href="/privacy" className="text-ink underline underline-offset-4">
              Details
            </a>
          </p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => choose("yes")} className="btn px-4 py-2 text-sm">
              Accept
            </button>
            <button type="button" onClick={() => choose("no")} className="btn-ghost px-4 py-2 text-sm">
              Decline
            </button>
          </div>
        </div>
      )}
    </>
  );
}
