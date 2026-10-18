import "server-only";
import { alertText, assessLab, labPaused, looksLikeBillingError, shouldAlert, type LabReport, type LabStat } from "@/lib/labs";
import { admin } from "@/lib/supabase/admin";

/** OpenRouter reports its own balance: credits bought minus credits used. Null when it cannot be read. */
export async function getOpenRouterBalanceMicros(): Promise<number | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://openrouter.ai/api/v1/credits", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const { data } = (await res.json()) as { data?: { total_credits?: number; total_usage?: number } };
    if (typeof data?.total_credits !== "number" || typeof data.total_usage !== "number") return null;
    return Math.round((data.total_credits - data.total_usage) * 1_000_000);
  } catch {
    return null;
  }
}

export async function getLabStats(): Promise<LabStat[]> {
  const [{ data, error }, live] = await Promise.all([admin().rpc("lab_stats"), getOpenRouterBalanceMicros()]);
  if (error) throw error;
  // The live OpenRouter balance replaces the hand-entered one, so there is nothing to subtract.
  return (data as LabStat[]).map((s) =>
    s.lab === "openrouter" && live !== null
      ? { ...s, has_balance: true, balance_micros: live, spent_since_micros: 0, recorded_at: new Date().toISOString(), note: "Read live from OpenRouter" }
      : s,
  );
}

export async function getLabReports(): Promise<LabReport[]> {
  return (await getLabStats()).map((s) => assessLab(s));
}

/** Labs whose models should be hidden for now because the lab recently refused requests over billing. */
export async function getPausedLabs(): Promise<Set<string>> {
  try {
    // Reads only the small lab_balances table. lab_stats() aggregates every job and is for the admin page.
    const { data } = await admin().from("lab_balances").select("lab, recorded, recorded_at, billing_error_at").not("billing_error_at", "is", null);
    const rows = (data ?? []) as { lab: string; recorded: boolean; recorded_at: string | null; billing_error_at: string }[];
    return new Set(
      rows
        .filter((r) => labPaused({ billing_error_at: r.billing_error_at, recorded_at: r.recorded_at, has_balance: r.recorded } as LabStat))
        .map((r) => r.lab),
    );
  } catch {
    return new Set();
  }
}

/** Record that a lab refused a request in a way that looks like an empty balance. */
export async function noteBillingError(lab: string, status: number | undefined, structuredBilling = false) {
  if (!looksLikeBillingError(status, structuredBilling)) return;
  try {
    await admin().rpc("note_lab_billing_error", { p_lab: lab } as never);
  } catch (e) {
    console.error("could not note billing error", e);
  }
}

export async function sendAlert(text: string) {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) {
    console.warn("ALERT (no ALERT_WEBHOOK_URL set):", text);
    return;
  }
  try {
    // "text" is read by Slack and "content" by Discord, so one body works for either.
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `Sparebar: ${text}`, content: `Sparebar: ${text}` }),
    });
    if (!res.ok) console.error("alert webhook returned", res.status);
  } catch (e) {
    console.error("alert webhook failed", e);
  }
}

/** Run from the minute tick. Sends an alert when a lab turns low, and clears the state when it recovers. */
export async function checkLabAlerts() {
  const db = admin();
  const sent: string[] = [];
  for (const r of await getLabReports()) {
    if (shouldAlert(r)) {
      await sendAlert(alertText(r));
      await db
        .from("lab_balances")
        .update({ last_alert_at: new Date().toISOString(), last_alert_level: r.level } as never)
        .eq("lab", r.lab);
      sent.push(`${r.lab}:${r.level}`);
    } else if ((r.level === "ok" || r.level === "unknown") && r.stat.last_alert_level) {
      await db.from("lab_balances").update({ last_alert_level: null } as never).eq("lab", r.lab);
    }
  }
  return sent;
}
