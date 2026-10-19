import type { Metadata } from "next";
import { GuidePage, type Guide } from "@/components/guide-page";

const guide: Guide = {
  path: "/consistent-character-ai",
  name: "Consistent character AI",
  h1: "Consistent character AI: the same face in every image and video",
  intro:
    "Most AI image tools give you a new face each time. Sparebar keeps one. Save a character once, with reference photos, a look profile, extra angles and outfits, and every photo, ad and video you make starts from that same person. The examples on this page are all real output from the app.",
  sections: [
    {
      h: "Why faces change between generations",
      p: [
        "Image and video models start from noise and a prompt. Without a reference, even a very detailed description gives a different person on each run. The hair is close, the face is not, and a feed made of those pictures looks like five different people.",
        "Reference photos give the model the real face to follow. That is the whole idea behind a saved character: the face comes from photos, and your prompt only describes the scene.",
      ],
    },
    {
      h: "Meet Tara",
      p: [
        "Tara is one character, made from a short description and three portraits. Everything below is a different scene, outfit and light, made with the same saved character and nothing else changed between runs.",
      ],
      media: [
        { src: "tara-cafe", alt: "Tara at a cafe table with an iced coffee", caption: "Cafe, iced coffee" },
        { src: "tara-saree", alt: "Tara in a grey saree on a rainy balcony", caption: "Monsoon saree on a balcony" },
        { src: "tara-rain", alt: "Tara taking a selfie in the rain", caption: "Rain selfie" },
        { src: "tara-skincare", alt: "Tara applying skincare in a bathroom mirror", caption: "Skincare at the mirror" },
        { src: "tara-night", alt: "Tara in front of city lights at night", caption: "A night out" },
        { src: "tara-cafe-2", alt: "Tara resting her chin on her hand at a cafe", caption: "Coffee break" },
        { src: "tara-yoga", alt: "Tara stretching on a yoga mat at home", caption: "Yoga at home" },
        { src: "tara-closeup", alt: "Close up portrait of Tara", caption: "Close up" },
      ],
      cols: 4,
      after: [
        "Look at the face, not the background: the shape of the eyes, the brows, the nose, the jaw and the way the hair falls. Those hold from the cafe to the rain to the city at night.",
      ],
    },
    {
      h: "What a character is made of",
      p: ["A character in Sparebar is a saved set of things that are sent to the model together with your scene."],
      list: [
        "Reference photos. Up to three clear photos of the same person, or a portrait generated from a description. This is what carries the face.",
        "A look profile. Gender, age range, skin tone, hair length, colour and style, features such as earrings or a nose pin, and everyday wardrobe. These fill the gaps a photo cannot, and they are repeated in every prompt.",
        "Extra angles. One button adds a three quarter and a full body shot of the same person. Close ups use the front shot, outfit shots use the full body one.",
        "Saved outfits. A name, a description and an optional photo, so the same jacket or saree can appear again later.",
        "Niche and tone of voice. These shape the captions Sparebar writes for the character.",
      ],
    },
    {
      h: "Same character, four different products",
      p: [
        "Consistency matters most in ads, where a viewer decides in a second whether a person looks real. Here is Tara in four ads for four unrelated products: a serum, a water bottle, a coffee pouch and a lip tint. The product, scene, outfit and headline change every time. Her face does not.",
      ],
      media: [
        { src: "ad-serum", alt: "Ad: Tara holding a vitamin C serum", caption: "Serum ad, headline in the image" },
        { src: "ad-bottle", alt: "Ad: Tara walking with a blue water bottle", caption: "Offer ad, street at golden hour", ratio: "photo" },
        { src: "ad-coffee", alt: "Ad: Tara holding a coffee pouch", caption: "Editorial ad, kitchen morning light", ratio: "photo" },
        { src: "tara-lip-tint", alt: "Video ad: Tara applying a lip tint and talking to the camera", caption: "Video ad, she speaks to the camera", ratio: "portrait", video: true },
      ],
      cols: 4,
      after: ["Read more about how these are made on the product ads page."],
    },
    {
      h: "A second character, built the same way",
      p: [
        "Nothing here is special to Tara. Riya has wavy brown hair and a different face, and she holds together across a balcony, a cafe and a bedroom in the same way. You can keep as many characters as you like and switch between them in one click.",
      ],
      media: [
        { src: "riya-balcony", alt: "Riya drinking tea on a balcony", caption: "Balcony, morning tea", ratio: "portrait" },
        { src: "riya-cafe", alt: "Riya at a cafe with a cold coffee", caption: "Cafe, cold coffee", ratio: "portrait" },
        { src: "riya-morning", alt: "Riya sitting on her bed in the morning", caption: "A slow morning", ratio: "portrait" },
      ],
      cols: 3,
    },
    {
      h: "Different people, different looks",
      p: ["Meera and Kabir. A man and a woman, different ages and skin tones, from the same flow: describe, pick a portrait, save."],
      media: [
        { src: "meera", alt: "Portrait of Meera", caption: "Meera", ratio: "portrait" },
        { src: "kabir", alt: "Portrait of Kabir", caption: "Kabir", ratio: "portrait" },
      ],
      cols: 2,
    },
    {
      h: "Consistency in video",
      p: [
        "Video models that accept an image start from your character photo, so the person in the clip is the person in your library. For talking videos Sparebar makes the still first, in the same scene, and then animates it. That keeps the face and the setting steady from the first frame.",
      ],
      list: [
        "Talking head tip: she speaks a line you type.",
        "Product pitch: she holds a saved product and talks about it.",
        "Day in my life: a short, moving moment from a routine.",
      ],
    },
    {
      h: "What you can change without losing the face",
      p: ["This is the useful part. Almost everything about a shot is yours to change, and the character stays put."],
      list: [
        "Scene and place: a cafe, a street, a bathroom, a balcony in the rain.",
        "Outfit: type it, or use a saved outfit.",
        "Product: pick a saved product with its photo and label.",
        "Photo or video, shape (9:16, 4:5, 1:1, 16:9), resolution and length.",
        "The model: a fast one for tests and a stronger one for the final.",
        "The words: the headline on an ad, or the line she says out loud.",
      ],
    },
    {
      h: "Tips for better consistency",
      p: ["Faces stay very close, not pixel identical. Models differ, and a few simple habits help a lot."],
      list: [
        "Use sharp, well lit photos that show the face from the front, then add the angles.",
        "Keep the scene description about the scene. Let the photos carry the face.",
        "Fill in the look profile. It repeats the details a photo cannot show.",
        "Use a stronger model for hero shots. Seedance 2.0, Veo 3.1 and Nano Banana Pro follow references closely.",
        "Close ups and busy scenes drift the most. If a run drifts, run it again, it is cheap, and your credits are refunded when a generation fails.",
        "Some video models refuse photos of real people. If one does, try another model.",
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
      a: "Sparebar accepts up to three photos per character. One clear photo works, and more angles help. You can also add side and full body shots from inside the app.",
    },
    {
      q: "Is the face exactly the same every time?",
      a: "It is very close, and it holds across scenes, outfits and products, but AI models are not pixel exact. Strong models, good reference photos and a filled in look profile get the best results, and you can re run a shot that drifts.",
    },
    {
      q: "Does it work for video too?",
      a: "Yes. Video models that accept an image start from your character photo, so the person in the clip matches. Talking videos make a matching still first and then animate it.",
    },
    {
      q: "Can I make a character without photos?",
      a: "Yes. Describe the person and Sparebar generates a portrait, or three to choose from, for a small credit cost, then saves it as the character.",
    },
    {
      q: "Can I keep the same outfit or product across shots?",
      a: "Yes. Save an outfit with a description or a photo, and save a product with its photo and label. Both are sent to the model with your scene.",
    },
  ],
};

export const metadata: Metadata = {
  title: "Consistent character AI: the same face in every image and video",
  description:
    "See one AI character in a cafe, in the rain, in four ads and in a talking video, with the same face every time. Save a character in Sparebar and reuse it with Seedance, Veo, Nano Banana and more.",
  alternates: { canonical: guide.path },
};

export default function Page() {
  return <GuidePage guide={guide} />;
}
