import type { Metadata } from "next";
import { GuidePage, type Guide } from "@/components/guide-page";

const guide: Guide = {
  path: "/ai-influencer-generator",
  name: "AI influencer generator",
  h1: "AI influencer generator: one character, every shot",
  intro:
    "Build a character with Sparebar and use it as your own AI influencer. The same face appears in photos and videos across every scene, outfit and place you can describe, so a feed of content looks like one person.",
  sections: [
    {
      h: "Build the character once",
      p: [
        "Start with up to three photos of a person who agreed to be used, or write a description and let Sparebar generate a portrait. Add a name, a niche and a tone of voice so the character stays consistent in how it is described.",
        "Every character is saved to your account and can be picked for any future shot.",
      ],
    },
    {
      h: "Make a whole feed, not one image",
      p: [
        "A single good image is easy. A feed needs the same person in different settings. With a saved character you only change the scene.",
      ],
      list: [
        "Morning routine photos, product holds, gym and travel shots in the same face.",
        "Short vertical videos for Reels, TikTok and Shorts, with sound on models that support it.",
        "Different resolutions and lengths per shot, priced in credits before you run them.",
      ],
    },
    {
      h: "Choose how good and how costly",
      p: [
        "Use a low cost image model to test ideas, then switch to a top video model such as Seedance or Veo for the final clip. The model picker lists the best models first and shows what each one can do.",
      ],
    },
    {
      h: "Be clear about what is AI",
      p: [
        "Many platforms ask creators to label AI generated content. Check the rules of the places you post, and do not present a generated person as a real individual to mislead people.",
      ],
    },
  ],
  faq: [
    {
      q: "What is an AI influencer?",
      a: "An AI influencer is a character made with image and video models that posts content like a creator would. The character is not a real person, or is a real person who agreed to be represented.",
    },
    {
      q: "How do I keep an AI influencer consistent?",
      a: "Save the character in Sparebar with reference photos, then pick it for each shot. The same photos guide every generation.",
    },
    {
      q: "Which models are best for an AI influencer?",
      a: "For video, Seedance 2.0 and Kling 3 give natural faces and motion. For images, Nano Banana Pro and Seedream 5 Pro are strong choices. The model picker ranks them for you.",
    },
    {
      q: "Can I use a real person?",
      a: "Only with their permission. The terms do not allow content that shows a real person without consent.",
    },
  ],
};

export const metadata: Metadata = {
  title: "AI influencer generator: one character, every shot",
  description:
    "Create an AI influencer with a consistent face. Save a character, then generate photos and videos of the same person in any scene with 50+ image and video models.",
  alternates: { canonical: guide.path },
};

export default function Page() {
  return <GuidePage guide={guide} />;
}
