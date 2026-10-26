// Premade avatars. A brand picks one, it is copied into their Characters list, and the same face is reused in every ad.
// Distinctness comes from `features` (traits visible in a neutral front shot) and `look` (photo detail).
// buildPortraitPrompt only reads description and profile, so append `look` to the description when generating portraits.
// Do not end `features` or `vibe` with a period: the prompt builder adds one.

import { ProfileSchema, type CharacterProfile } from "@/lib/prompts/profile";

export type AvatarDef = {
  slug: string;
  name: string;
  gender: "woman" | "man";
  niches: string[];
  tagline: string;
  description: string;
  look: string;
  tone: string;
  profile: CharacterProfile;
};

export const AVATAR_NICHES = ["beauty", "fitness", "food", "fashion", "tech", "home", "wellness", "lifestyle"] as const;

// Shared realism text, used at the end of every look.
const REAL = "Visible pores, uneven skin tone, no retouching, no beauty filter, slight phone sensor grain.";

export const AVATARS: AvatarDef[] = [
  // Women
  {
    slug: "meera-beauty",
    name: "Meera",
    gender: "woman",
    niches: ["beauty", "lifestyle"],
    tagline: "Skincare nerd, honest reviewer",
    description:
      "Tamil woman in her mid 20s with warm brown skin, a soft oval face and long, loose black curls with frizz at the crown. She wears a tiny gold nose stud on the left and has a small beauty mark just below her left eye.",
    look: `Warm golden undertone, faint texture on the cheeks and a little shine on the nose. Curls slightly uneven, a few flyaways. Calm, direct gaze, lips relaxed. Soft window light from one side. ${REAL}`,
    tone: "Warm, ingredient-literate, tells you what did not work too",
    profile: {
      ageRange: "mid 20s", gender: "woman", skinTone: "brown", faceShape: "oval", eyes: "dark brown",
      hairColor: "black", hairLength: "long", hairStyle: "curly", build: "slim",
      features: "Tiny gold nose stud on the left, small beauty mark below the left eye, full natural brows",
      wardrobe: "Cotton kurtis and oversized tees, simple gold studs",
      vibe: "Quietly confident, the friend who actually reads labels",
    },
  },
  {
    slug: "ananya-fashion",
    name: "Ananya",
    gender: "woman",
    niches: ["fashion", "lifestyle"],
    tagline: "Delhi college girl, thrift and style",
    description:
      "North Indian woman in her early 20s with light skin, a heart shaped face with a pointed chin, and shoulder length dark brown wavy hair with curtain bangs. Thick straight eyebrows and a few faint acne marks along the jaw.",
    look: `Neutral to cool undertone, faint redness around the nose, two or three small healed acne marks on the jaw. Bangs a little separated. Young, alert expression. Daylight from a balcony. ${REAL}`,
    tone: "Fast, chatty, Hinglish, loves a styling hack",
    profile: {
      ageRange: "early 20s", gender: "woman", skinTone: "light", faceShape: "heart shaped", eyes: "brown",
      hairColor: "dark brown", hairLength: "shoulder length", hairStyle: "wavy", build: "slim",
      features: "Curtain bangs, thick straight eyebrows, faint acne marks along the jaw, small silver hoop in each ear",
      wardrobe: "Thrifted denim, baby tees, chunky sneakers, layered silver rings",
      vibe: "Playful Gen Z energy, always mid outfit change",
    },
  },
  {
    slug: "pema-fitness",
    name: "Pema",
    gender: "woman",
    niches: ["fitness", "tech", "lifestyle"],
    tagline: "Runs at dawn, tracks everything",
    description:
      "Sikkimese woman in her mid 20s with fair skin, a round face with full cheeks and monolid eyes, and a blunt chin length black bob. A small pale scar cuts through the outer end of her right eyebrow.",
    look: `Peachy undertone, a little natural flush on the cheeks, fine texture on the forehead. Bob slightly tousled, a few strands stuck to the temple. Bright, steady eyes. Cool morning light. ${REAL}`,
    tone: "Upbeat, concise, numbers and routines",
    profile: {
      ageRange: "mid 20s", gender: "woman", skinTone: "fair", faceShape: "round", eyes: "dark brown",
      hairColor: "black", hairLength: "chin length", hairStyle: "straight", build: "athletic",
      features: "Monolid eyes, small pale scar through the outer right eyebrow, blunt bob with no fringe",
      wardrobe: "Running tanks, light windbreakers, a smartwatch, caps",
      vibe: "Sporty and disciplined, easy grin",
    },
  },
  {
    slug: "ishita-food",
    name: "Ishita",
    gender: "woman",
    niches: ["food", "home"],
    tagline: "Home cook, Kolkata recipes, zero fuss",
    description:
      "Bengali woman in her late 20s with medium wheatish skin, a diamond shaped face with high cheekbones, and long black hair in a loose low bun. Large dark eyes lined with thin kohl and a small mole on the left side of her chin.",
    look: `Warm olive-wheat undertone, soft texture on the cheeks, faint darkness under the eyes. Loose strands falling from the bun. Gentle, amused expression. Kitchen window light. ${REAL}`,
    tone: "Homely, nostalgic, a bit of Bangla, generous with tips",
    profile: {
      ageRange: "late 20s", gender: "woman", skinTone: "medium", faceShape: "diamond", eyes: "dark brown",
      hairColor: "black", hairLength: "long", hairStyle: "in a bun", build: "curvy",
      features: "Thin kohl on the eyes, small mole on the left side of the chin, loose low bun with strands falling",
      wardrobe: "Handloom cotton saris and kurtas, a thin red thread on the wrist",
      vibe: "Warm and unhurried, feels like home",
    },
  },
  {
    slug: "kavya-wellness",
    name: "Kavya",
    gender: "woman",
    niches: ["wellness", "fitness"],
    tagline: "Yoga teacher, Kerala roots, calm energy",
    description:
      "Malayali woman in her early 30s with dark brown skin, a long face with a strong straight nose, and shoulder length black curly hair with natural frizz. She has a thin silver ring in her left nostril and strong, slightly arched brows.",
    look: `Deep warm undertone with a healthy sheen on the forehead, natural texture on the cheeks. Curls defined but frizzy at the ends. Serene, grounded expression. Soft daylight, slightly overcast. ${REAL}`,
    tone: "Calm, encouraging, practical breathwork and mobility tips",
    profile: {
      ageRange: "early 30s", gender: "woman", skinTone: "dark brown", faceShape: "long", eyes: "dark brown",
      hairColor: "black", hairLength: "shoulder length", hairStyle: "curly", build: "athletic",
      features: "Thin silver nose ring in the left nostril, strong straight nose, slightly arched thick brows",
      wardrobe: "Earth tone activewear, linen shirts, a simple black thread anklet",
      vibe: "Grounded and kind, never preachy",
    },
  },
  {
    slug: "nandini-home",
    name: "Nandini",
    gender: "woman",
    niches: ["home", "wellness", "food"],
    tagline: "Pune mom, practical home hacks",
    description:
      "Maharashtrian woman in her 40s with tan skin, a round face and shoulder length straight black hair with one natural grey streak at the left temple. She keeps reading glasses pushed up on her head and has faint pigmentation on her cheeks.",
    look: `Warm tan undertone with light melasma patches on the upper cheeks, fine lines at the eye corners. Hair tucked behind one ear. Knowing, patient expression. Soft living room daylight. ${REAL}`,
    tone: "Practical, reassuring, a mother who has tested everything",
    profile: {
      ageRange: "40s", gender: "woman", skinTone: "tan", faceShape: "round", eyes: "brown",
      hairColor: "black", hairLength: "shoulder length", hairStyle: "straight", build: "average",
      features: "Grey streak at the left temple, reading glasses pushed up on the head, faint cheek pigmentation",
      wardrobe: "Cotton kurtas with jeans, a thin mangalsutra, a simple steel watch",
      vibe: "Organised, warm, a little wry",
    },
  },
  // Men
  {
    slug: "arjun-fitness",
    name: "Arjun",
    gender: "man",
    niches: ["fitness", "fashion"],
    tagline: "Gym regular, clean style, Delhi boy",
    description:
      "North Indian man in his mid 20s with light skin, a square jaw and short black wavy hair pushed back. Trimmed stubble and a faint thin scar through his left eyebrow.",
    look: `Warm light undertone, visible stubble texture, slight shine on the nose. Hair a little messy at the front. Confident, relaxed gaze, mouth slightly uneven at rest. Daylight near a window. ${REAL}`,
    tone: "Motivating, casual Hinglish, short punchy lines",
    profile: {
      ageRange: "mid 20s", gender: "man", skinTone: "light", faceShape: "square", eyes: "dark brown",
      hairColor: "black", hairLength: "short", hairStyle: "wavy", build: "athletic",
      features: "Faint scar through the left eyebrow, trimmed even stubble, slightly asymmetric mouth",
      wardrobe: "Fitted tees, joggers, plain overshirts, white sneakers",
      vibe: "Driven and easygoing",
    },
  },
  {
    slug: "karthik-tech",
    name: "Karthik",
    gender: "man",
    niches: ["tech", "lifestyle"],
    tagline: "Bengaluru engineer, explains gadgets simply",
    description:
      "Tamil man in his late 20s with dark brown skin, an oval face and short black curly hair. A full short beard, a small mole on his right cheek and thick black rectangular glasses.",
    look: `Deep warm undertone, natural texture on the forehead, beard slightly uneven at the cheeks. Glasses with a faint reflection. Friendly, thoughtful expression. Desk light and window light. ${REAL}`,
    tone: "Clear, friendly, explains like a patient senior",
    profile: {
      ageRange: "late 20s", gender: "man", skinTone: "dark brown", faceShape: "oval", eyes: "dark brown",
      hairColor: "black", hairLength: "short", hairStyle: "curly", build: "slim",
      features: "Thick black rectangular glasses, full short beard, small mole on the right cheek",
      wardrobe: "Plain tees, hoodies, chinos, a smartwatch",
      vibe: "Smart, humble, quietly funny",
    },
  },
  {
    slug: "rohan-fashion",
    name: "Rohan",
    gender: "man",
    niches: ["fashion", "lifestyle"],
    tagline: "Mumbai streetwear, always experimenting",
    description:
      "Mumbai man in his early 20s with medium skin, a round boyish face and chin length dark brown wavy hair tucked behind his ears. A thin moustache, a silver stud in his left ear and a small chickenpox mark on his forehead.",
    look: `Warm medium undertone, light texture on the cheeks, a couple of tiny marks on the forehead. Hair falling loose on one side. Easy, curious expression. Late afternoon daylight. ${REAL}`,
    tone: "Chill, witty, slang, trend aware",
    profile: {
      ageRange: "early 20s", gender: "man", skinTone: "medium", faceShape: "round", eyes: "brown",
      hairColor: "dark brown", hairLength: "chin length", hairStyle: "wavy", build: "average",
      features: "Chin length hair tucked behind the ears, thin moustache, silver stud in the left ear, small mark on the forehead",
      wardrobe: "Oversized shirts, cargo pants, layered chains, retro sneakers",
      vibe: "Creative and relaxed",
    },
  },
  {
    slug: "vikram-tech",
    name: "Vikram",
    gender: "man",
    niches: ["tech", "home", "wellness"],
    tagline: "Seasoned founder, buys once, buys right",
    description:
      "Rajasthani man in his 40s with tan skin, a square face and short black hair greying at the temples. A salt and pepper beard kept short and deep horizontal lines on his forehead.",
    look: `Warm tan undertone, weathered texture, forehead lines and crow's feet visible at rest. Grey mixed through the beard. Assured, measured expression. Soft office daylight. ${REAL}`,
    tone: "Measured, credible, value for money focus",
    profile: {
      ageRange: "40s", gender: "man", skinTone: "tan", faceShape: "square", eyes: "brown",
      hairColor: "black", hairLength: "short", hairStyle: "straight", build: "average",
      features: "Greying temples, short salt and pepper beard, deep forehead lines",
      wardrobe: "Crisp shirts, quarter zip sweaters, a leather strap watch",
      vibe: "Steady and trustworthy",
    },
  },
];

