// Google Gemini API, Interactions endpoint.
// Docs read 18 Oct 2026: ai.google.dev/gemini-api/docs/image-generation, /docs/omni, /api/interactions.
// Images: POST /v1beta/interactions returns the finished interaction.
// Video (Omni): POST with background=true, then GET /v1beta/interactions/{id} until status is terminal.
// Not yet confirmed against a live key: background mode for Omni and the exact usage modality names.

import { currentPrice, type ModelConfig } from "@/config/models";
import {
  ProviderError,
  type GenerateInput,
  type OutputFile,
  type ProviderAdapter,
  type ProviderResult,
} from "./types";

const BASE = "https://generativelanguage.googleapis.com/v1beta";

type ContentBlock = {
  type: string;
  text?: string;
  data?: string;
  uri?: string;
  mime_type?: string;
};

type Interaction = {
  id: string;
  status:
    | "in_progress"
    | "requires_action"
    | "completed"
    | "failed"
    | "cancelled"
    | "incomplete"
    | "queued";
  steps?: { type?: string; content?: ContentBlock[] }[];
  errors?: { message?: string; code?: string | number }[];
  usage?: {
    output_tokens_by_modality?: { modality: string; tokens: number }[];
  };
};

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new ProviderError("GEMINI_API_KEY is not set", true);
  return key;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "x-goog-api-key": apiKey(),
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    // 4xx other than 429 means the request itself is wrong (bad prompt, safety block, bad params).
    // 402/403 can mean an empty prepaid balance: not permanent for the user, but we refund either way.
    const permanent =
      res.status >= 400 && res.status < 500 && res.status !== 429;
    throw new ProviderError(
      `Google ${res.status}: ${text.slice(0, 500)}`,
      permanent,
      res.status,
    );
  }
  return JSON.parse(text) as T;
}

