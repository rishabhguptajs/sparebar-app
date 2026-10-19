# Consistency plan: same avatar, same product, same look, everywhere

Next batch of updates. Pick this up whenever work resumes. Written 19 Oct 2026, nothing here is built yet.
This batch has two parts: the consistency stages (A to E) and the product ads feature (below Stage E). Ads build on Stages A to D.

## Why this is the priority
A reviewer comparing us with Higgsfield, Creatify and ugcvid said the test that matters for "building a recurring AI influencer" is not one good video. It is keeping the same face, hair, clothing style and overall identity across multiple scenes and posts. They also said we are good value for character and image work only if image models are cheap and character references are reused reliably. Packaged UGC tools (Creatify, ugcvid) win on talking-head ads because they bundle creator, script and production, at roughly $1.95 for a 15 second first-pass video on Creatify's Starter plan.

So the bar is: the user's character and product look the same in every image and video the user makes, through the whole workflow (character creation, template, studio, wizard, post kit, video), not only in the first result.

## What exists today (read from the code)
- `src/lib/characters.ts`: `characterPrompt()` sends a fixed line ("Keep the same person as in the reference photos, with the same face, hair and build"), the character description, then `Scene: <prompt>`. `loadReferences()` sends up to 3 reference photos for images and 1 for video, with the product photo taking one image slot.
- `src/lib/providers/openrouter.ts`: video uses the first reference as `frame_images` first_frame. Images use `input_references`. Not confirmed live: data URLs as frame_images, and some video models refusing real faces.
- Characters table: name, description, `reference_keys`, plus niche and tone (migration 0007). No stored "look" fields, no seed, no per-model notes.
- Templates (`src/config/templates.ts`): each has a hand-written scene string. They do not share a common prompt structure and do not know about the character's wardrobe.
- The character portrait made with no photos is a single generation with a generic prompt. It becomes the only reference, so any flaw in it is copied into everything.

## Known weak points to fix
1. **One generic identity sentence.** It is the same for every model. Models differ in how they take references (image edit vs reference input vs first frame), so one wording is wrong for some of them.
2. **Description is free text.** The user may write "pretty brunette", which says nothing a model can hold on to. Nothing makes the description specific (age, skin tone, face shape, hair color and length, eyes, build, signature features).
3. **Reference quality is unchecked.** Blurry, cropped, multi-person or heavily filtered photos give unstable faces. No validation or guidance at upload.
4. **Portrait is a single roll.** When no photos are provided, the generated portrait is one image, never reviewed, and it becomes the identity.
5. **Video starts from a reference as the first frame only.** After a few seconds the face can drift. Longer clips drift more.
6. **Product consistency** is a single appended sentence ("show that exact product, unchanged"). Labels and packaging text often warp.
7. **Wardrobe and setting are not tracked.** Each scene starts from scratch, so clothing style changes between posts even when the face holds.
8. **No way to measure it.** We cannot tell whether a change helped.

## Proposed work (stages, in order)

### Stage A: a prompt layer we own (small, no new vendors)
- Make prompt building one module, `src/lib/prompts/`, used by the studio, wizard, templates, portrait and post kit. No route builds its own prompt text.
- Structured character profile instead of one text box: age range, gender presentation, skin tone, face shape, eyes, hair color/length/style, build, distinguishing features, default wardrobe style, vibe. Compose a fixed "identity block" from it. Keep the free text description as extra.
- Per-model prompt adapters: for each model family (Nano Banana, Seedream, Flux, Qwen, Grok, Veo, Kling, Seedance, Wan, Hailuo, etc.) store how to phrase the identity instruction and how many references it handles best. Config data like `models.ts`, not code.
- Order and wording rules: identity first, then outfit, then scene, then camera/style. Add a short negative list (no different face, no extra people, no text changes on the product) where the model supports it.
- Rewrite all templates to take the identity block and an outfit field, so the same wardrobe can carry across posts.

### Stage B: better references
- Upload checks (client and server): one person, face visible, minimum size, not too dark. Plain-language tips ("front-facing, no sunglasses, one person").
- Generated portrait: make a small set (for example front, three-quarter, smiling) in one go, let the user pick the best, and store those as the references. This is a character sheet. It costs a few credits, so decide whether it is charged or included with character creation.
- Choose which references to send per task: front-facing for close-ups, a full-body one for outfit shots, and the product photo last.

### Stage C: video consistency
- Generate the first frame as an image with the character pipeline first (cheap, and checkable), then animate it. This is image-to-video with an approved still, which is steadier than text-to-video with a face reference.
- Show the still to the user before spending video credits.
- Keep clips short by default and chain a longer piece from clips that start from the same approved still.
- Verify which video models accept real faces (the code notes some refuse them) and mark the working ones as "character-safe" in the model picker.

### Stage D: product and wardrobe
- Product kit: several product photos (front, label close-up), a stored name and one-line description, and the same "exact product" rule through the prompt layer.
- Wardrobe presets saved on the character (outfit name plus its own reference photo), selectable per generation.

### Stage E: measure it
- Make a fixed test set: 3 characters, 10 prompts, every model we recommend. Save outputs and score them by eye (and, if cheap enough, a face-similarity score). Run it before and after each prompt change.
- Log which model, prompt version and references produced each job so a bad result can be traced and fixed. Store a `prompt_version` on the job.
- Surface a "Best for consistency" tag in the model picker from this data.