/** Returns a list of problems with the roster. Empty means it is valid. */
export function validateAvatars(list: AvatarDef[] = AVATARS): string[] {
  const problems: string[] = [];
  const niches = new Set<string>(AVATAR_NICHES);
  const seen = { slug: new Set<string>(), name: new Set<string>(), combo: new Map<string, string>() };

  if (list.length !== 10) problems.push(`Expected 10 avatars, got ${list.length}`);
  const women = list.filter((a) => a.gender === "woman").length;
  if (women !== 6 || list.length - women !== 4) problems.push(`Expected 6 women and 4 men, got ${women} and ${list.length - women}`);

  for (const a of list) {
    const id = a.slug || a.name;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(a.slug)) problems.push(`${id}: slug is not kebab-case`);
    const slug = a.slug.toLowerCase();
    const name = a.name.toLowerCase();
    if (seen.slug.has(slug)) problems.push(`${id}: duplicate slug`);
    if (seen.name.has(name)) problems.push(`${id}: duplicate name`);
    seen.slug.add(slug);
    seen.name.add(name);

    if (a.niches.length < 1 || a.niches.length > 3) problems.push(`${id}: needs 1 to 3 niches`);
    for (const n of a.niches) if (!niches.has(n)) problems.push(`${id}: unknown niche ${n}`);

    const words = a.tagline.trim().split(/\s+/).length;
    if (words < 4 || words > 8) problems.push(`${id}: tagline has ${words} words, needs 4 to 8`);
    if (a.look.length > 400) problems.push(`${id}: look is ${a.look.length} chars, max 400`);
    if (a.tone.length > 80) problems.push(`${id}: tone is ${a.tone.length} chars, max 80`);
    if (!a.description.trim()) problems.push(`${id}: description is empty`);

    const parsed = ProfileSchema.safeParse(a.profile);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) problems.push(`${id}: profile.${issue.path.join(".")} ${issue.message}`);
      continue;
    }
    const p = parsed.data;
    if (p.gender !== a.gender) problems.push(`${id}: profile gender does not match`);
    for (const f of ["ageRange", "skinTone", "faceShape", "eyes", "hairColor", "hairLength", "hairStyle", "build", "features", "wardrobe", "vibe"] as const) {
      if (!p[f]) problems.push(`${id}: profile.${f} is empty`);
    }
    if (/\.\s*$/.test(p.features) || /\.\s*$/.test(p.vibe)) problems.push(`${id}: features and vibe must not end with a period`);

    // No two people of the same gender share face shape, skin tone, age and hair.
    const combo = [a.gender, p.faceShape, p.skinTone, p.ageRange, p.hairLength, p.hairStyle].join("|");
    const other = seen.combo.get(combo);
    if (other) problems.push(`${id}: same face, skin, age and hair as ${other}`);
    seen.combo.set(combo, id);
  }
  return problems;
}
