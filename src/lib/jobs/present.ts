import "server-only";
import { getModel } from "@/config/models";
import { signedUrl } from "@/lib/r2";
import type { JobRow } from "./run";

/** Shape sent to the browser. Lab cost and provider ids stay server side. */
export async function presentJob(job: JobRow) {
  const succeeded = job.status === "succeeded";
  return {
    id: job.id,
    modelKey: job.model_key,
    modelLabel: getModel(job.model_key)?.label ?? job.model_key,
    kind: job.kind,
    prompt: job.prompt,
    aspectRatio: (job.params as { aspectRatio?: string } | null)?.aspectRatio ?? null,
    characterId: job.character_id,
    status: job.status,
    credits: job.credits_charged,
    error: job.status === "failed" ? "Generation failed. Your credits were refunded." : null,
    createdAt: job.created_at,
    completedAt: job.completed_at,
    outputs: succeeded
      ? await Promise.all(
          job.outputs.map(async (o, i) => ({
            mime: o.mime,
            url: await signedUrl(o.key),
            thumbUrl: o.thumb ? await signedUrl(o.thumb) : null,
            downloadUrl: await signedUrl(o.key, 3600, `sparebar-${job.id.slice(0, 8)}-${i + 1}.${o.key.split(".").pop()}`),
          })),
        )
      : [],
  };
}

export type PresentedJob = Awaited<ReturnType<typeof presentJob>>;
