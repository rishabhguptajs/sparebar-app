// Alibaba Model Studio, Wan 3.0 (wan3.0-video). Docs read 18 Oct 2026:
// alibabacloud.com/help/en/model-studio/wan3-video-generation-api-reference. The model is in preview.
// POST .../video-synthesis with X-DashScope-Async: enable returns a task_id, then GET /api/v1/tasks/{id}.
// The finished task has output.video_url (valid 24 hours) and usage.output_video_duration in seconds.
// The international host is specific to your workspace, so ALIBABA_BASE_URL must be set, for example
// https://<workspace-id>.ap-southeast-1.maas.aliyuncs.com
// Not yet confirmed against a live key: a base64 data URI in media.url, and the price per second.

import { currentPrice } from "@/config/models";
import { api, dataUri, download, nearestRatio, requireKey } from "./http";
import {
  ProviderError,
  type GenerateInput,
  type ModelConfigLike,
  type ProviderAdapter,
  type ProviderResult,
} from "./types";

const RATIOS = ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"] as const;

type Create = {
  output?: { task_id?: string; task_status?: string };
  code?: string;
  message?: string;
};
type Task = {
  output?: {
    task_status?: string;
    video_url?: string;
    code?: string;
    message?: string;
  };
  usage?: { output_video_duration?: number; duration?: number };
};

function base() {
  const url = process.env.ALIBABA_BASE_URL?.replace(/\/+$/, "");
  if (!url) throw new ProviderError("ALIBABA_BASE_URL is not set", true, 401);
  return url;
}

export const alibaba: ProviderAdapter = {
  lab: "alibaba",

  async submit({
    model,
    prompt,
    aspectRatio,
    references,
  }: GenerateInput): Promise<ProviderResult> {
    const key = requireKey("DASHSCOPE_API_KEY");
    const hasFrame = !!references?.length;
    const body = {
      model: model.apiModel,
      input: {
        prompt,
        ...(hasFrame
          ? { media: [{ type: "first_frame", url: dataUri(references![0]) }] }
          : {}),
      },
      parameters: {
        resolution: model.defaults.resolution ?? "720P",
        ratio: hasFrame
          ? "adaptive"
          : nearestRatio(aspectRatio ?? model.defaults.aspectRatio, RATIOS),
        duration: model.defaults.seconds ?? 8,
        audio: true,
        watermark: false,
        prompt_extend: true,
      },
    };
    const res = await api<Create>(
      "Alibaba",
      `${base()}/api/v1/services/aigc/video-generation/video-synthesis`,
      {
        key,
        body,
        headers: { "X-DashScope-Async": "enable" },
      },
    );
    const id = res.output?.task_id;
    if (!id)
      return {
        status: "failed",
        error: res.message ?? "Alibaba returned no task id",
        permanent: true,
      };
    return { status: "running", ref: id };
  },

  async poll(ref, model: ModelConfigLike): Promise<ProviderResult> {
    const key = requireKey("DASHSCOPE_API_KEY");
    const res = await api<Task>("Alibaba", `${base()}/api/v1/tasks/${ref}`, {
      key,
    });
    const status = res.output?.task_status;

    if (status === "PENDING" || status === "RUNNING")
      return { status: "running", ref };
    if (status === "SUCCEEDED") {
      const url = res.output?.video_url;
      if (!url)
        return {
          status: "failed",
          ref,
          error: "Alibaba returned no video",
          permanent: true,
        };
      const file = await download("Alibaba", url, "video/mp4");
      const perSecond = currentPrice(model).perSecondMicros;
      const seconds = res.usage?.output_video_duration ?? res.usage?.duration;
      return {
        status: "succeeded",
        ref,
        outputs: [file],
        actualCostMicros:
          perSecond && seconds ? Math.round(perSecond * seconds) : undefined,
      };
    }
    return {
      status: "failed",
      ref,
      error: res.output?.message ?? `Alibaba task ${status ?? "unknown"}`,
      permanent: true,
    };
  },
};
