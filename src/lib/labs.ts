// Lab balance tracking. Labs are prepaid and expose no reliable balance API, so an admin records the
// balance after each top-up and spend is estimated from the lab cost logged on every job.

export const LAB_NAMES: Record<string, string> = {
  google: "Google",
  xai: "xAI",
  minimax: "MiniMax",
  alibaba: "Alibaba",
};

export type LabStat = {
  lab: string;
  has_balance: boolean;
  balance_micros: number;
  recorded_at: string | null;
  spent_since_micros: number;
  spent_7d_micros: number;
  first_job_at: string | null;
  low_runway_days: number;
  low_floor_micros: number;
  last_alert_at: string | null;
  last_alert_level: string | null;
  billing_error_at: string | null;
  note: string | null;
};

export type LabLevel = "unknown" | "ok" | "low" | "empty" | "billing_error";

export type LabReport = {
  lab: string;
  name: string;
  level: LabLevel;
  recordedAt: string | null;
  balanceMicros: number | null;
  remainingMicros: number | null;
  burnPerDayMicros: number;
  runwayDays: number | null;
  lowRunwayDays: number;
  lowFloorMicros: number;
  note: string | null;
  stat: LabStat;
};

const DAY = 86_400_000;
/** A billing style error stops mattering after this long, or once a newer balance is recorded. */
export const BILLING_ERROR_WINDOW_MS = 2 * 60 * 60 * 1000;
/** After a billing style error, the lab's models are hidden from users for this long. */
export const PAUSE_WINDOW_MS = 15 * 60 * 1000;
export const ALERT_REPEAT_MS = 12 * 60 * 60 * 1000;

function billingErrorActive(s: LabStat, now: number, windowMs: number) {
  if (!s.billing_error_at) return false;
  const at = Date.parse(s.billing_error_at);
  if (now - at > windowMs) return false;
  // A balance recorded after the error means a top-up happened since.
  return !s.recorded_at || !s.has_balance || at > Date.parse(s.recorded_at);
}

export function assessLab(s: LabStat, now = Date.now()): LabReport {
  const days = s.first_job_at ? Math.min(7, Math.max(1, (now - Date.parse(s.first_job_at)) / DAY)) : 1;
  const burn = Math.round(s.spent_7d_micros / days);
  const remaining = s.has_balance ? s.balance_micros - s.spent_since_micros : null;
  const runway = remaining !== null && remaining > 0 && burn > 0 ? remaining / burn : null;

  let level: LabLevel;
  if (billingErrorActive(s, now, BILLING_ERROR_WINDOW_MS)) level = "billing_error";
  else if (remaining === null) level = "unknown";
  else if (remaining <= 0) level = "empty";
  else if (remaining < s.low_floor_micros) level = "low";
  else if (runway !== null && runway < Number(s.low_runway_days)) level = "low";
  else level = "ok";

  return {
    lab: s.lab,
    name: LAB_NAMES[s.lab] ?? s.lab,
    level,
    recordedAt: s.recorded_at,
    balanceMicros: s.has_balance ? s.balance_micros : null,
    remainingMicros: remaining,
    burnPerDayMicros: burn,
    runwayDays: runway,
    lowRunwayDays: Number(s.low_runway_days),
    lowFloorMicros: s.low_floor_micros,
    note: s.note,
    stat: s,
  };
}

/** True when a lab recently refused requests over billing, so its models should be paused for users. */
export function labPaused(s: LabStat, now = Date.now()) {
  return billingErrorActive(s, now, PAUSE_WINDOW_MS);
}

/** Alert when the level is bad and is new, or when the same bad level has gone 12 hours without a reminder. */
export function shouldAlert(r: LabReport, now = Date.now()) {
  if (r.level === "ok" || r.level === "unknown") return false;
  const { last_alert_at, last_alert_level } = r.stat;
  if (last_alert_level !== r.level || !last_alert_at) return true;
  return now - Date.parse(last_alert_at) > ALERT_REPEAT_MS;
}

export function usd(micros: number, digits = 2) {
  return `$${(micros / 1_000_000).toFixed(digits)}`;
}

export function alertText(r: LabReport) {
  const left = r.remainingMicros !== null ? `about ${usd(Math.max(0, r.remainingMicros))} left` : "balance unknown";
  switch (r.level) {
    case "billing_error":
      return `${r.name} refused a request over billing or quota. The balance may be empty (${left}). Top up and record the new balance in Admin.`;
    case "empty":
      return `${r.name} balance is used up (${left}). Generation with ${r.name} models will fail. Top up and record the new balance in Admin.`;
    default:
      return `${r.name} balance is low: ${left}${r.runwayDays !== null ? `, about ${r.runwayDays.toFixed(1)} days at the current rate` : ""}. Top up soon and record the new balance in Admin.`;
  }
}

/**
 * Does this failure mean the lab account itself is the problem (empty balance, bad key, billing off)?
 * Decided only from the HTTP status or a structured flag the adapter sets from the lab's error code.
 * Free text is never used: provider messages can echo a user's prompt, so a crafted prompt could
 * otherwise pause a lab for everyone.
 */
export function looksLikeBillingError(status: number | undefined, structuredBilling = false) {
  return structuredBilling || status === 401 || status === 402 || status === 403;
}
