// OpenRouter, the main lab: one key and one balance for most models.
// Docs read 19 Oct 2026: openrouter.ai/docs/guides/overview/multimodal/{image,video}-generation.
// Images: POST /api/v1/images is answered in the call with b64_json and usage.cost.
// Video: POST /api/v1/videos returns a job id, then GET /api/v1/videos/{id} until "completed", then the
// file comes from unsigned_urls[0] with the same Authorization header. usage.cost is the real charge.
// Not yet confirmed against a live key: data URLs as frame_images, and refusal of real faces by some video models.

import { api, dataUri, download, nearestRatio, requireKey } from "./http";
import type { GenerateInput, ProviderAdapter, ProviderResult } from "./types";

const BASE = "https://openrouter.ai/api/v1";
/** Every video model we list takes these two. Others (1:1, 4:3) are not shared by Veo and Runway. */
const VIDEO_RATIOS = ["9:16", "16:9"] as const;
/** GPT Image 1 and Mini only take these three; the newer GPT Images take the full list. */
const GPT_IMAGE_1_RATIOS = ["1:1", "3:2", "2:3"] as const;

type ImageResp = {
  data?: { b64_json?: string; media_type?: string }[];
  usage?: { cost?: number };
};
type VideoJob = {
  id: string;
  status:
    | "pending"
    | "in_progress"
    | "completed"
    | "failed"
    | "cancelled"
    | "expired";
  unsigned_urls?: string[];
  error?: string | { message?: string };
  usage?: { cost?: number };
};

const toMicros = (usd: number | undefined) =>
  typeof usd === "number" && usd >= 0 ? Math.round(usd * 1_000_000) : undefined;

function errorText(e: VideoJob["error"], fallback: string) {
  if (!e) return fallback;
  return typeof e === "string" ? e : (e.message ?? fallback);
}

export const openrouter: ProviderAdapter = {
  lab: "openrouter",

  async submit({
    model,
    prompt,
    aspectRatio,
    references,
  }: GenerateInput): Promise<ProviderResult> {
    const key = requireKey("OPENROUTER_API_KEY");
    const refs = (references ?? []).map((r) => ({
      type: "image_url",
      image_url: { url: dataUri(r) },
    }));

    if (model.kind === "image") {
      const res = await api<ImageResp>("OpenRouter", `${BASE}/images`, {
        key,
        body: {
          model: model.apiModel,
          prompt,
          n: 1,
          aspect_ratio: /^openai\/gpt-image-1(-mini)?$/.test(model.apiModel)
            ? nearestRatio(
                aspectRatio ?? model.defaults.aspectRatio,
                GPT_IMAGE_1_RATIOS,
              )
            : (aspectRatio ?? model.defaults.aspectRatio ?? "9:16"),
          // GPT Image has no resolution; its picker choice is the quality.
          ...(model.defaults.imageSize
            ? model.apiModel.startsWith("openai/gpt-image-")
              ? { quality: model.defaults.imageSize }
              : { resolution: model.defaults.imageSize }
            : {}),
          ...(refs.length ? { input_references: refs } : {}),
        },
      });
      const item = res.data?.[0];
      if (!item?.b64_json)
        return {
          status: "failed",
          error: "OpenRouter returned no image",
          permanent: true,
        };
      return {
        status: "succeeded",
        outputs: [
          {
            mime: item.media_type ?? "image/png",
            bytes: Uint8Array.from(Buffer.from(item.b64_json, "base64")),
          },
        ],
        actualCostMicros: toMicros(res.usage?.cost),
      };
    }

    const job = await api<VideoJob>("OpenRouter", `${BASE}/videos`, {
      key,
      body: {
        model: model.apiModel,
        prompt,
        duration: model.defaults.seconds ?? 8,
        resolution: model.defaults.resolution ?? "720p",
        aspect_ratio: nearestRatio(
          aspectRatio ?? model.defaults.aspectRatio,
          VIDEO_RATIOS,
        ),
        // Models that cannot make sound ignore this.
        generate_audio: true,
        // The first reference becomes the opening frame, which keeps the character's face.
        ...(refs.length
          ? { frame_images: [{ ...refs[0], frame_type: "first_frame" }] }
          : {}),
      },
    });
    return { status: "running", ref: job.id };
  },

  async poll(ref): Promise<ProviderResult> {
    const key = requireKey("OPENROUTER_API_KEY");
    const job = await api<VideoJob>(
      "OpenRouter",
      `${BASE}/videos/${encodeURIComponent(ref)}`,
      { key },
    );

    if (job.status === "pending" || job.status === "in_progress")
      return { status: "running", ref };
    if (job.status === "completed") {
      const url = job.unsigned_urls?.[0];
      if (!url)
        return {
          status: "failed",
          ref,
          error: "OpenRouter returned no video",
          permanent: true,
        };
      const file = await download("OpenRouter", url, "video/mp4", {
        Authorization: `Bearer ${key}`,
      });
      return {
        status: "succeeded",
        ref,
        outputs: [file],
        actualCostMicros: toMicros(job.usage?.cost),
      };
    }
    return {
      status: "failed",
      ref,
      error: errorText(job.error, `OpenRouter video ${job.status}`),
      permanent: true,
    };
  },
};
