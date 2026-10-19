// How each model takes reference photos, read from what the adapters in src/lib/providers actually send.
//   multi        every reference goes to the model (OpenRouter and Google images)
//   single       only the first reference is used (xAI image edit)
//   first_frame  the first reference becomes the opening frame of the clip (every video adapter)
// Whether a given model really follows several references well is not confirmed without live runs.

import type { ModelConfig } from "@/config/models";

export type RefMode = "multi" | "single" | "first_frame";

/** Most reference photos sent with an image request. Unverified per model, so kept conservative. */
export const MAX_IMAGE_REFS = 3;

export function refsFor(model: Pick<ModelConfig, "kind" | "lab">): { mode: RefMode; maxRefs: number } {
  if (model.kind === "video") return { mode: "first_frame", maxRefs: 1 };
  if (model.lab === "xai") return { mode: "single", maxRefs: 1 };
  return { mode: "multi", maxRefs: MAX_IMAGE_REFS };
}