## Feature: product ads (added 19 Oct 2026)
Goal: a user picks their character, adds a product, and gets a finished UGC style ad (image set or short video) without writing a prompt. This is what Creatify and ugcvid sell, at about $1.95 for a 15 second first pass. It depends on the consistency work above: the ad is only worth anything if the character and the product both look right.

Scope note: this section is my reading of "product ad thing" from the competitor comparison. Confirm the scope below before building.

**What exists today:** the `product-review`, `unboxing` and `product-pitch` templates, and `/api/uploads/product`, which takes one product photo (max 1.4 MB, images only) and sends it as an extra reference with a one-line "show that exact product" instruction. Video has no product input at all.

**What the feature adds**
1. **Product page in the app:** save a product once (name, one-line pitch, price or offer, 2-4 photos including a label close-up). Reuse it across ads. Optionally fill the fields from a pasted product link.
2. **Ad wizard:** product, then character, then ad style (review, unboxing, problem and solution, before and after, testimonial, talking-head pitch), then length and shape (9:16, 4:5, 1:1), then see the credit cost, then generate.
3. **Script and hook:** write a short script and 3 alternative hooks from the product and the character's tone, using the same text model as the post kit. User edits before spending credits.
4. **Image first, then video:** build the ad scene as a still (character holding the product, label readable), let the user approve it, then animate it (Stage C). Cheaper to retry and it protects the product look.
5. **Variants:** one click for 3 hooks or 3 scenes from the same product, so people can test ads. Needs a credit hold for the batch (also in Stage 3 of `influencer-flow-plan.md`).
6. **Export:** crop presets per platform, caption and hashtags, download a set.

**Product consistency problems to solve:** labels and logos warp, the product changes shape between frames, the product size relative to the hand drifts. Mitigations: label close-up as a dedicated reference, "product last" reference order, a check step where the user approves the still, and a short note telling users to upload a clean photo on a plain background.

**Cost and pricing:** an ad is several generations (stills plus a clip plus a caption). Add the credit total up front. Compare with Creatify's $1.95 per 15 second video: with the current rates a Veo 3.1 Lite 8 second clip is 14 credits ($1.40 at Starter), so a full ad will cost more than that unless we steer to cheaper video models. Decide a default "ad" model set that keeps an ad near or below that price.

**Open questions for this feature**
- Which output first: image ads only, or video from day one?
- Do we need talking-head speech (a voice that says the script)? Veo and Omni make speech inside the video. A separate voice means the TTS work in `influencer-flow-plan.md` Stage 2.
- Do we accept a product link and read the page (needs fetching and permission to scrape), or only uploaded photos?
- Are ads priced per generation as today, or as a fixed "ad pack" of credits?
- Legal: ad claims and disclosure that content is AI generated, and who is responsible for the product claims a user writes.

## Open questions
- Is the character sheet (Stage B) free or paid in credits?
- Do we limit users to a recommended shortlist of models for characters, or leave all 51 open?
- Face-similarity scoring: worth adding a vendor for it, or judge by eye at first?
- How do we check that real-face references are accepted by each video model through OpenRouter? Needs a live test with a funded key.

## Related files
- `src/lib/characters.ts`, `src/config/templates.ts`, `src/config/models.ts`, `src/config/model-options.ts`
- `src/lib/providers/openrouter.ts`, `src/lib/jobs/run.ts`, `src/app/api/generate/route.ts`, `src/app/api/characters/route.ts`
- `docs/influencer-flow-plan.md` (earlier staged plan for personas, templates, scripts and voice; this plan sits alongside it)

## Status (19 October 2026)

All five stages are built in code. Nothing here has been tested against live models, because that needs funded keys.

| Stage | Built | Not verified |
|---|---|---|
| A prompt layer and profile | `src/lib/prompts`, profile column, `/api/generate` rebuilt, create flow sends template id and blanks | Real output quality |
| B references and sheet | Photo checks (local and Gemini), 3 option picker, side and full body shots, tagged references | Vision check live behaviour |
| C still first video | Make the first frame, approve it, "Animate it" with the still as the opening frame | Real faces accepted by video models, data URLs as frame images |
| D product kit and wardrobe | Products page, saved outfits on a character, product and outfit pickers in Create | Product plus person on each model |
| E measurement | `src/config/eval-set.ts`, `scripts/consistency-eval.ts` (dry run by default), `docs/consistency-scoring.md`, `consistent` flag on model meta | The results themselves |

Product ads are built (Ads page): image ads only, silent, saved products only, priced per generation with the total shown up front. Four ad styles run at once, each with a caption. Untested against live models.

## Decisions made

- A character with no profile, outfit or extra references keeps the exact old prompt (`p1`). The structured prompt (`p2`) applies once there is something to say. `jobs.params.promptVersion` records which was used.
- The profile is one JSON column: dropdowns plus a few free text fields.
- Candidates are three text only portraits and the user picks one. Extra angles are generated afterwards from the picked portrait, because separate text only runs would give different people.
- The character sheet (side and full body shots) is paid and optional.
- If person, outfit and product do not fit a model's reference limit, the user gets a clear error. Nothing is dropped silently.
- Video takes no product or outfit photo. A product reaches a video only through the approved still.
- Models that use one reference only (xAI image edit, every video model) are marked in `src/config/model-refs.ts`. `MAX_IMAGE_REFS = 3` is a guess until the test set shows otherwise.
- The "Best for consistency" tag appears only when `consistent: true` is set on a model after scoring.
