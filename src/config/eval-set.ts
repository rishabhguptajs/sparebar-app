// The consistency test set. Run it through scripts/consistency-eval.ts, then score the results with docs/consistency-scoring.md.
// Three characters x ten posts x each model under test. The point is to compare models on the same inputs, so keep these stable.
// A model earns `consistent: true` in model-meta.ts only after it scores well here.

export const EVAL_CHARACTERS = [
  { label: "A", profile: "Woman, 25 to 29, warm tan skin, oval face, dark brown eyes, long wavy black hair, slim build, small mole above the lip" },
  { label: "B", profile: "Man, 30 to 39, light skin, square jaw, green eyes, short brown hair with a beard, athletic build, round glasses" },
  { label: "C", profile: "Woman, 40 to 49, deep brown skin, round face, short natural curls, medium build, gold hoop earrings" },
] as const;

type Post = { templateId: string; asStill?: boolean; blanks: Record<string, string>; outfit?: string };

export const EVAL_POSTS: Post[] = [
  { templateId: "grwm", blanks: { outfit: "Linen shirt and jeans", room: "Bright bedroom with a full length mirror" } },
  { templateId: "grwm", blanks: {}, outfit: "Red evening dress" },
  { templateId: "product-review", blanks: { product: "Vitamin C face serum in a small glass bottle", setting: "Bathroom counter, morning light" } },
  { templateId: "unboxing", blanks: { product: "A pair of white sneakers", setting: "Living room floor" } },
  { templateId: "skincare", blanks: { product: "Moisturiser in a white jar" } },
  { templateId: "ootd", blanks: { outfit: "Oversized blazer, white tee, wide leg trousers", place: "City street, golden hour" } },
  { templateId: "cafe", blanks: { mood: "Reading a book, rainy day" } },
  { templateId: "talking-tip", asStill: true, blanks: { line: "Three tips for a calmer morning.", setting: "Sitting on a sofa, plant behind" } },
  { templateId: "product-pitch", asStill: true, blanks: { product: "A reusable water bottle", line: "I use this every day." } },
  { templateId: "day-in-life", asStill: true, blanks: { moment: "Pouring coffee and opening the curtains" } },
];

/** Image models to compare. Add or remove as the catalogue changes. */
export const EVAL_MODELS = ["nano-banana-2.1", "nano-banana-pro", "seedream-5-pro", "flux-3-image", "qwen-image-3"];
