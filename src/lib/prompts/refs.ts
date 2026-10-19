// Which reference photos go with a generation, and in what order. Pure, so it can be tested.
// Order sent to the lab: the person first, then the outfit, then the product last.

export type RefTag = "photo" | "front" | "angle" | "full";
export type Framing = "close" | "half" | "full";

const PRIORITY: Record<Framing, RefTag[]> = {
  close: ["front", "photo", "angle", "full"],
  half: ["photo", "front", "angle", "full"],
  full: ["full", "photo", "front", "angle"],
};

export type RefPlan = {
  /** Indexes into the character's reference_keys, in the order to send. */
  character: number[];
  outfit: boolean;
  /** How many product photos are sent (the main one first, a label close up second). */
  product: number;
};

export function normaliseTag(t: string | undefined): RefTag {
  return t === "front" || t === "angle" || t === "full" ? t : "photo";
}

/**
 * Decide how many slots each kind of reference gets. The person always gets at least one, then the product,
 * then the outfit. A kind that does not fit is trimmed, and when even one photo of the person plus the requested
 * outfit or product cannot fit, it throws with a message the user can act on.
 */
export function planRefs(opts: { tags: string[]; framing: Framing; maxRefs: number; outfit: boolean; productPhotos: number; hasCharacter: boolean }): RefPlan {
  const { tags, framing, maxRefs } = opts;
  const order = tags
    .map((t, i) => ({ i, rank: PRIORITY[framing].indexOf(normaliseTag(t)) }))
    .sort((a, b) => a.rank - b.rank || a.i - b.i)
    .map((x) => x.i);

  const minPerson = opts.hasCharacter && tags.length > 0 ? 1 : 0;
  if (minPerson + (opts.outfit ? 1 : 0) + (opts.productPhotos > 0 ? 1 : 0) > maxRefs) {
    throw new Error(
      maxRefs === 1
        ? "This model takes one reference photo, so it cannot use a product photo or outfit together with your character. Pick another model."
        : `This model takes ${maxRefs} reference photos, which is not enough for your character, outfit and product together. Pick another model.`,
    );
  }
  const room = Math.max(0, maxRefs - minPerson);
  const outfit = opts.outfit && room >= 1;
  const product = Math.min(Math.min(opts.productPhotos, 2), room - (outfit ? 1 : 0));
  const personSlots = Math.min(order.length, maxRefs - (outfit ? 1 : 0) - product);
  return { character: order.slice(0, Math.max(personSlots, 0)), outfit, product };
}
