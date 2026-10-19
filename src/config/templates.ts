// Post types for the guided creator. A template is data: a scene written around a few blanks the user fills in.
// Adding one is an edit here. Prompt text around the scene (identity, outfit, rules) is added in src/lib/prompts.

import type { Framing } from "@/lib/prompts/refs";

export type Blank = { key: string; label: string; placeholder: string; optional?: boolean };

export type Template = {
  id: string;
  title: string;
  blurb: string;
  kind: "image" | "video";
  aspectRatio: "9:16" | "1:1" | "4:5" | "16:9";
  /** Model offered first. The user can switch to another model of the same kind. */
  modelKey: string;
  /** Takes an optional product photo. */
  product?: boolean;
  /** How much of the person is in frame. Decides which reference photo of them goes first. */
  framing: Framing;
  blanks: Blank[];
  scene: (v: Record<string, string>, name: string) => string;
  /** Videos only. The still the clip starts from: the same moment as a photo, before anything moves. */
  stillScene?: (v: Record<string, string>, name: string) => string;
  /** Videos only. What happens once the still is animated. */
  motion?: (v: Record<string, string>, name: string) => string;
  /** Videos only. Key of the blank holding the line the character says out loud. */
  speechKey?: string;
};

const v = (x: string | undefined, fallback: string) => (x?.trim() ? x.trim() : fallback);

