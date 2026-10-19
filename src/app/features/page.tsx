import type { Metadata } from "next";
import { GuidePage, type Guide } from "@/components/guide-page";

const guide: Guide = {
  path: "/features",
  name: "Features",
  h1: "Every Sparebar feature, and what you can tune",
  intro:
    "Sparebar makes UGC style photos, ads and videos with a character you own. This page lists everything the app does, in the order you would use it, so you can see how much of a shot is in your hands.",
  sections: [
    {
      h: "Characters",
      p: [
        "A character is the person in your content. Make one from your own photos, or describe the look and let Sparebar generate a portrait, or three to choose from.",
      ],
      list: [
        "Up to three reference photos per character. Large phone photos are shrunk in your browser before upload.",
        "Photo advice before you save: blur, sunglasses or a second person in the frame are flagged with a tip.",
        "A look profile: gender, age range, skin tone, hair length, colour and style, features, wardrobe.",
        "Free text for anything else, plus niche and tone of voice.",
        "Edit later: change the look, swap photos, add angles and outfits.",
      ],
      media: [
        { src: "tara-closeup", alt: "Tara close up", caption: "Tara", ratio: "portrait" },
        { src: "riya-balcony", alt: "Riya on a balcony", caption: "Riya", ratio: "portrait" },
        { src: "meera", alt: "Portrait of Meera", caption: "Meera", ratio: "portrait" },
        { src: "kabir", alt: "Portrait of Kabir", caption: "Kabir", ratio: "portrait" },
      ],
      cols: 4,
    },
    {
      h: "Angles and outfits",
      p: [
        "A single front photo is enough to start. For stronger results add angles: one button creates a three quarter shot and a full body shot of the same person. Close ups use the front shot and outfit shots use the full body one.",
        "Outfits are saved looks with a name, a description and an optional photo, so a jacket, a saree or a work outfit can come back in later shots.",
      ],
    },
    {
      h: "Products",
      p: ["Save a product once and use it in images, ads and videos."],
      list: [
        "A product photo and a photo of its label.",
        "A one line pitch such as what it does for the customer.",
        "Pick it in Create, Ads or Studio. It is sent to the model with the scene.",
      ],
    },
    {
      h: "Create: guided post types",
      p: ["Pick a post type, fill in a few blanks and run it. The cost shows before you start."],
      list: [
        "Photos: Get ready with me, Product review, Unboxing, Skincare routine, Outfit of the day, Coffee shop lifestyle.",
        "Videos: Talking head tip, Product pitch, Day in my life clip.",
        "Shapes: 9:16 for stories and reels, 4:5 and 1:1 for feeds, 16:9 for wide video.",
        "Talking videos let you type the line she says out loud.",
      ],
      media: [
        { src: "tara-skincare", alt: "Skincare routine post", caption: "Skincare routine", ratio: "photo" },
        { src: "tara-cafe", alt: "Coffee shop lifestyle post", caption: "Coffee shop lifestyle", ratio: "photo" },
        { src: "tara-saree", alt: "Monsoon saree outfit post", caption: "Outfit of the day", ratio: "photo" },
      ],
      cols: 3,
    },
    {
      h: "Ads",
      p: ["Four one click product ad styles: Hold it up, Using it, Showing it off, At home. Add what to highlight and run it."],
      media: [
        { src: "ad-serum", alt: "Serum ad with a headline", caption: "Serum ad" },
        { src: "ad-bottle", alt: "Water bottle ad with a sale badge", caption: "Offer ad", ratio: "photo" },
        { src: "ad-coffee", alt: "Coffee pouch ad with a headline", caption: "Editorial ad", ratio: "photo" },
      ],
      cols: 3,
      after: ["See the full walk through on the product ads page."],
    },
    {
      h: "Studio",
      p: ["Studio is the free form tool. Describe anything and pick every setting yourself."],
      list: [
        "Choose the character, a product, the model, the shape, the resolution and the length.",
        "Write the prompt, including the layout and the words for an ad.",
        "Video with a product: Studio makes the product photo first, then animates it.",
        "Animate any finished vertical or wide photo into a video.",
        "Videos reach 30 seconds on the Wan 3.0 models. Most others make 4 to 15 seconds.",
      ],
      media: [{ src: "tara-lip-tint", alt: "Video ad: Tara applying a lip tint and talking", caption: "A talking video made in Studio", ratio: "portrait", video: true }],
      cols: 2,
    },
    {
      h: "Models",
      p: [
        "About fifty image and video models from the main labs, such as Nano Banana, Seedream, FLUX, Qwen, Veo, Seedance, Kling, Wan and Hailuo. Each has a fixed credit price that you see before you run it. Use a fast, cheap model to test an idea, then a stronger one for the final.",
        "If a lab is having trouble, its models show as paused for a short time instead of failing your run.",
      ],
    },
    {
      h: "Caption and hashtags",
      p: ["One click on a finished result writes a caption and hashtags in the character's voice. The answer is saved, so asking again for the same result is free."],
    },
    {
      h: "Library",
      p: ["Everything you make is saved in your library."],
      list: [
        "Filter by all, images or videos.",
        "Download any result.",
        "Run it again with a small change.",
        "Delete what you do not need.",
      ],
    },
    {
      h: "Credits, plans and refunds",
      p: [
        "You pay in credits and use them on any model. Failed generations are refunded to your balance automatically. Paid credits do not expire.",
      ],
      list: [
        "Free to start: 2 credits, enough for one image, with no card.",
        "Monthly plans: Starter, Creator and Studio.",
        "One time packs for topping up.",
        "Prices in dollars or rupees, with GST invoices for buyers in India.",
      ],
    },
  ],
  faq: [
    {
      q: "Do I need design or video skills?",
      a: "No. Post types and ad styles are one click, and Studio lets you describe anything in plain words.",
    },
    {
      q: "Can I use my own face?",
      a: "Only with your own permission or the permission of the person shown. The terms do not allow showing a real person without consent.",
    },
    {
      q: "Can I change a result after it is made?",
      a: "Run it again with a small change to the scene, the outfit or the words. Each run shows its cost before you start.",
    },
    {
      q: "What stays the same between shots?",
      a: "The character's face, look and saved outfits. Everything else, including the scene, product, shape and model, is yours to change.",
    },
  ],
};

export const metadata: Metadata = {
  title: "Sparebar features: characters, products, ads, video and models",
  description:
    "Every Sparebar feature in one place: consistent characters, angles and outfits, saved products, post types, ad styles, Studio, 50 models, captions and refunds.",
  alternates: { canonical: guide.path },
};

export default function Page() {
  return <GuidePage guide={guide} />;
}
