import "server-only";
import { after } from "next/server";
import type { User } from "@supabase/supabase-js";
import { countryFromHeaders } from "@/lib/country";
import { admin } from "@/lib/supabase/admin";

// Emails to the owner when something worth knowing happens. Sent with Resend; with no key set it only logs.
// RESEND_API_KEY is the key, OWNER_ALERT_EMAIL the address that gets the mail. Until a sending domain is
// verified in Resend, mail can only go to the Resend account's own address from onboarding@resend.dev.
export function notifyOwner(subject: string, lines: string[]) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.OWNER_ALERT_EMAIL;
  if (!key || !to) {
    console.warn("OWNER ALERT (RESEND_API_KEY or OWNER_ALERT_EMAIL not set):", subject);
    return;
  }
  const send = () =>
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.ALERT_FROM_EMAIL || "Sparebar <onboarding@resend.dev>",
        to: [to],
        subject,
        text: lines.join("\n"),
      }),
    }).catch((e) => console.error("owner alert failed", e));
  // after() keeps the request alive until the mail is sent. Outside a request it throws, so send directly.
  try {
    after(send);
  } catch {
    void send();
  }
}

/** Tells the owner about a new account, once. The profile row records that it has been announced. */
export async function announceSignup(user: User, headers: Headers, freeCredits: string) {
  const { data, error } = await admin()
    .from("profiles")
    .update({ signup_notified_at: new Date().toISOString() } as never)
    .eq("id", user.id)
    .is("signup_notified_at", null)
    .select("id");
  if (error) return console.error("signup alert check failed", error.message);
  if (!data?.length) return;
  notifyOwner(`New Sparebar signup: ${user.email ?? user.id}`, [
    `Email: ${user.email ?? "none"}`,
    `Country: ${countryFromHeaders(headers) ?? "unknown"}`,
    `Free credits: ${freeCredits}`,
    `Time: ${new Date().toISOString()}`,
  ]);
}
