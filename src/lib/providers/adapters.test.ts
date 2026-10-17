import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getModel } from "@/config/models";
import { nearestRatio } from "./http";
import { alibaba } from "./alibaba";
import { google } from "./google";
import { minimax } from "./minimax";
import { ProviderError } from "./types";
import { xai } from "./xai";

type Call = { url: string; init: RequestInit; json: () => Record<string, unknown> };
let calls: Call[] = [];

/** Queue of fake responses, answered in order. A string body is sent raw, anything else as JSON. */
function mockFetch(...responses: { status?: number; body: unknown; headers?: Record<string, string> }[]) {
  calls = [];
  const queue = [...responses];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      calls.push({ url, init, json: () => JSON.parse(String(init.body)) });
      const r = queue.shift();
      if (!r) throw new Error(`unexpected fetch ${url}`);
      const raw = typeof r.body === "string" || r.body instanceof Uint8Array;
      return new Response(raw ? (r.body as BodyInit) : JSON.stringify(r.body), { status: r.status ?? 200, headers: r.headers });
    }),
  );
}

const VIDEO_BYTES = new Uint8Array([1, 2, 3, 4]);
const photo = { mime: "image/png", base64: "AAAA" };

beforeEach(() => {
  vi.stubEnv("GEMINI_API_KEY", "gk");
  vi.stubEnv("XAI_API_KEY", "xk");
  vi.stubEnv("MINIMAX_API_KEY", "mk");
  vi.stubEnv("DASHSCOPE_API_KEY", "dk");
  vi.stubEnv("ALIBABA_BASE_URL", "https://ws1.ap-southeast-1.maas.aliyuncs.com/");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("nearestRatio", () => {
  it("keeps supported ratios and maps the rest to the closest", () => {
    const list = ["1:1", "16:9", "9:16", "4:3", "3:4"];
    expect(nearestRatio("9:16", list)).toBe("9:16");
    expect(nearestRatio("4:5", list)).toBe("3:4");
    expect(nearestRatio(undefined, list)).toBe("9:16");
  });
});

describe("xai", () => {
  const image = getModel("grok-imagine-image")!;
  const video = getModel("grok-imagine-video")!;

  it("generates an image and decodes base64 output", async () => {
    mockFetch({ body: { data: [{ b64_json: Buffer.from("png-bytes").toString("base64"), mime_type: "image/png" }] } });
    const r = await xai.submit({ model: image, prompt: "a cat", aspectRatio: "4:5" });
    expect(calls[0].url).toBe("https://api.x.ai/v1/images/generations");
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe("Bearer xk");
    expect(calls[0].json()).toMatchObject({ model: "grok-imagine-image-quality", prompt: "a cat", n: 1, aspect_ratio: "3:4", response_format: "b64_json" });
    expect(r.status).toBe("succeeded");
    if (r.status === "succeeded") expect(Buffer.from(r.outputs[0].bytes).toString()).toBe("png-bytes");
  });

  it("edits from a reference photo instead of generating", async () => {
    mockFetch({ body: { data: [{ b64_json: "AAAA" }] } });
    await xai.submit({ model: image, prompt: "same person at a cafe", references: [photo] });
    expect(calls[0].url).toBe("https://api.x.ai/v1/images/edits");
    expect(calls[0].json().image).toEqual({ url: "data:image/png;base64,AAAA", type: "image_url" });
  });

  it("submits video and returns the request id", async () => {
    mockFetch({ body: { request_id: "req-1" } });
    const r = await xai.submit({ model: video, prompt: "walking", aspectRatio: "9:16" });
    expect(calls[0].url).toBe("https://api.x.ai/v1/videos/generations");
    expect(calls[0].json()).toMatchObject({ model: "grok-imagine-video", duration: 8, resolution: "720p", aspect_ratio: "9:16" });
    expect(r).toEqual({ status: "running", ref: "req-1" });
  });

  it("sends the photo as the starting frame and leaves out the aspect ratio", async () => {
    mockFetch({ body: { request_id: "req-2" } });
    await xai.submit({ model: video, prompt: "walking", references: [photo] });
    const body = calls[0].json();
    expect(body.image).toEqual({ url: "data:image/png;base64,AAAA" });
    expect(body).not.toHaveProperty("aspect_ratio");
  });

  it("keeps polling while pending", async () => {
    mockFetch({ body: { status: "pending" } });
    expect(await xai.poll("req-1", video)).toEqual({ status: "running", ref: "req-1" });
    expect(calls[0].url).toBe("https://api.x.ai/v1/videos/req-1");
  });

  it("downloads the finished video and reads the real cost from ticks", async () => {
    mockFetch(
      { body: { status: "done", video: { url: "https://vidgen.x.ai/v.mp4", duration: 8, respect_moderation: true }, usage: { cost_in_usd_ticks: 5_600_000_000 } } },
      { body: VIDEO_BYTES, headers: { "content-type": "video/mp4" } },
    );
    const r = await xai.poll("req-1", video);
    expect(r.status).toBe("succeeded");
    if (r.status === "succeeded") {
      expect(r.actualCostMicros).toBe(560_000); // $0.56
      expect(r.outputs[0].mime).toBe("video/mp4");
      expect(Array.from(r.outputs[0].bytes)).toEqual([1, 2, 3, 4]);
    }
  });

  it("fails a video that moderation rejected", async () => {
    mockFetch({ body: { status: "done", video: { url: "https://x/v.mp4", respect_moderation: false } } });
    const r = await xai.poll("req-1", video);
    expect(r.status).toBe("failed");
  });

  it("reports the lab's own error message on failure", async () => {
    mockFetch({ body: { status: "failed", error: { code: "invalid_argument", message: "Prompt cannot be empty." } } });
    expect(await xai.poll("req-1", video)).toMatchObject({ status: "failed", error: "Prompt cannot be empty.", permanent: true });
  });

  it("raises the HTTP status so billing problems can be spotted", async () => {
    mockFetch({ status: 402, body: { error: "Payment required" } });
    await expect(xai.submit({ model: video, prompt: "x" })).rejects.toMatchObject({ status: 402 });
  });

  it("refuses to run without a key", async () => {
    vi.stubEnv("XAI_API_KEY", "");
    await expect(xai.submit({ model: video, prompt: "x" })).rejects.toBeInstanceOf(ProviderError);
  });
});

describe("minimax", () => {
  const h3 = getModel("minimax-h3")!;

  it("creates a text to video task with a concrete ratio", async () => {
    mockFetch({ body: { task_id: 424010985738629 } });
    const r = await minimax.submit({ model: h3, prompt: "a boy by the sea", aspectRatio: "4:5" });
    expect(calls[0].url).toBe("https://api.minimax.io/v2/video_generation");
    expect(calls[0].json()).toEqual({
      model: "MiniMax-H3",
      content: [{ type: "text", text: "a boy by the sea" }],
      resolution: "768P",
      duration: 8,
      ratio: "3:4",
    });
    expect(r).toEqual({ status: "running", ref: "424010985738629" });
  });

  it("uses the photo as the first frame and lets the ratio follow it", async () => {
    mockFetch({ body: { task_id: "7" } });
    await minimax.submit({ model: h3, prompt: "waves", references: [photo] });
    const body = calls[0].json() as { content: unknown[]; ratio: string };
    expect(body.content[1]).toEqual({ type: "image_url", image_url: { url: "data:image/png;base64,AAAA" }, role: "first_frame" });
    expect(body.ratio).toBe("adaptive");
  });

  it("polls the v2 query endpoint", async () => {
    mockFetch({ body: { task: { status: "running" } } });
    expect(await minimax.poll("7", h3)).toEqual({ status: "running", ref: "7" });
    expect(calls[0].url).toBe("https://api.minimax.io/v2/query/video_generation/7");
  });

  it("downloads the result and costs it per second of output", async () => {
    mockFetch(
      { body: { task: { status: "succeeded", content: { url: "https://cdn.minimax/v.mp4" }, usage: { output_seconds: 8 } } } },
      { body: VIDEO_BYTES, headers: { "content-type": "video/mp4" } },
    );
    const r = await minimax.poll("7", h3);
    expect(r.status).toBe("succeeded");
    if (r.status === "succeeded") expect(r.actualCostMicros).toBe(640_000); // 8 s at $0.08
  });

  it("does not treat an expired download link as a billing problem", async () => {
    mockFetch({ body: { task: { status: "succeeded", content: { url: "https://cdn.minimax/v.mp4" } } } }, { status: 403, body: "expired" });
    const err = await minimax.poll("7", h3).catch((e) => e);
    expect(err).toBeInstanceOf(ProviderError);
    expect(err.status).toBeUndefined();
  });

  it("reports a failed task", async () => {
    mockFetch({ body: { task: { status: "failed", error: { message: "content policy" } } } });
    expect(await minimax.poll("7", h3)).toMatchObject({ status: "failed", error: "content policy" });
  });
});

describe("alibaba", () => {
  const wan = getModel("wan-3.0")!;

  it("creates an async Wan 3.0 task on the workspace host", async () => {
    mockFetch({ body: { output: { task_id: "t-1", task_status: "PENDING" } } });
    const r = await alibaba.submit({ model: wan, prompt: "a market", aspectRatio: "9:16" });
    expect(calls[0].url).toBe("https://ws1.ap-southeast-1.maas.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis");
    expect((calls[0].init.headers as Record<string, string>)["X-DashScope-Async"]).toBe("enable");
    expect(calls[0].json()).toMatchObject({
      model: "wan3.0-video",
      input: { prompt: "a market" },
      parameters: { resolution: "720P", ratio: "9:16", duration: 8, audio: true, watermark: false },
    });
    expect(r).toEqual({ status: "running", ref: "t-1" });
  });

  it("passes the photo as the first frame", async () => {
    mockFetch({ body: { output: { task_id: "t-2" } } });
    await alibaba.submit({ model: wan, prompt: "x", references: [photo] });
    const body = calls[0].json() as { input: { media: unknown[] }; parameters: { ratio: string } };
    expect(body.input.media).toEqual([{ type: "first_frame", url: "data:image/png;base64,AAAA" }]);
    expect(body.parameters.ratio).toBe("adaptive");
  });

  it("maps task states and costs the finished video per second", async () => {
    mockFetch({ body: { output: { task_status: "RUNNING" } } });
    expect(await alibaba.poll("t-1", wan)).toEqual({ status: "running", ref: "t-1" });

    mockFetch(
      { body: { output: { task_status: "SUCCEEDED", video_url: "https://dashscope/v.mp4" }, usage: { output_video_duration: 8 } } },
      { body: VIDEO_BYTES, headers: { "content-type": "video/mp4" } },
    );
    const r = await alibaba.poll("t-1", wan);
    expect(calls[0].url).toBe("https://ws1.ap-southeast-1.maas.aliyuncs.com/api/v1/tasks/t-1");
    expect(r.status).toBe("succeeded");
    if (r.status === "succeeded") expect(r.actualCostMicros).toBe(800_000); // 8 s at $0.10
  });

  it("reports a failed task with the lab's message", async () => {
    mockFetch({ body: { output: { task_status: "FAILED", message: "Inappropriate content" } } });
    expect(await alibaba.poll("t-1", wan)).toMatchObject({ status: "failed", error: "Inappropriate content" });
  });

  it("needs the workspace host to be set", async () => {
    vi.stubEnv("ALIBABA_BASE_URL", "");
    await expect(alibaba.submit({ model: wan, prompt: "x" })).rejects.toBeInstanceOf(ProviderError);
  });
});

describe("google", () => {
  const nano = getModel("nano-banana-2.1")!;
  const omni = getModel("gemini-omni-flash")!;

  it("asks Nano Banana for one image and decodes it", async () => {
    mockFetch({
      body: {
        id: "i1",
        status: "completed",
        steps: [{ type: "model_output", content: [{ type: "image", mime_type: "image/png", data: Buffer.from("img").toString("base64") }] }],
      },
    });
    const r = await google.submit({ model: nano, prompt: "a cat", aspectRatio: "9:16" });
    expect(calls[0].url).toBe("https://generativelanguage.googleapis.com/v1beta/interactions");
    expect((calls[0].init.headers as Record<string, string>)["x-goog-api-key"]).toBe("gk");
    expect(calls[0].json()).toMatchObject({
      model: "gemini-nano-banana-2.1",
      response_format: { type: "image", aspect_ratio: "9:16", image_size: "1K" },
    });
    expect(r.status).toBe("succeeded");
    if (r.status === "succeeded") expect(Buffer.from(r.outputs[0].bytes).toString()).toBe("img");
  });

  it("sends reference photos with the text for character consistency", async () => {
    mockFetch({ body: { id: "i2", status: "completed", steps: [{ content: [{ type: "image", data: "AAAA" }] }] } });
    await google.submit({ model: nano, prompt: "same person", references: [photo] });
    expect(calls[0].json().input).toEqual([
      { type: "text", text: "same person" },
      { type: "image", mime_type: "image/png", data: "AAAA" },
    ]);
  });

  it("starts Omni video in the background and keeps polling until it completes", async () => {
    mockFetch({ body: { id: "interactions/v1", status: "in_progress" } });
    const r = await google.submit({ model: omni, prompt: "walking" });
    expect(calls[0].json()).toMatchObject({ model: "gemini-omni-1.1-flash", background: true, response_format: { type: "video", resolution: "720p" } });
    expect(r).toEqual({ status: "running", ref: "v1" });

    mockFetch({ body: { id: "v1", status: "queued" } });
    expect(await google.poll("v1", omni)).toEqual({ status: "running", ref: "v1" });
    expect(calls[0].url).toBe("https://generativelanguage.googleapis.com/v1beta/interactions/v1");
  });

  it("costs Omni from the output tokens Google reports", async () => {
    mockFetch({
      body: {
        id: "v1",
        status: "completed",
        steps: [{ content: [{ type: "video", mime_type: "video/mp4", data: "AAAA" }] }],
        usage: { output_tokens_by_modality: [{ modality: "VIDEO", tokens: 40_000 }] },
      },
    });
    const r = await google.poll("v1", omni);
    expect(r.status).toBe("succeeded");
    if (r.status === "succeeded") expect(r.actualCostMicros).toBe(700_000); // 40,000 tokens at $17.50 per million
  });

  it("fails a completed job that returned no media", async () => {
    mockFetch({ body: { id: "v1", status: "completed", steps: [{ content: [{ type: "text", text: "Blocked by safety" }] }] } });
    expect(await google.poll("v1", omni)).toMatchObject({ status: "failed", permanent: true });
  });

  it("surfaces a 403 so a billing problem can be noticed", async () => {
    mockFetch({ status: 403, body: { error: { message: "Billing account not active" } } });
    await expect(google.submit({ model: nano, prompt: "x" })).rejects.toMatchObject({ status: 403 });
  });
});
