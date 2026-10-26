import { describe, expect, it } from "vitest";
import { buildAnimatePrompt, buildCharacterPrompt, buildPortraitPrompt, identityLine, LEGACY_PROMPT_VERSION, PROMPT_VERSION } from "./build";
import { EMPTY_PROFILE, hasProfile, profileCompleteness, readProfile, type CharacterProfile } from "./profile";

// The text the app produced before the prompt layer, copied from src/lib/characters.ts and the generate route.
function legacy(description: string, scene: string, product = false) {
  const look = description.trim();
  const text = ["Keep the same person as in the reference photos, with the same face, hair and build.", look ? `Character details: ${look}` : null, `Scene: ${scene}`].filter(Boolean).join("\n");
  return product ? `${text}\nThe last reference image is the product. Show that exact product, unchanged, in the scene.` : text;
}

const maya: CharacterProfile = { ...EMPTY_PROFILE, gender: "woman", ageRange: "late 20s", skinTone: "brown", hairLength: "shoulder length", hairColor: "dark brown", hairStyle: "curly", features: "small gold hoops" };
const none = { character: 0, outfit: false, product: 0 };

describe("legacy characters keep the old text", () => {
  it("description only", () => {
    const r = buildCharacterPrompt({ character: { name: "Maya", description: "Late twenties, curls", profile: EMPTY_PROFILE }, scene: "At a cafe", mode: "multi", refs: { ...none, character: 3 } });
    expect(r.text).toBe(legacy("Late twenties, curls", "At a cafe"));
    expect(r.version).toBe(LEGACY_PROMPT_VERSION);
  });

  it("no description", () => {
    const r = buildCharacterPrompt({ character: { name: "Maya", description: "  ", profile: EMPTY_PROFILE }, scene: "At a cafe", mode: "multi", refs: none });
    expect(r.text).toBe(legacy("", "At a cafe"));
  });

  it("with one product photo on a multi reference model", () => {
    const r = buildCharacterPrompt({ character: { name: "Maya", description: "Curls", profile: EMPTY_PROFILE }, scene: "Holding it", mode: "multi", refs: { character: 2, outfit: false, product: 1 } });
    expect(r.text).toBe(legacy("Curls", "Holding it", true));
  });
});

describe("structured characters", () => {
  const base = { character: { name: "Maya", description: "", profile: maya }, scene: "At a cafe", mode: "multi" as const, refs: { ...none, character: 3 } };

  it("orders lead, identity, outfit, scene, rules", () => {
    const r = buildCharacterPrompt({ ...base, outfit: "Linen shirt" });
    const lines = r.text.split("\n");
    expect(lines[0]).toMatch(/^Keep the same person/);
    expect(lines[1]).toBe("Identity: Maya, woman, age late 20s, brown skin, shoulder length dark brown curly hair. Distinguishing features: small gold hoops.");
    expect(lines.indexOf("Outfit: Linen shirt")).toBeGreaterThan(1);
    expect(lines.indexOf("Scene: At a cafe")).toBeGreaterThan(lines.indexOf("Outfit: Linen shirt"));
    expect(lines.at(-1)).toBe("Do not change the face or add other people.");
    expect(r.version).toBe(PROMPT_VERSION);
  });

  it("tells the model not to add text or extra arms when a product is shown", () => {
    const r = buildCharacterPrompt({ ...base, product: { name: "Plora Calm" }, refs: { character: 1, outfit: false, product: 1 } });
    expect(r.text).toMatch(/Add no other text, captions, slogans or overlays/);
    expect(r.text).toMatch(/exactly two arms and two hands/);
  });

  it("uses the everyday style when a post sets no outfit", () => {
    const r = buildCharacterPrompt({ ...base, character: { ...base.character, profile: { ...maya, wardrobe: "Neutral knitwear" } } });
    expect(r.text).toContain("Outfit: Neutral knitwear");
  });

  it("words the lead sentence for the way the model takes references", () => {
    expect(buildCharacterPrompt({ ...base, mode: "single" }).text).toMatch(/^Edit the reference photo/);
    expect(buildCharacterPrompt({ ...base, mode: "first_frame" }).text).toMatch(/^The opening frame shows the person/);
  });

  it("explains the reference order when person, outfit and product are all attached", () => {
    const r = buildCharacterPrompt({ ...base, refs: { character: 1, outfit: true, product: 2 }, product: { name: "Glow serum", pitch: "A vitamin C serum" } });
    expect(r.text).toContain("Reference images: Image 1 shows the person; Image 2 shows the outfit to wear; Images 3 to 4 show the product.");
    expect(r.text).toContain("Product: Glow serum. A vitamin C serum.");
    expect(r.text).toContain("label readable");
    expect(r.text).toContain("Outfit: the outfit shown in the outfit reference image.");
    expect(r.text.split("\n").at(-1)).toMatch(/logo on the product/);
  });

  it("says nothing about references that are not attached", () => {
    expect(buildCharacterPrompt(base).text).not.toContain("Reference images:");
    expect(buildCharacterPrompt(base).text).not.toContain("product");
  });
});

