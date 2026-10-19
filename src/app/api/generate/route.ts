import { NextResponse } from "next/server";
import { z } from "zod";
import { characterPrompt, loadReferences, type CharacterRow } from "@/lib/characters";
import { getModel } from "@/config/models";
import { getTemplate } from "@/config/templates";
import { getObjectBytes } from "@/lib/r2";
import { startJob, UserFacingError, type JobRow } from "@/lib/jobs/run";
import { presentJob } from "@/lib/jobs/present";
import { buildAnimatePrompt, buildProductPrompt } from "@/lib/prompts/build";
import { createClient, getUser } from "@/lib/supabase/server";

// Image models answer inside this request. Video returns at once with status "running".
export const maxDuration = 60;

const Body = z
  .object({
    modelKey: z.string().min(1),
    /** A prompt written in the studio. Templates send templateId and blanks instead. */
    prompt: z.string().trim().min(1).max(4000).optional(),
    templateId: z.string().max(40).optional(),
    blanks: z.record(z.string().max(40), z.string().max(300)).optional(),
    /** With a video template: make the still the clip would start from, as a photo. */
    asStill: z.boolean().optional(),
    /** What the character wears in this post, in words. */
    outfit: z.string().trim().max(200).optional(),
    /** A saved outfit of the character. */
    outfitId: z.string().uuid().optional(),
    aspectRatio: z.enum(["1:1", "9:16", "16:9", "4:5", "3:4", "4:3"]).optional(),
    resolution: z.string().max(10).optional(),
    seconds: z.number().int().min(1).max(60).optional(),
    characterId: z.string().uuid().optional(),
    /** A product photo uploaded through /api/uploads/product, for this generation only. */
    productKey: z.string().max(200).optional(),
    /** A saved product with its own photos. */
    productId: z.string().uuid().optional(),
    /** Animate an approved still: the still is sent as the opening frame. */
    sourceJobId: z.string().uuid().optional(),
    motion: z.string().trim().max(600).optional(),
    line: z.string().trim().max(400).optional(),
  })
  .refine((b) => b.prompt || b.templateId || b.sourceJobId, "Add a prompt.");

type Db = Awaited<ReturnType<typeof createClient>>;

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to generate." }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const body = parsed.data;

  try {
    const model = getModel(body.modelKey);
    if (!model) throw new UserFacingError("This model is not available.");
    const supabase = await createClient();
    const job = body.sourceJobId ? await animate(supabase, body, user.id) : await create(supabase, body, user.id);
    return NextResponse.json({ job: await presentJob(job) });
  } catch (e) {
    if (e instanceof UserFacingError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("generate failed", e);
    return NextResponse.json({ error: "Something went wrong. Your credits were not used." }, { status: 500 });
  }
}

const PRODUCT_KEY = (userId: string) => new RegExp(`^u/${userId}/products/[0-9a-f-]{36}\\.(png|jpg|webp)$`);

