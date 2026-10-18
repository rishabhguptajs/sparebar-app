# AI influencer flow: staged plan

Goal: someone who has never used the tool goes from zero to a post-ready image or video of their own AI influencer without writing a prompt from scratch.

## What exists today
Characters (name, look, up to 3 photos or a generated portrait), a studio (prompt, model, shape), a library, credits. Every generation starts from a blank prompt.

## Stage 1: guided creator and templates (no new lab APIs)
- **Persona on characters.** New fields: niche, tone of voice, age range, signature outfits or props. Migration `0007`. The new-character popup gets a short second step.
- **Template library.** A config file of post types (get ready with me, product review, unboxing, skincare routine, outfit try-on, talking-head tip, podcast clip). Each has a prompt skeleton, a default shape, a model suggestion and a cover. Pure data, like `models.ts`.
- **Guided wizard** at `/app/create`: pick influencer (or make one) -> pick a template -> fill 1-3 blanks (product, setting, mood) -> see the cost -> generate. The studio stays as the "advanced" screen; the wizard fills it in.
- **Product input.** Upload a product photo (stored like character photos) and send it as an extra reference so the influencer holds or uses it. Optional product name and one-line pitch go into the prompt.
- **Post kit.** After a result, one call to a Gemini text model (`gemini-3.1-flash-lite`, fractions of a cent) drafts a caption and hashtags in the character's tone. Crop presets for Reels, TikTok and Instagram map to our existing aspect ratios. Free for users, rate limited.
- Credits: no change to pricing. Template runs cost the same credits as the model they use.

## Stage 2: scripts and voice
Answer to "do we need voice models": mostly no for video, yes for voiceovers.
- **Veo 3.1 and Gemini Omni make speech and sound inside the video themselves.** Put the line in the prompt ("she says: ...") and the clip comes back with audio. The script step therefore only needs to write good lines.
- **Script drafting:** same text model as the post kit; takes the character persona, template and product, returns a 15-30 second script split into shots.
- **Separate voice (TTS)** is for voiceover on images or silent video, and for a consistent voice per influencer. Google has text-to-speech models on your key (`gemini-3.8-flash-tts`, `gemini-3.1-flash-tts-preview`, `gemini-2.5-pro-preview-tts`) with a set of named voices. The character stores a chosen voice; we generate audio and mux it onto the video (needs `ffmpeg` in a function or a worker, so this is the heavier piece).
- **Known limit:** a voice stays the same only when we use TTS. Voices made inside Veo can drift between clips, and lip sync of TTS onto a face is not offered by Google. If lip-synced consistent voice matters, a third-party lip-sync model is a later, separate decision.

## Stage 3: richer characters and batches
- Several looks per character (outfits, hairstyles), each with its own reference photos.
- Character sheet: one click makes a set of angles and expressions to use as stronger references.
- Campaign board: pick a character and a brief, generate 6-10 posts as a grid, review and download together. Needs a queue and a credit hold for the whole batch.

## Order and rough size
1. Stage 1: about a week of work. Biggest effect on the "feels basic" problem. No new vendor risk.
2. Stage 2a (scripts) then 2b (TTS voiceover): scripts are small; TTS plus muxing is the largest single task.
3. Stage 3: after Stages 1-2 show what people actually make.

## Open decisions
- Wizard as the new default landing screen for new users, or a tab beside the studio?
- Post kit free and rate limited, or 1 credit per use?
- Do you want TTS voiceover in the first release, or ship video-with-speech via Veo first?
