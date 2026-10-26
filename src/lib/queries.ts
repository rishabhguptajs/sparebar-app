"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ActivityRow, PaymentRow } from "@/lib/data";
import type { ReferralSummary } from "@/lib/referral";
import type { CharacterCard, ModelOption, PresentedJob, ProductCard } from "@/lib/ui-types";

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.json() as Promise<T>;
}

// Pages load as an empty shell and fill in from these calls. The cache keeps the last answer, so a page you
// have seen shows at once and refreshes in the background.
export const useMe = (demo = false) => useQuery({ queryKey: ["me"], queryFn: () => get<{ id: string; balance: number; isAdmin: boolean }>("/api/me"), enabled: !demo });

export const useJobs = () => useQuery({ queryKey: ["jobs"], queryFn: async () => (await get<{ jobs: PresentedJob[] }>("/api/jobs")).jobs });

export const useCharacters = () => useQuery({ queryKey: ["characters"], queryFn: async () => (await get<{ characters: CharacterCard[] }>("/api/characters")).characters });

export const useProducts = () => useQuery({ queryKey: ["products"], queryFn: async () => (await get<{ products: ProductCard[] }>("/api/products")).products });

export type CreditsPageData = {
  balance: number;
  payments: PaymentRow[];
  activity: ActivityRow[];
  /** First purchase of a referred friend: the discount applies. */
  friendDiscount: boolean;
};
export const useCreditsPage = () => useQuery({ queryKey: ["credits"], queryFn: () => get<CreditsPageData>("/api/credits") });

export const useReferrals = () => useQuery({ queryKey: ["referrals"], queryFn: () => get<ReferralSummary>("/api/referral") });

export type SettingsData = { email: string | null; fullName: string };
export const useSettings = () => useQuery({ queryKey: ["settings"], queryFn: () => get<SettingsData>("/api/settings") });

export type StudioData = {
  models: ModelOption[];
  characters: CharacterCard[];
  products: ProductCard[];
  recent: PresentedJob[];
  initial: { modelKey?: string; prompt?: string; characterId?: string; aspectRatio?: string };
};
export const useStudio = (rerun?: string, character?: string) =>
  useQuery({
    queryKey: ["studio", rerun ?? null, character ?? null],
    queryFn: () => get<StudioData>(`/api/studio?${new URLSearchParams({ ...(rerun ? { rerun } : {}), ...(character ? { character } : {}) })}`),
  });

/** After a change (a purchase, a new character, a finished job): mark everything cached as stale so it refetches. */
export function useRefreshData() {
  const client = useQueryClient();
  return () => {
    client.invalidateQueries();
  };
}
