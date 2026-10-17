import { describe, expect, it } from "vitest";
import { alertText, assessLab, labPaused, looksLikeBillingError, shouldAlert, type LabStat } from "./labs";

const NOW = Date.parse("2026-11-01T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW - h * 3_600_000).toISOString();
const daysAgo = (d: number) => hoursAgo(d * 24);

const base: LabStat = {
  lab: "google",
  has_balance: true,
  balance_micros: 40_000_000,
  recorded_at: daysAgo(2),
  spent_since_micros: 10_000_000,
  spent_7d_micros: 14_000_000,
  first_job_at: daysAgo(10),
  low_runway_days: 3,
  low_floor_micros: 5_000_000,
  last_alert_at: null,
  last_alert_level: null,
  billing_error_at: null,
  note: null,
};

describe("assessLab", () => {
  it("is ok with plenty of runway", () => {
    const r = assessLab(base, NOW);
    expect(r.remainingMicros).toBe(30_000_000);
    expect(r.burnPerDayMicros).toBe(2_000_000); // 14 USD over 7 days
    expect(r.runwayDays).toBe(15);
    expect(r.level).toBe("ok");
  });

  it("goes low under three days of spend", () => {
    const r = assessLab({ ...base, spent_since_micros: 35_000_000 }, NOW); // 5 USD left, 2.5 days
    expect(r.level).toBe("low");
  });

  it("goes low under the dollar floor even with no recent spend", () => {
    const r = assessLab({ ...base, spent_since_micros: 36_000_000, spent_7d_micros: 0 }, NOW);
    expect(r.level).toBe("low");
  });

  it("is empty at or below zero", () => {
    expect(assessLab({ ...base, spent_since_micros: 40_000_000 }, NOW).level).toBe("empty");
    expect(assessLab({ ...base, spent_since_micros: 45_000_000 }, NOW).level).toBe("empty");
  });

  it("has no runway once the balance is used up", () => {
    expect(assessLab({ ...base, spent_since_micros: 45_000_000 }, NOW).runwayDays).toBeNull();
  });

  it("is unknown until a balance is recorded", () => {
    expect(assessLab({ ...base, has_balance: false, balance_micros: 0 }, NOW).level).toBe("unknown");
  });

  it("uses the days since the first job when the account is young", () => {
    const r = assessLab({ ...base, first_job_at: hoursAgo(12), spent_7d_micros: 1_000_000 }, NOW);
    expect(r.burnPerDayMicros).toBe(1_000_000); // 12 hours counts as one day, not seven
  });

  it("reports a billing error until a newer balance is recorded", () => {
    const err = { ...base, billing_error_at: hoursAgo(0.5) };
    expect(assessLab(err, NOW).level).toBe("billing_error");
    expect(assessLab({ ...err, recorded_at: hoursAgo(0.1) }, NOW).level).toBe("ok");
    expect(assessLab({ ...err, billing_error_at: hoursAgo(3) }, NOW).level).toBe("ok");
  });
});

describe("labPaused", () => {
  it("pauses for 15 minutes after a billing error", () => {
    expect(labPaused({ ...base, billing_error_at: hoursAgo(0.1) }, NOW)).toBe(true);
    expect(labPaused({ ...base, billing_error_at: hoursAgo(0.5) }, NOW)).toBe(false);
  });
});

describe("shouldAlert", () => {
  const low = assessLab({ ...base, spent_since_micros: 37_000_000 }, NOW);
  it("alerts on a new bad level", () => expect(shouldAlert(low, NOW)).toBe(true));
  it("stays quiet for the same level within 12 hours", () => {
    const again = { ...low, stat: { ...low.stat, last_alert_level: "low", last_alert_at: hoursAgo(5) } };
    expect(shouldAlert(again, NOW)).toBe(false);
  });
  it("reminds after 12 hours", () => {
    const again = { ...low, stat: { ...low.stat, last_alert_level: "low", last_alert_at: hoursAgo(13) } };
    expect(shouldAlert(again, NOW)).toBe(true);
  });
  it("alerts again when the level gets worse", () => {
    const worse = assessLab({ ...base, spent_since_micros: 41_000_000, last_alert_level: "low", last_alert_at: hoursAgo(1) }, NOW);
    expect(worse.level).toBe("empty");
    expect(shouldAlert(worse, NOW)).toBe(true);
  });
  it("never alerts when ok or unknown", () => {
    expect(shouldAlert(assessLab(base, NOW), NOW)).toBe(false);
    expect(shouldAlert(assessLab({ ...base, has_balance: false }, NOW), NOW)).toBe(false);
  });
});

describe("alertText", () => {
  it("names the lab and what to do, without em dashes", () => {
    const t = alertText(assessLab({ ...base, spent_since_micros: 37_000_000 }, NOW));
    expect(t).toContain("Google");
    expect(t).toContain("$3.00 left");
    expect(t).not.toContain("—");
  });
});

describe("looksLikeBillingError", () => {
  it("catches payment required and billing messages but not rate limits", () => {
    expect(looksLikeBillingError(402, "")).toBe(true);
    expect(looksLikeBillingError(403, "Billing account is not active")).toBe(true);
    expect(looksLikeBillingError(400, "Insufficient balance")).toBe(true);
    expect(looksLikeBillingError(429, "Too many requests, billing")).toBe(false);
    expect(looksLikeBillingError(400, "Prompt blocked by safety filter")).toBe(false);
  });
});
