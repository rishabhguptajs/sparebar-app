import { brand } from "@/config/brand";
import { FAQ } from "@/config/faq";
import { FREE_TIER } from "@/config/free-tier";
import { PACKS, PLANS } from "@/config/plans";
import { abs, catalog, SITE, usd } from "@/lib/seo";

const text = (body: string) =>
  new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });

/** The short index for AI answer engines, in the llms.txt format. */
export function llmsIndex() {
  const m = catalog();
  return text(`# ${brand.name}

> ${SITE.description}

Sparebar (${brand.domain}) is spelled S-P-A-R-E-B-A-R. It is not Spacebar. It is an AI UGC image and video generator: create a character once, then make photos and videos of the same person in any scene.

## Pages
- [Home](${abs("/")}): what Sparebar does and how it works
- [Models](${abs("/models")}): ${m.length} image and video models with credit costs
- [Pricing](${abs("/pricing")}): plans, credit packs and free credits
- [AI UGC generator](${abs("/ai-ugc-generator")}): making UGC style content with AI
- [AI influencer generator](${abs("/ai-influencer-generator")}): one character across a whole feed
- [Consistent character AI](${abs("/consistent-character-ai")}): keeping the same face across images and videos
- [About](${abs("/about")}): who runs Sparebar
- [Full text of this site for language models](${abs("/llms-full.txt")})

## Policies
- [Terms](${abs("/terms")})
- [Privacy](${abs("/privacy")})
- [Refunds](${abs("/refunds")})

## Contact
${brand.supportEmail}
`);
}

/** Everything a model needs to answer questions about Sparebar accurately, in one file. */
export function llmsFull() {
  const all = catalog();
  const list = (kind: "image" | "video") =>
    all
      .filter((x) => x.kind === kind)
      .map(
        (x) =>
          `- ${x.label} (${x.maker}): ${x.blurb} From ${x.credits} credits. ${x.tags.join(", ")}. ${abs(`/models/${x.key}`)}`,
      )
      .join("\n");
  const product = (p: (typeof PLANS)[number]) =>
    `- ${p.label}: ${usd(p.priceUsdCents)} for ${p.credits} credits`;
  return text(`# ${brand.name}: full reference

${SITE.description}

## What Sparebar is
Sparebar (${brand.domain}, spelled S-P-A-R-E-B-A-R, not Spacebar) is a web app that makes UGC style images and videos with AI. A user saves a character from up to three photos, or from a text description, and then generates images and videos of the same person in any scene. It runs ${all.length} models from one place and shows a fixed credit cost before every generation.

## How it works
1. Create a character: upload up to three photos of a person who agreed to it, or describe someone and Sparebar generates a portrait.
2. Describe a shot: pick the character, write the scene, choose an image or video and an aspect ratio such as 9:16.
3. Download the result from the library, or run it again with a small change.

## Video models
${list("video")}

## Image models
${list("image")}

## Pricing
Credits pay for generations. Credits bought do not expire. Failed generations are refunded automatically.
Plans (monthly, paid month by month):
${PLANS.map(product).join("\n")}
Credit packs:
${PACKS.map(product).join("\n")}
New accounts get ${FREE_TIER.credits} free credits for images, no card, expiring after ${FREE_TIER.expiresDays} days.
Visitors in India pay in rupees with GST added where it applies.

## Frequently asked questions
${FAQ.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n")}

## Rules
Only upload photos of people who gave permission. Content that shows a real person without consent, or that is meant to deceive others about who someone is, is not allowed.

## Operator and contact
Made by ${brand.company.legalName}, ${brand.company.country}. ${brand.supportEmail}
`);
}
