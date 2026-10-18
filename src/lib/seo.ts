import { brand } from "@/config/brand";
import { FAQ } from "@/config/faq";
import { FREE_TIER } from "@/config/free-tier";
import { MODEL_META } from "@/config/model-meta";
import { OPTIONS } from "@/config/model-options";
import { MODELS, type ModelConfig } from "@/config/models";
import { PACKS, PLANS } from "@/config/plans";
import { creditsForCost, creditsForModel } from "@/lib/credits";
import { getAdapter } from "@/lib/providers";

export const SITE = {
  title:
    "Sparebar: AI UGC image and video generator with one consistent character",
  description:
    "Sparebar is an AI UGC generator. Make a character once from photos or a description, then create images and videos of the same face in any scene, with Seedance, Kling, Veo, Nano Banana and dozens more models.",
  keywords: [
    "Sparebar",
    "sparebar.xyz",
    "AI UGC generator",
    "AI UGC video generator",
    "AI influencer generator",
    "consistent character AI",
    "AI character generator",
    "UGC ads with AI",
    "AI video generator",
    "AI image generator",
    "Seedance",
    "Kling",
    "Veo",
    "Nano Banana",
  ],
} as const;

export const abs = (path = "") => `${brand.url}${path}`;

export type CatalogModel = {
  key: string;
  label: string;
  kind: "image" | "video";
  maker: string;
  blurb: string;
  tags: string[];
  rank: number;
  credits: number;
  freeEligible: boolean;
  options: { value: string; credits: number; seconds?: number }[];
  durations: number[];
  sound: boolean;
};

function describe(m: ModelConfig): CatalogModel {
  const meta = MODEL_META[m.key];
  const opts = OPTIONS[m.key];
  const secs = m.defaults.seconds ?? 8;
  return {
    key: m.key,
    label: m.label,
    kind: m.kind,
    maker: meta?.maker ?? "",
    blurb: meta?.blurb ?? "",
    tags: meta?.tags ?? [],
    rank: meta?.rank ?? 99,
    credits: creditsForModel(m),
    freeEligible: m.freeEligible,
    options: (opts?.resolutions ?? []).map((r) => ({
      value: r.value,
      seconds: m.kind === "video" ? (r.seconds ?? secs) : undefined,
      credits: creditsForCost(
        r.costMicros * (m.kind === "video" ? (r.seconds ?? secs) : 1),
      ),
    })),
    durations: opts?.durations ?? [],
    sound: (meta?.tags ?? []).includes("Sound"),
  };
}

/** Every model a visitor can use, best first within images and videos. */
export function catalog(): CatalogModel[] {
  return MODELS.filter((m) => m.enabled && getAdapter(m.lab))
    .map(describe)
    .sort((a, b) =>
      a.kind === b.kind ? a.rank - b.rank : a.kind === "video" ? -1 : 1,
    );
}

export const findModel = (key: string) => catalog().find((m) => m.key === key);

export const usd = (cents: number) =>
  `$${cents % 100 === 0 ? cents / 100 : (cents / 100).toFixed(2)}`;

export function organizationLd() {
  return {
    "@type": "Organization",
    "@id": abs("/#organization"),
    name: brand.name,
    alternateName: ["Sparebar AI", "Sparebar.xyz"],
    url: abs("/"),
    logo: abs("/icon.svg"),
    email: brand.supportEmail,
    description: SITE.description,
  };
}

export function websiteLd() {
  return {
    "@type": "WebSite",
    "@id": abs("/#website"),
    url: abs("/"),
    name: brand.name,
    alternateName: ["Sparebar AI", "Sparebar.xyz"],
    description: SITE.description,
    inLanguage: "en",
    publisher: { "@id": abs("/#organization") },
  };
}

export function softwareLd() {
  return {
    "@type": "WebApplication",
    "@id": abs("/#app"),
    name: brand.name,
    url: abs("/"),
    description: SITE.description,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any, in a web browser",
    browserRequirements: "Requires JavaScript",
    featureList: [
      "Create a character from up to three photos or a text description",
      "Generate UGC style images and videos with the same face",
      "More than 50 image and video models in one place",
      "Fixed credit cost shown before every generation",
      "Credits returned automatically when a generation fails",
    ],
    offers: [
      {
        "@type": "Offer",
        name: "Free credits",
        price: "0",
        priceCurrency: "USD",
        description: `${FREE_TIER.credits} free credits on signup`,
      },
      ...[...PLANS, ...PACKS].map((p) => ({
        "@type": "Offer",
        name: `${p.label} (${p.credits} credits)`,
        price: (p.priceUsdCents / 100).toFixed(2),
        priceCurrency: "USD",
      })),
    ],
    publisher: { "@id": abs("/#organization") },
  };
}

export function faqLd(items: readonly { q: string; a: string }[] = FAQ) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function breadcrumbLd(trail: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: abs(t.path),
    })),
  };
}

export function graph(...nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}