/** A normal generation: a studio prompt or a template, with or without a character, outfit and product. */
async function create(supabase: Db, body: z.infer<typeof Body>, userId: string): Promise<JobRow> {
  const model = getModel(body.modelKey)!;
  const template = body.templateId ? getTemplate(body.templateId) : undefined;
  if (body.templateId && !template) throw new UserFacingError("That post type is not available.", 404);

  let character: CharacterRow | undefined;
  if (body.characterId) {
    const { data } = await supabase.from("characters").select("*").eq("id", body.characterId).is("deleted_at", null).maybeSingle();
    if (!data) throw new UserFacingError("That character is no longer available.", 404);
    character = data as CharacterRow;
  }
  if (template && !character) throw new UserFacingError("Pick an influencer first.");

  let scene = body.prompt ?? "";
  let aspectRatio = body.aspectRatio;
  if (template && character) {
    const wantsStill = !!body.asStill && !!template.stillScene;
    if (body.asStill && !template.stillScene) throw new UserFacingError("That post type has no still.");
    if (model.kind !== (wantsStill ? "image" : template.kind)) throw new UserFacingError(wantsStill ? "A still needs an image model." : `Pick a ${template.kind} model for this post type.`);
    scene = (wantsStill ? template.stillScene! : template.scene)(body.blanks ?? {}, character.name);
    aspectRatio ??= template.aspectRatio;
  }

  // Saved outfit
  let outfitText = body.outfit;
  let outfitKey: string | null = null;
  if (body.outfitId) {
    if (!character) throw new UserFacingError("Pick a character to use a saved outfit.");
    const { data } = await supabase.from("outfits").select("*").eq("id", body.outfitId).eq("character_id", character.id).is("deleted_at", null).maybeSingle();
    if (!data) throw new UserFacingError("That outfit is no longer available.", 404);
    const o = data as { name: string; description: string; photo_key: string | null };
    outfitText ||= o.description || o.name;
    outfitKey = o.photo_key;
  }

  // Product: a saved kit or one photo for this run
  let productKeys: string[] = [];
  let product: { name?: string; pitch?: string } | undefined;
  if (body.productId) {
    const { data } = await supabase.from("products").select("*").eq("id", body.productId).is("deleted_at", null).maybeSingle();
    if (!data) throw new UserFacingError("That product is no longer available.", 404);
    const p = data as { name: string; pitch: string; photo_keys: string[]; label_key: string | null };
    productKeys = [p.photo_keys[0], p.label_key].filter((k): k is string => !!k);
    product = { name: p.name, pitch: p.pitch };
  } else if (body.productKey) {
    if (!PRODUCT_KEY(userId).test(body.productKey)) throw new UserFacingError("Invalid product photo.");
    productKeys = [body.productKey];
  }
  if (model.kind === "video" && (productKeys.length > 0 || outfitKey)) {
    throw new UserFacingError("A video starts from one photo. Make a still with the product or outfit first, then animate it.");
  }

  let refs;
  try {
    refs = await loadReferences({ character, modelKey: model.key, framing: template?.framing, outfitKey, productKeys });
  } catch (e) {
    if (e instanceof Error && /reference photo/.test(e.message)) throw new UserFacingError(e.message);
    throw e;
  }

  let built: { text: string; version: string };
  if (character) {
    built = characterPrompt(character, { scene, modelKey: model.key, outfit: outfitText, use: refs.use, product });
  } else {
    built = buildProductPrompt({ scene, photos: refs.use.product, product });
  }

  return startJob({
    userId,
    modelKey: body.modelKey,
    prompt: scene,
    providerPrompt: built.text,
    aspectRatio,
    resolution: body.resolution,
    seconds: body.seconds,
    characterId: character?.id,
    references: refs.images.length ? refs.images : undefined,
    promptVersion: built.version,
    referenceKeys: refs.keys,
    meta: {
      ...(template ? { templateId: template.id } : {}),
      ...(body.asStill ? { still: true } : {}),
      ...(outfitText ? { outfit: outfitText } : {}),
      ...(refs.use.product > 0 ? { hasProduct: true } : {}),
      ...(body.productId ? { productId: body.productId } : {}),
      ...(body.outfitId ? { outfitId: body.outfitId } : {}),
    },
  });
}

/** Turn an approved still into a clip. The still is the opening frame, so the person and product stay as approved. */
async function animate(supabase: Db, body: z.infer<typeof Body>, userId: string): Promise<JobRow> {
  const model = getModel(body.modelKey)!;
  if (model.kind !== "video") throw new UserFacingError("Pick a video model to animate a photo.");
  const { data } = await supabase.from("jobs").select("*").eq("id", body.sourceJobId!).is("deleted_at", null).maybeSingle();
  const source = data as JobRow | null;
  if (!source || source.user_id !== userId) throw new UserFacingError("That photo is no longer available.", 404);
  if (source.kind !== "image" || source.status !== "succeeded" || !source.outputs[0]) throw new UserFacingError("Only a finished photo can be animated.");
  const ratio = (source.params as { aspectRatio?: string } | null)?.aspectRatio;
  if (ratio !== "9:16" && ratio !== "16:9") throw new UserFacingError("Video models take 9:16 or 16:9. Make the photo in one of those shapes to animate it.");

  let name = "The person";
  if (source.character_id) {
    const { data: c } = await supabase.from("characters").select("name").eq("id", source.character_id).maybeSingle();
    if (c) name = (c as { name: string }).name;
  }
  const frame = await getObjectBytes(source.outputs[0].key);
  const hasProduct = !!(source.params as { hasProduct?: boolean } | null)?.hasProduct;
  const built = buildAnimatePrompt({ name, motion: body.motion ?? "", line: body.line, hasProduct });
  const human = (body.motion?.trim() || `Animated: ${source.prompt}`).slice(0, 4000);

  return startJob({
    userId,
    modelKey: body.modelKey,
    prompt: human,
    providerPrompt: built.text,
    aspectRatio: ratio,
    resolution: body.resolution,
    seconds: body.seconds,
    characterId: source.character_id ?? undefined,
    references: [{ mime: frame.mime, base64: Buffer.from(frame.bytes).toString("base64") }],
    promptVersion: built.version,
    referenceKeys: [source.outputs[0].key],
    meta: { sourceJobId: source.id, ...(hasProduct ? { hasProduct: true } : {}) },
  });
}