export const TEMPLATES: Template[] = [
  {
    id: "grwm",
    title: "Get ready with me",
    blurb: "Mirror selfie while getting ready.",
    kind: "image",
    aspectRatio: "9:16",
    framing: "half",
    modelKey: "nano-banana-2.1",
    blanks: [
      { key: "outfit", label: "Outfit or occasion", placeholder: "Linen shirt and jeans, brunch with friends", optional: true },
      { key: "room", label: "Where", placeholder: "Bright bedroom with a full length mirror", optional: true },
    ],
    scene: (b) =>
      `Mirror selfie, phone in hand, getting ready. Wearing: ${v(b.outfit, "a casual everyday outfit")}. Place: ${v(b.room, "a bright bedroom with a full length mirror")}. Natural window light, candid, shot on a phone.`,
  },
  {
    id: "product-review",
    title: "Product review",
    blurb: "Holds a product up and shows it to the camera.",
    kind: "image",
    aspectRatio: "9:16",
    framing: "close",
    modelKey: "nano-banana-2.1",
    product: true,
    blanks: [
      { key: "product", label: "Product", placeholder: "Vitamin C face serum in a small glass bottle" },
      { key: "setting", label: "Setting", placeholder: "Bathroom counter, morning light", optional: true },
    ],
    scene: (b) =>
      `Holding up ${v(b.product, "the product")} toward the camera with a genuine smile, product clearly visible and label facing the camera. Setting: ${v(b.setting, "a tidy home with soft natural light")}. Handheld phone video still, authentic UGC style.`,
  },
  {
    id: "unboxing",
    title: "Unboxing",
    blurb: "Opening a package, excited reaction.",
    kind: "image",
    aspectRatio: "9:16",
    framing: "half",
    modelKey: "nano-banana-2.1",
    product: true,
    blanks: [
      { key: "product", label: "What is in the box", placeholder: "A pair of white sneakers", optional: true },
      { key: "setting", label: "Setting", placeholder: "Living room floor, cardboard box open", optional: true },
    ],
    scene: (b) =>
      `Unboxing: opening a package, ${v(b.product, "a new product")} just revealed, excited surprised expression. Setting: ${v(b.setting, "a cosy living room")}. Candid phone photo, warm light.`,
  },
  {
    id: "skincare",
    title: "Skincare routine",
    blurb: "Close, calm bathroom routine shot.",
    kind: "image",
    aspectRatio: "4:5",
    framing: "close",
    modelKey: "nano-banana-2.1",
    product: true,
    blanks: [{ key: "product", label: "Product", placeholder: "Moisturiser in a white jar", optional: true }],
    scene: (b) =>
      `Skincare routine in a bright bathroom, applying ${v(b.product, "a moisturiser")} to the cheek, hair tied back, soft skin, relaxed expression. Clean counter, morning light, phone photo.`,
  },
  {
    id: "ootd",
    title: "Outfit of the day",
    blurb: "Full body outfit shot outdoors.",
    kind: "image",
    aspectRatio: "4:5",
    framing: "full",
    modelKey: "nano-banana-2.1",
    blanks: [
      { key: "outfit", label: "Outfit", placeholder: "Oversized blazer, white tee, wide leg trousers", optional: true },
      { key: "place", label: "Place", placeholder: "City street, golden hour", optional: true },
    ],
    scene: (b) =>
      `Full body outfit of the day photo. Outfit: ${v(b.outfit, "a stylish casual outfit")}. Place: ${v(b.place, "a city street at golden hour")}. Walking pose, candid, natural light.`,
  },
  {
    id: "cafe",
    title: "Coffee shop lifestyle",
    blurb: "Relaxed shot at a table with a drink.",
    kind: "image",
    aspectRatio: "1:1",
    framing: "half",
    modelKey: "nano-banana-2.1",
    blanks: [{ key: "mood", label: "Mood", placeholder: "Reading a book, rainy day", optional: true }],
    scene: (b) => `Sitting at a small table in a coffee shop with a latte. Mood: ${v(b.mood, "relaxed, cosy afternoon")}. Soft window light, candid lifestyle photo.`,
  },
  {
    id: "talking-tip",
    title: "Talking head tip",
    blurb: "Speaks to the camera with a quick tip.",
    kind: "video",
    aspectRatio: "9:16",
    framing: "close",
    modelKey: "veo-3.1-lite",
    blanks: [
      { key: "line", label: "What they say", placeholder: "Three tips for a calmer morning. Number one: no phone for the first ten minutes." },
      { key: "setting", label: "Setting", placeholder: "Sitting on a sofa, plant behind", optional: true },
    ],
    scene: (b, name) =>
      `${name} speaks directly to the camera in a selfie style video, natural expressions, steady handheld framing. Setting: ${v(b.setting, "a bright living room")}. ${name} says: "${v(b.line, "Here is a quick tip that changed my mornings.")}"`,
    stillScene: (b, name) =>
      `${name} looking straight at the camera, about to speak, selfie style framing at arm's length. Setting: ${v(b.setting, "a bright living room")}. Natural expression, soft light, shot on a phone.`,
    motion: () => "Speaks directly to the camera in a selfie style video, natural expressions, steady handheld framing.",
    speechKey: "line",
  },
  {
    id: "product-pitch",
    title: "Product pitch",
    blurb: "Shows a product and says why they like it.",
    kind: "video",
    aspectRatio: "9:16",
    framing: "close",
    modelKey: "veo-3.1-lite",
    product: true,
    blanks: [
      { key: "product", label: "Product", placeholder: "A reusable water bottle" },
      { key: "line", label: "What they say", placeholder: "I have used this every day for a month and I am not going back." },
    ],
    scene: (b, name) =>
      `${name} holds up ${v(b.product, "the product")} to the camera in a selfie style video and talks about it, smiling, natural handheld motion. ${name} says: "${v(b.line, "I have used this every day and love it.")}"`,
    stillScene: (b, name) =>
      `${name} holds up ${v(b.product, "the product")} toward the camera with a genuine smile, product clearly visible and label facing the camera, selfie style framing. Soft light, shot on a phone.`,
    motion: () => "Holds the product up to the camera and talks about it, smiling, natural handheld motion.",
    speechKey: "line",
  },
  {
    id: "day-in-life",
    title: "Day in my life clip",
    blurb: "A short moving moment from a daily routine.",
    kind: "video",
    aspectRatio: "9:16",
    framing: "half",
    modelKey: "veo-3.1-lite",
    blanks: [{ key: "moment", label: "Moment", placeholder: "Pouring coffee and opening the curtains", optional: true }],
    scene: (b, name) => `${name} in a short candid day in the life clip: ${v(b.moment, "making coffee in the morning")}. Natural movement, handheld phone footage, soft light.`,
    stillScene: (b, name) => `${name} in a candid day in the life moment: ${v(b.moment, "making coffee in the morning")}. Natural light, handheld phone photo.`,
    motion: (b) => `${v(b.moment, "Making coffee in the morning")}. Natural movement, handheld phone footage, soft light.`,
  },
];

export function getTemplate(id: string) {
  return TEMPLATES.find((t) => t.id === id);
}
