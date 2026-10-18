import { FREE_TIER } from "@/config/free-tier";

// Shown on the home page and repeated as structured data and in llms.txt, so every copy says the same thing.
export const FAQ = [
  {
    q: "What is Sparebar?",
    a: "Sparebar (sparebar.xyz, spelled S-P-A-R-E-B-A-R) is an AI UGC image and video generator. You create a character once from photos or a description, then make photos and videos of that same person in any scene you can describe.",
  },
  {
    q: "What is a credit?",
    a: `Credits pay for generations. Each model shows its cost before you run it. An image on the lowest tier costs 2 credits. You get ${FREE_TIER.credits} free credits on signup, enough for one image. They work for images only and expire in ${FREE_TIER.expiresDays} days.`,
  },
  {
    q: "What if a generation fails?",
    a: "The credits come back to your balance automatically. You do not need to ask.",
  },
  {
    q: "Can I use photos of real people?",
    a: "Only with their permission. The terms do not allow content that shows a real person without consent, or that is meant to deceive others about who someone is.",
  },
  {
    q: "Do credits expire?",
    a: "Credits you buy do not expire. Free credits do.",
  },
  {
    q: "How do I pay?",
    a: "By card. Prices are in US dollars. If you pay from India you are charged in rupees, with GST added where it applies, and every payment comes with an invoice.",
  },
  {
    q: "Who sees my photos?",
    a: "Your photos are used to make what you ask for and are sent to the model provider you choose for that. The privacy policy lists who processes your data.",
  },
] as const;
