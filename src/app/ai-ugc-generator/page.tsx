import type { Metadata } from "next";
import { GuidePage, type Guide } from "@/components/guide-page";

const guide: Guide = {
  path: "/ai-ugc-generator",
  name: "AI UGC generator",
  h1: "AI UGC generator for images and videos",
  intro:
    "Sparebar makes UGC style photos and videos with AI. Save a character once, describe a scene, and get content that looks like a real person filmed it on a phone, without booking creators or shooting anything.",
  sections: [
    {
      h: "What is AI UGC?",
      p: [
        "UGC means user generated content: the handheld, natural looking photos and short videos people post about products, places and everyday life. Brands use it in ads and social posts because it feels more real than studio work.",
        "AI UGC creates that look with image and video models instead of a camera. The hard part is keeping the same person in every shot. Sparebar solves that with saved characters.",
      ],
    },
    {
      h: "How Sparebar makes AI UGC",
      p: ["The flow has three steps and takes a few minutes the first time."],
      list: [
        "Create a character. Upload up to three photos of a person who agreed to it, or describe someone and Sparebar makes a portrait.",
        "Describe a shot. Pick the character, write the scene, choose an image or a video and a shape such as 9:16 for Reels, TikTok and Shorts.",
        "Download the result from your library, or run the same shot again with a small change.",
      ],
    },
    {
      h: "Pick the model for the job",
      p: [
        "Sparebar runs more than 50 image and video models in one place, including Seedance, Kling, Veo, Wan, Nano Banana, Seedream and FLUX. Each model shows its credit cost before you run it, so you know the price of every generation up front.",
        "Video models can add sound, and you can choose resolution and length where the model supports it. Failed generations are refunded to your balance automatically.",
      ],
    },
    {
      h: "Use real people only with permission",
      p: [
        "Only upload photos of people who gave you permission. The terms do not allow content that shows a real person without consent, or that is meant to deceive others about who someone is.",
      ],
    },
  ],
  faq: [
    {
      q: "Can AI make UGC videos?",
      a: "Yes. Sparebar turns a saved character and a scene description into short vertical or horizontal videos with models such as Seedance, Kling and Veo, and many of them add sound.",
    },
    {
      q: "How do I keep the same face in every video?",
      a: "Save a character with up to three reference photos, then pick that character for each shot. Sparebar passes the photos to the model every time.",
    },
    {
      q: "How much does an AI UGC video cost?",
      a: "Each model has a fixed credit cost shown before you run it. Lower priced image models start at 2 credits. Plans start at $15 for 150 credits and packs start at $10 for 100 credits.",
    },
    {
      q: "Do I need a card to try it?",
      a: "No. New accounts get free credits that work on images, with no card needed.",
    },
  ],
};

export const metadata: Metadata = {
  title: "AI UGC generator for images and videos",
  description:
    "Make UGC style photos and videos with AI. Save a character once and put the same face in any scene, with Seedance, Kling, Veo, Nano Banana and 50 more models.",
  alternates: { canonical: guide.path },
};

export default function Page() {
  return <GuidePage guide={guide} />;
}
