"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { CharacterCard, PresentedJob } from "@/lib/ui-types";

export const keys = {
  balance: ["balance"] as const,
  jobs: ["jobs"] as const,
  characters: ["characters"] as const,
  credits: ["credits"] as const,
};

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.json() as Promise<T>;
}

// Each hook starts from what the server rendered, then keeps the data fresh in the background.
// In the previews (demo) nothing is fetched.
export function useBalance(initial: number, demo = false) {
  return useQuery({ queryKey: keys.balance, queryFn: async () => (await get<{ balance: number }>("/api/balance")).balance, initialData: initial, enabled: !demo }).data;
}

export function useJobs(initial: PresentedJob[], demo = false) {
  return useQuery({ queryKey: keys.jobs, queryFn: async () => (await get<{ jobs: PresentedJob[] }>("/api/jobs")).jobs, initialData: initial, enabled: !demo }).data;
}

export function useCharacters(initial: CharacterCard[], demo = false) {
  return useQuery({ queryKey: keys.characters, queryFn: async () => (await get<{ characters: CharacterCard[] }>("/api/characters")).characters, initialData: initial, enabled: !demo }).data;
}

export function useCreditsData<P, A>(initial: { payments: P[]; activity: A[] }, demo = false) {
  return useQuery({ queryKey: keys.credits, queryFn: () => get<{ payments: P[]; activity: A[] }>("/api/credits"), initialData: initial, enabled: !demo }).data;
}

/** After a change (a purchase, a new character, a finished job): refresh the cache and the server rendered parts. */
export function useRefreshData() {
  const client = useQueryClient();
  const router = useRouter();
  return () => {
    client.invalidateQueries();
    router.refresh();
  };
}
