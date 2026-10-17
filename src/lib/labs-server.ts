import "server-only";
import { alertText, assessLab, labPaused, looksLikeBillingError, shouldAlert, type LabReport, type LabStat } from "@/lib/labs";
import { admin } from "@/lib/supabase/admin";

export async function getLabStats(): Promise<LabStat[]> {
  const { data, error } = await admin().rpc("lab_stats");
  if (error) throw error;
  return data as LabStat[];
}

export async function getLabReports(): Promise<LabReport[]> {
  return (await getLabStats()).map((s) => assessLab(s));
}

/** Labs whose models should be hidden for now because the lab recently refused requests over billing. */
export async function getPausedLabs(): Promise<Set<string>> {
  try {
    return new Set((await getLabStats()).filter((s) => labPaused(s)).map((s) => s.lab));
  } catch {
    return new Set();
  }
}

/** Record that a lab refused a request in a way that looks like an empty balance. */
export async function noteBillingError(lab: string, status: number | undefined, message: string) {
  if (!looksLikeBillingError(status, message)) return;
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
