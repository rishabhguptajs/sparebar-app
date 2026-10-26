// The image model the app starts people on. GPT Image 2 gives the most natural faces but is not free eligible,
// so someone who only has free credits (or too few paid ones) stays on Qwen Image 3, which free credits work on.
export const PREFERRED_IMAGE_MODEL = "gpt-image-2";
export const FALLBACK_IMAGE_MODEL = "qwen-image-3";

type Option = { key: string; credits: number; available: number; paused: boolean };

/** The model key to start on for a run that needs `runs` images, given what the user can spend on each model. */
export function preferredImageModel(models: Option[], runs = 1): string {
  const best = models.find((m) => m.key === PREFERRED_IMAGE_MODEL);
  return best && !best.paused && best.available >= best.credits * runs ? best.key : FALLBACK_IMAGE_MODEL;
}
