// xAI Grok Imagine. Docs read 18 Oct 2026: docs.x.ai/developers/model-capabilities/{images,video}.
// Images: POST /v1/images/generations (or /v1/images/edits with one reference photo), answered in the call.
// Video: POST /v1/videos/generations returns a request_id, then GET /v1/videos/{id} until done.
// The finished video response reports usage.cost_in_usd_ticks, so the real cost is logged per job.
// Not yet confirmed against a live key: the edits response shape and the multi-reference image route.

import { api, dataUri, download, nearestRatio, requireKey } from "./http";
import type { GenerateInput, ProviderAdapter, ProviderResult } from "./types";

const BASE = "https://api.x.ai";
const RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9"] as const;
/** One USD is 10 billion ticks, so 10,000 ticks make one micro-USD. */
const TICKS_PER_MICRO = 10_000;

type ImageResp = { data?: { url?: string; b64_json?: string; mime_type?: string }[] };
type VideoSubmit = { request_id: string };
type VideoStatus = {
  status: "pending" | "done" | "failed" | "expired";
  video?: { url?: string | null; duration?: number; respect_moderation?: boolean };
  error?: { code?: string; message?: string };
  usage?: { cost_in_usd_ticks?: number };
};

export const xai: ProviderAdapter = {
  lab: "xai",

  async submit({ model, prompt, aspectRatio, references }: GenerateInput): Promise<ProviderResult> {
    const key = requireKey("XAI_API_KEY");
    const ratio = nearestRatio(aspectRatio ?? model.defaults.aspectRatio, RATIOS);

    if (model.kind === "image") {
      const edit = !!references?.length;
      const body = edit
        ? { model: model.apiModel, prompt, image: { url: dataUri(references![0]), type: "image_url" } }
        : { model: model.apiModel, prompt, n: 1, aspect_ratio: ratio, resolution: "1k", response_format: "b64_json" };
      const res = await api<ImageResp>("xAI", `${BASE}/v1/images/${edit ? "edits" : "generations"}`, { key, body });

      const item = res.data?.[0];
      if (!item) return { status: "failed", error: "xAI returned no image", permanent: true };
      if (item.b64_json) {
        return { status: "succeeded", outputs: [{ mime: item.mime_type ?? "image/jpeg", bytes: Uint8Array.from(Buffer.from(item.b64_json, "base64")) }] };
      }
      if (item.url) return { status: "succeeded", outputs: [await download("xAI", item.url, "image/jpeg")] };
      return { status: "failed", error: "xAI returned an empty image", permanent: true };
    }

    const body = {
      model: model.apiModel,
      prompt,
      duration: model.defaults.seconds ?? 8,
      resolution: model.defaults.resolution ?? "720p",
      // The output follows the photo's shape when a starting image is given.
      ...(references?.length ? { image: { url: dataUri(references[0]) } } : { aspect_ratio: ratio }),
    };
    const res = await api<VideoSubmit>("xAI", `${BASE}/v1/videos/generations`, { key, body });
    return { status: "running", ref: res.request_id };
  },

  async poll(ref): Promise<ProviderResult> {
    const key = requireKey("XAI_API_KEY");
    const res = await api<VideoStatus>("xAI", `${BASE}/v1/videos/${ref}`, { key });

    if (res.status === "pending") return { status: "running", ref };
    if (res.status === "done") {
      if (res.video?.respect_moderation === false) {
        return { status: "failed", ref, error: "The video was blocked by moderation.", permanent: true };
      }
      if (!res.video?.url) return { status: "failed", ref, error: "xAI returned no video", permanent: true };
      const file = await download("xAI", res.video.url, "video/mp4");
      const ticks = res.usage?.cost_in_usd_ticks;
      return {
        status: "succeeded",
        ref,
        outputs: [file],
        actualCostMicros: typeof ticks === "number" ? Math.round(ticks / TICKS_PER_MICRO) : undefined,
      };
    }
    // failed or expired
    return { status: "failed", ref, error: res.error?.message ?? `xAI video ${res.status}`, permanent: true };
  },
};
