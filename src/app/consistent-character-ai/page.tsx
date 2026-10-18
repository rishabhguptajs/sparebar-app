import type { Metadata } from "next";
import { GuidePage, type Guide } from "@/components/guide-page";

const guide: Guide = {
  path: "/consistent-character-ai",
  name: "Consistent character AI",
  h1: "Consistent character AI: the same face in every image and video",
  intro:
    "Most AI image tools give you a new face each time. Sparebar keeps one. Save a character with reference photos and every image or video you generate starts from that person.",
  sections: [
    {
      h: "Why faces change between generations",
      p: [
        "Image and video models start from noise and a prompt. Without a reference, even a very detailed description produces a different person on each run. Reference photos give the model the real face to follow.",
      ],
    },
    {
      h: "How Sparebar keeps a character consistent",
      p: ["Characters are saved reference sets, not prompts."],
      list: [
        "Upload up to three clear photos of the same person, or generate a portrait from a description.",
        "Pick the character when you describe a shot. Sparebar sends the photos to the model with your scene.",
        "Switch models freely. The character works across image and video models that accept reference images.",
      ],
    },
    {
      h: "Tips for better consistency",
      p: [],
      list: [
        "Use sharp, well lit photos that show the face from the front and one angle.",
        "Keep the scene description about the scene. Let the photos carry the face.",
        "Try a stronger model for hero shots. Top picks such as Seedance 2.0, Veo 3.1 and Nano Banana Pro follow references closely.",
        "Some video models may refuse photos of real people. If one does, try another model.",
      ],
    },
  ],
  faq: [
    {
      q: "What is consistent character AI?",
      a: "It is AI generation that keeps the same character, with the same face, across many images or videos instead of inventing a new one each time.",
    },
    {
      q: "How many photos do I need?",
      a: "Sparebar accepts up to three photos per character. One clear photo works, and a second angle helps.",
    },
    {
      q: "Does it work for video too?",
      a: "Yes. Video models that accept an image start from your character photo, so the person in the clip matches.",
    },
    {
      q: "Can I make a character without photos?",
      a: "Yes. Describe the person and Sparebar generates a portrait for a small credit cost, then saves it as the character.",
    },
  ],
};

export const metadata: Metadata = {
  title: "Consistent character AI: the same face in every image and video",
  description:
    "Keep one face across AI images and videos. Save a character with reference photos in Sparebar and reuse it with Seedance, Kling, Veo, Nano Banana and more.",
  alternates: { canonical: guide.path },
};

export default function Page() {
  return <GuidePage guide={guide} />;
}
