import "server-only";
import { randomUUID } from "node:crypto";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { DEVICE_COOKIE, FREE_TIER } from "@/config/free-tier";
import { clientIp, hashValue, isDisposable, normalizeEmail } from "@/lib/abuse";
import { admin } from "@/lib/supabase/admin";

export type FreeOutcome = "granted" | "denied" | "off";

/**
 * Gives a new user their free credits once, if the device, email and network checks pass.
 * Called after a verified sign in. Never throws: a problem here must not block signing in.
 */
export async function claimFreeCredits(user: User, headers: Headers): Promise<{ outcome: FreeOutcome; newDeviceId?: string }> {
  try {
    if (!user.email) return { outcome: "off" };
    const salt = process.env.ABUSE_SALT;
    if (!salt) return { outcome: "off" }; // not configured: do not hand out credits unchecked

    const store = await cookies();
    let device = store.get(DEVICE_COOKIE)?.value;
    let newDeviceId: string | undefined;
    if (!device) device = newDeviceId = randomUUID();

    const ip = clientIp(headers);
    const { data, error } = await admin().rpc("claim_free_credits", {
      p_user: user.id,
      p_email_norm: normalizeEmail(user.email),
      p_device_hash: hashValue(salt, `device:${device}`),
      p_ip_hash: ip ? hashValue(salt, `ip:${ip}`) : null,
      p_amount: FREE_TIER.credits,
      p_expires_days: FREE_TIER.expiresDays,
      p_ip_limit: FREE_TIER.perIpPerDay,
      p_disposable: isDisposable(user.email),
      p_paused: process.env.FREE_CREDITS_ENABLED === "false",
    } as never);
    if (error) throw error;
    return { outcome: data === "granted" ? "granted" : "denied", newDeviceId };
  } catch (e) {
    console.error("free credit claim failed", e);
    return { outcome: "off" };
  }
}
