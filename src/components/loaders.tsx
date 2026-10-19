"use client";

import { CharactersView } from "@/components/characters-view";
import { CreateView } from "@/components/create-view";
import { CreditsView } from "@/components/credits-view";
import { LibraryView } from "@/components/library-view";
import { PageSkeleton } from "@/components/page-skeleton";
import { AdsView } from "@/components/ads-view";
import { ProductsView } from "@/components/products-view";
import { SettingsView } from "@/components/settings-view";
import { StudioView } from "@/components/studio-view";
import { FREE_TIER } from "@/config/free-tier";
import { useCharacters, useCreditsPage, useJobs, useProducts, useSettings, useStudio } from "@/lib/queries";

// Each page is an empty shell that asks the API for its data. The cache shows the last answer straight away.

export function LibraryLoader() {
  const { data } = useJobs();
  return data ? <LibraryView base="/app" jobs={data} /> : <PageSkeleton />;
}

export function CharactersLoader({ portraitCredits, openNew }: { portraitCredits: number; openNew: boolean }) {
  const { data } = useCharacters();
  return data ? <CharactersView base="/app" characters={data} portraitCredits={portraitCredits} openNew={openNew} /> : <PageSkeleton />;
}

export function ProductsLoader() {
  const { data } = useProducts();
  return data ? <ProductsView base="/app" products={data} /> : <PageSkeleton />;
}

export function CreditsLoader() {
  const { data } = useCreditsPage();
  if (!data) return <PageSkeleton />;
  return (
    <CreditsView
      base="/app"
      balance={data.balance}
      region={data.region}
      savedStateCode={data.savedStateCode}
      gstRegistered={data.gstRegistered}
      sellerStateCode={data.sellerStateCode}
      payments={data.payments}
      activity={data.activity}
      invoiceBase="/invoice"
    />
  );
}

export function SettingsLoader() {
  const { data } = useSettings();
  return data ? <SettingsView email={data.email} fullName={data.fullName} stateCode={data.stateCode} region={data.region} /> : <PageSkeleton />;
}

export function CreateLoader() {
  const { data } = useStudio();
  return data ? <CreateView base="/app" models={data.models} characters={data.characters} products={data.products} /> : <PageSkeleton />;
}

export function AdsLoader() {
  const { data } = useStudio();
  return data ? <AdsView base="/app" models={data.models} characters={data.characters} products={data.products} /> : <PageSkeleton />;
}

export function StudioLoader({ rerun, character, welcome }: { rerun?: string; character?: string; welcome?: string }) {
  const { data } = useStudio(rerun, character);
  if (!data) return <PageSkeleton />;
  const notice =
    welcome === "granted"
      ? `You have ${FREE_TIER.credits} free credits, enough for one image. They work for images only and expire in ${FREE_TIER.expiresDays} days.`
      : welcome === "denied"
        ? "Free credits were already claimed from this device or email. You can add credits to keep going."
        : undefined;
  return <StudioView key={rerun ?? character ?? "studio"} base="/app" models={data.models} characters={data.characters} products={data.products} recent={data.recent} initial={data.initial} notice={notice} />;
}
