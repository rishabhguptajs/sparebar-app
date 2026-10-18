// MiniMax H3, v2 API. Docs read 18 Oct 2026: platform.minimax.io/docs/api-reference/video-generation-v2-*.
// POST /v2/video_generation returns a task_id, then GET /v2/query/video_generation/{id} until succeeded.
// The finished task has a time-limited download link at task.content.url and usage in seconds.
// Not yet confirmed against a live key: base64 data URIs for the first frame (documented as supported).

import { currentPrice } from "@/config/models";
import { api, dataUri, download, nearestRatio, requireKey } from "./http";
import type {
  GenerateInput,
  ModelConfigLike,
  ProviderAdapter,
  ProviderResult,
} from "./types";

const BASE = "https://api.minimax.io";
const RATIOS = ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"] as const;

type Submit = { task_id: string };
type Task = {
  task?: {
    id?: string;
    status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
    error?: { code?: string; message?: string } | null;
    content?: { url?: string } | null;
    usage?: { output_seconds?: number; total_seconds?: number } | null;
    duration?: number;
  };
};

export const minimax: ProviderAdapter = {
  lab: "minimax",

  async submit({
    model,
    prompt,
    aspectRatio,
    references,
  }: GenerateInput): Promise<ProviderResult> {
    const key = requireKey("MINIMAX_API_KEY");
    const hasFrame = !!references?.length;
    const content: unknown[] = [{ type: "text", text: prompt }];
    // The character photo becomes the first frame, so the clip starts from the real face.
    if (hasFrame)
      content.push({
        type: "image_url",
        image_url: { url: dataUri(references![0]) },
        role: "first_frame",
      });

    const body = {
      model: model.apiModel,
      content,
      resolution: model.defaults.resolution ?? "768P",
      duration: model.defaults.seconds ?? 8,
      // Text to video needs a real ratio. With a first frame the output follows the photo.
      ratio: hasFrame
        ? "adaptive"
        : nearestRatio(aspectRatio ?? model.defaults.aspectRatio, RATIOS),
    };
    const res = await api<Submit>("MiniMax", `${BASE}/v2/video_generation`, {
      key,
      body,
    });
    return { status: "running", ref: String(res.task_id) };
  },

  async poll(ref, model: ModelConfigLike): Promise<ProviderResult> {
    const key = requireKey("MINIMAX_API_KEY");
    const { task } = await api<Task>(
      "MiniMax",
      `${BASE}/v2/query/video_generation/${ref}`,
      { key },
    );
    if (!task)
      return {
        status: "failed",
        ref,
        error: "MiniMax returned no task",
        permanent: true,
      };

    if (task.status === "queued" || task.status === "running")
      return { status: "running", ref };
    if (task.status === "succeeded") {
      if (!task.content?.url)
        return {
          status: "failed",
          ref,
          error: "MiniMax returned no video",
          permanent: true,
        };
      const file = await download("MiniMax", task.content.url, "video/mp4");
      // Billed per second of output video, and the finished task reports those seconds.
      const perSecond = currentPrice(model).perSecondMicros;
      const seconds =
        task.usage?.output_seconds ??
        task.usage?.total_seconds ??
        task.duration;
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
      error: task.error?.message ?? `MiniMax task ${task.status}`,
      permanent: true,
    };
  },
};