describe("identityLine", () => {
  it("is empty for an empty profile", () => {
    expect(identityLine("Maya", EMPTY_PROFILE)).toBe("");
  });
  it("skips blanks", () => {
    expect(identityLine("Theo", { ...EMPTY_PROFILE, gender: "man", hairColor: "blonde" })).toBe("Identity: Theo, man, blonde hair.");
  });
});

describe("portrait prompts", () => {
  it("keeps the old portrait text for an old character", () => {
    const r = buildPortraitPrompt({ name: "Maya", description: "Late twenties, curls", profile: EMPTY_PROFILE });
    expect(r.text).toBe("Portrait photo for a character reference. Late twenties, curls. Face clearly visible, natural light, plain background, shot on a phone camera.");
    expect(r.version).toBe(LEGACY_PROMPT_VERSION);
  });
  it("uses the identity and angle for a structured one", () => {
    const r = buildPortraitPrompt({ name: "Maya", description: "", profile: maya, angle: "angle", fromReference: true });
    expect(r.text).toContain("Keep the same person as in the reference photos");
    expect(r.text).toContain("Identity: Maya");
    expect(r.text).toContain("Three quarter view");
  });
});

describe("animate prompt", () => {
  it("anchors on the frame and adds the spoken line", () => {
    const r = buildAnimatePrompt({ name: "Maya", motion: "Lifts the cup and smiles", line: "Best coffee in town", hasProduct: true });
    expect(r.text).toContain("Motion: Lifts the cup and smiles");
    expect(r.text).toContain('Maya says: "Best coffee in town"');
    expect(r.text).toContain("product shape and label");
  });
});

describe("profile", () => {
  it("reads missing or broken data as empty", () => {
    expect(readProfile(null)).toEqual(EMPTY_PROFILE);
    expect(readProfile({ skinTone: "not a tone" })).toEqual(EMPTY_PROFILE);
    expect(hasProfile(readProfile({ eyes: "green" }))).toBe(true);
  });
  it("counts filled option fields", () => {
    expect(profileCompleteness(maya)).toEqual({ filled: 6, total: 9 });
  });
});

describe("avatar prompt", () => {
  const base = { name: "Ananya", description: "North Indian woman in her early 20s.", look: "Faint redness around the nose.", profile: { ...maya, wardrobe: "Thrifted denim and baby tees", vibe: "Playful" }, niches: ["fashion"] };

  it("asks for a candid selfie in a real place, wearing their own clothes", async () => {
    const { buildAvatarPrompt } = await import("./build");
    const t = buildAvatarPrompt({ ...base, shot: "front" }).text;
    expect(t).toContain("selfie");
    expect(t).toContain("Thrifted denim and baby tees");
    expect(t).toContain("Setting:");
    expect(t).not.toMatch(/plain background|neutral expression/i);
    expect(t).toContain("No brand logos");
  });

  it("keeps the same clothes and place when made from the front shot", async () => {
    const { buildAvatarPrompt } = await import("./build");
    const t = buildAvatarPrompt({ ...base, shot: "full", fromReference: true }).text;
    expect(t).toContain("same face, hair, build, clothes and place");
    expect(t).toContain("Head to toe");
    expect(t).not.toContain("Setting:");
  });
});
