import type { Metadata } from "next";
import { GuidePage, type Guide } from "@/components/guide-page";

const guide: Guide = {
  path: "/ai-product-ads",
  name: "AI product ads",
  h1: "AI product ads with a character who looks the same every time",
  intro:
    "Pick a character, pick a product, and get a finished ad: a person holding your product, in a real looking scene, with the headline, offer and button already designed into the picture. Here are four ads for four products, all with the same character, all made in Sparebar.",
  sections: [
    {
      h: "Four products, one character",
      p: [
        "A serum, a water bottle, a coffee pouch and a lip tint. Different scenes, outfits, light and layouts. The person is the same in all four, which is what makes a set of ads feel like one brand or one creator.",
      ],
      media: [
        { src: "ad-serum", alt: "Ad: Tara holding a vitamin C serum, headline Glow in 14 days", caption: "Skincare: clean headline and a shop button" },
        { src: "ad-bottle", alt: "Ad: Tara walking with a water bottle, 30 percent off this week only", caption: "Offer: a sale badge and a crossed out price", ratio: "photo" },
        { src: "ad-coffee", alt: "Ad: Tara holding a coffee pouch, headline Better beans", caption: "Editorial: a small caption and a serif headline", ratio: "photo" },
        { src: "tara-lip-tint", alt: "Video ad: Tara applying a lip tint and talking to the camera", caption: "Video: short caption style, with sound", ratio: "portrait", video: true },
      ],
      cols: 4,
    },
    {
      h: "How a product ad is made",
      p: ["It takes three choices. There is nothing to design by hand."],
      list: [
        "Choose the character. Her saved photos, look and outfits go with the shot.",
        "Choose the product. Save it once with a photo, a photo of its label and a one line pitch, and reuse it as often as you like.",
        "Choose an ad style or write your own scene in Studio. Say what to highlight, and add the words you want on the image.",
      ],
      after: ["Every run shows its cost before you start. If a generation fails, the credits come back to your balance automatically."],
    },
    {
      h: "The four ad styles",
      p: ["On the Ads page each style is one click, as a 4:5 image."],
      list: [
        "Hold it up: she holds the product next to her face, smiling, with the label facing the camera.",
        "Using it: the product in an everyday moment, clearly visible and readable.",
        "Showing it off: she presents it with both hands, centred and sharp.",
        "At home: a relaxed full body scene with the product close at hand.",
      ],
    },
    {
      h: "Putting your own words on the ad",
      p: [
        "In Studio you can describe the layout as well as the photo: where the headline goes, what the badge says, the button text. Keep the text short, put the exact words in quotes, and say that there should be no other text. A model that handles text well, such as Nano Banana Pro, gives the cleanest result.",
        "Check the spelling before you post. Image models are good at short headlines and sometimes get a word wrong. If one does, run the shot again or shorten the line.",
      ],
      list: [
        "Headline: three to five words.",
        "One badge or one price line, not both with a paragraph.",
        "A short button label such as Shop now.",
        "Ask for plenty of empty space where the text sits so it stays easy to read.",
      ],
    },
    {
      h: "Product videos",
      p: [
        "Video models do not accept a product photo directly. For a product video Sparebar first makes a photo of your character with the product, then animates that photo into a clip. You choose the model, the length and what she says, and the cost of both steps is shown together.",
        "Talking videos let her say a line you write. The lip tint ad above is a short example with her own voice.",
      ],
    },
    {
      h: "Keeping the product looking right",
      p: [
        "Sparebar sends your saved product photo and label photo to the model with the scene. Simple products with a clear shape and a plain label come out the most reliably. For small print on packaging, add a clear label photo, and check the first result before you make a whole set.",
      ],
    },
    {
      h: "Everything you can tune",
      p: [],
      list: [
        "The character, outfit and place.",
        "The product and what to highlight about it.",
        "The headline, offer and button.",
        "Photo or video, the shape of the ad, resolution and length.",
        "The model, from fast and cheap to the sharpest.",
        "A caption and hashtags in the character's voice, written in one click.",
      ],
    },
  ],
  faq: [
    {
      q: "Can I use these ads commercially?",
      a: "You keep the rights you have in what is generated for you, so you can use it in your own marketing. You are still responsible for having the right to the products and brands you show, and the terms do not allow content that infringes someone else's rights or shows a real person without consent.",
    },
    {
      q: "Does the character stay the same across ads?",
      a: "Yes, that is the point of a saved character. The face stays very close across products, scenes and outfits.",
    },
    {
      q: "Is the text on the ad real?",
      a: "It is generated as part of the image, from the words you give. Short lines are reliable. Always read it before posting, and run the shot again if a word is off.",
    },
    {
      q: "How many ads can I make?",
      a: "As many as your credits allow. Each model shows its credit cost before you run it, and failed runs are refunded.",
    },
  ],
};

export const metadata: Metadata = {
  title: "AI product ads with a consistent character",
  description:
    "Make product ads with one AI character across serums, bottles, food and beauty, with the headline and offer designed in. See four real ads and a talking video made in Sparebar.",
  alternates: { canonical: guide.path },
};

export default function Page() {
  return <GuidePage guide={guide} />;
}