function interactionId(id: string): string {
  return id.replace(/^interactions\//, "");
}

async function download(uri: string): Promise<Uint8Array> {
  const res = await fetch(uri, {
    headers: { "x-goog-api-key": apiKey() },
    cache: "no-store",
  });
  // No status is attached: an expired result link returns 403, which must not read as a billing problem.
  if (!res.ok) throw new ProviderError(`Google download ${res.status}`, false);
  return new Uint8Array(await res.arrayBuffer());
}

async function collectOutputs(
  it: Interaction,
  kind: "image" | "video",
): Promise<OutputFile[]> {
  const blocks = (it.steps ?? [])
    .flatMap((s) => s.content ?? [])
    .filter((b) => b.type === kind);
  const files: OutputFile[] = [];
  for (const b of blocks) {
    const mime = b.mime_type ?? (kind === "image" ? "image/png" : "video/mp4");
    if (b.data)
      files.push({
        mime,
        bytes: Uint8Array.from(Buffer.from(b.data, "base64")),
      });
    else if (b.uri) files.push({ mime, bytes: await download(b.uri) });
  }
  return files;
}

/** Actual cost from reported output tokens, for token-billed models. */
function actualCost(it: Interaction, model: ModelConfig): number | undefined {
  const rates = currentPrice(model).perMillionOutputTokens;
  const usage = it.usage?.output_tokens_by_modality;
  if (!rates || !usage?.length) return undefined;
  let micros = 0;
  for (const u of usage) {
    const rate = rates[u.modality.toLowerCase() as keyof typeof rates];
    if (rate === undefined) return undefined; // unknown modality: keep the estimate rather than under-report
    micros += (u.tokens * rate) / 1_000_000;
  }
  return Math.round(micros);
}

async function toResult(
  it: Interaction,
  model: ModelConfig,
): Promise<ProviderResult> {
  const ref = interactionId(it.id);
  switch (it.status) {
    case "queued":
    case "in_progress":
      return { status: "running", ref };
    case "completed": {
      const outputs = await collectOutputs(it, model.kind);
      if (outputs.length === 0) {
        const text = (it.steps ?? [])
          .flatMap((s) => s.content ?? [])
          .find((b) => b.type === "text")?.text;
        return {
          status: "failed",
          ref,
          error: text
            ? `No ${model.kind} returned: ${text.slice(0, 300)}`
            : `No ${model.kind} returned`,
          permanent: true,
        };
      }
      return {
        status: "succeeded",
        ref,
        outputs,
        actualCostMicros: actualCost(it, model),
      };
    }
    default: {
      const msg =
        it.errors
          ?.map((e) => e.message)
          .filter(Boolean)
          .join("; ") || `Interaction ${it.status}`;
      return { status: "failed", ref, error: msg, permanent: true };
    }
  }
}

// Veo uses the long-running predict endpoint rather than Interactions.
// Start: POST /models/{id}:predictLongRunning, which returns an operation. Poll GET /{operation name} until done.
type VeoOperation = {
  name: string;
  done?: boolean;
  error?: { message?: string };
  response?: {
    generateVideoResponse?: {
      generatedSamples?: { video?: { uri?: string } }[];
      raiMediaFilteredReasons?: string[];
    };
  };
};

const isVeo = (model: ModelConfig) => model.apiModel.startsWith("veo");

async function veoResult(op: VeoOperation): Promise<ProviderResult> {
  if (!op.done) return { status: "running", ref: op.name };
  if (op.error)
    return {
      status: "failed",
      ref: op.name,
      error: op.error.message ?? "Video generation failed",
      permanent: true,
    };
  const out = op.response?.generateVideoResponse;
  const uri = out?.generatedSamples?.[0]?.video?.uri;
  if (!uri) {
    const why = out?.raiMediaFilteredReasons?.join("; ");
    return {
      status: "failed",
      ref: op.name,
      error: why
        ? `No video returned: ${why.slice(0, 300)}`
        : "No video returned",
      permanent: true,
    };
  }
  return {
    status: "succeeded",
    ref: op.name,
    outputs: [{ mime: "video/mp4", bytes: await download(uri) }],
  };
}

export const google: ProviderAdapter = {
  lab: "google",

  async submit({ model, prompt, aspectRatio, references }: GenerateInput) {
    const input = [
      { type: "text", text: prompt },
      ...(references ?? []).map((r) => ({
        type: "image",
        mime_type: r.mime,
        data: r.base64,
      })),
    ];
    const ratio = aspectRatio ?? model.defaults.aspectRatio;

    if (isVeo(model)) {
      const first = references?.[0];
      const op = await call<VeoOperation>(
        `/models/${model.apiModel}:predictLongRunning`,
        {
          method: "POST",
          body: JSON.stringify({
            instances: [
              {
                prompt,
                ...(first
                  ? {
                      image: {
                        bytesBase64Encoded: first.base64,
                        mimeType: first.mime,
                      },
                    }
                  : {}),
              },
            ],
            // Veo takes 16:9 or 9:16 only.
            parameters: {
              aspectRatio: ratio === "16:9" ? "16:9" : "9:16",
              resolution: model.defaults.resolution ?? "720p",
              durationSeconds: model.defaults.seconds ?? 8,
            },
          }),
        },
      );
      return veoResult(op);
    }

    const body =
      model.kind === "image"
        ? {
            model: model.apiModel,
            input,
            response_format: {
              type: "image",
              aspect_ratio: ratio,
              ...(model.defaults.imageSize
                ? { image_size: model.defaults.imageSize }
                : {}),
            },
          }
        : {
            model: model.apiModel,
            input,
            response_format: {
              type: "video",
              aspect_ratio: ratio,
              resolution: model.defaults.resolution ?? "720p",
            },
            ...(references?.length
              ? {
                  generation_config: {
                    video_config: { task: "image_to_video" },
                  },
                }
              : {}),
            background: true,
            store: true,
          };

    const it = await call<Interaction>("/interactions", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return toResult(it, model);
  },

  async poll(ref, model) {
    if (isVeo(model)) return veoResult(await call<VeoOperation>(`/${ref}`));
    const it = await call<Interaction>(`/interactions/${interactionId(ref)}`);
    return toResult(it, model);
  },
};
