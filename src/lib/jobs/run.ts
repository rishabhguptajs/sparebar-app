import "server-only";
import { currentPrice, getModel } from "@/config/models";
import { creditsForCost } from "@/lib/credits";
import { getAdapter, ProviderError, type OutputFile, type ProviderResult, type ReferenceImage } from "@/lib/providers";
import { extFor, putObject } from "@/lib/r2";
import { admin } from "@/lib/supabase/admin";

/** Give up on a job that has not finished after this long, and refund it. */
const MAX_JOB_AGE_MS = 20 * 60 * 1000;

export type JobRow = {
  id: string;
  user_id: string;
  model_key: string;
  lab: string;
  kind: "image" | "video";
  prompt: string;
  params: Record<string, unknown>;
  status: "queued" | "running" | "succeeded" | "failed";
  provider_ref: string | null;
  credits_charged: number;
  lab_cost_micros: number;
  lab_cost_is_actual: boolean;
  outputs: { key: string; mime: string; bytes: number }[];
  error: string | null;
  character_id: string | null;
  deleted_at: string | null;
  poll_count: number;
  next_poll_at: string | null;
  created_at: string;
  completed_at: string | null;
};

export class UserFacingError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

type StartInput = {
  userId: string;
  modelKey: string;
  prompt: string;
  /** Text actually sent to the lab (prompt plus character details). Defaults to prompt. */
  providerPrompt?: string;
  aspectRatio?: string;
  references?: ReferenceImage[];
  characterId?: string;
};

/** Reserve credits, create the job, submit to the lab. Image jobs usually finish here. */
export async function startJob(input: StartInput): Promise<JobRow> {
  const model = getModel(input.modelKey);
  const adapter = model && getAdapter(model.lab);
  if (!model || !model.enabled || !adapter) throw new UserFacingError("This model is not available.");

  const price = currentPrice(model);
  const credits = creditsForCost(price.costMicros);
  const db = admin();

  const { data: jobId, error } = await db.rpc("start_job", {
    p_user: input.userId,
    p_model_key: model.key,
    p_lab: model.lab,
    p_kind: model.kind,
    p_prompt: input.prompt,
    p_params: { aspectRatio: input.aspectRatio ?? model.defaults.aspectRatio, defaults: model.defaults },
    p_credits: credits,
    p_lab_cost_micros: price.costMicros,
    p_free_ok: model.freeEligible,
    p_character_id: input.characterId ?? null,
  } as never);
  if (error) {
    if (error.message.includes("insufficient_credits")) throw new UserFacingError("Not enough credits.", 402);
    throw error;
  }

  let result: ProviderResult;
  try {
    result = await adapter.submit({
      model,
      prompt: input.providerPrompt ?? input.prompt,
      aspectRatio: input.aspectRatio,
      references: input.references,
    });
  } catch (e) {
    result = failure(e);
  }
  try {
    return await applyResult(jobId as string, input.userId, result);
  } catch (e) {
    // Never leave credits held if saving the result fails. The cron cleanup is only a backstop.
    await refund(jobId as string, `Internal error: ${e instanceof Error ? e.message : e}`).catch(() => {});
    throw e;
  }
}

/**
 * Move a running job forward one step. Safe to call from the status route and
 * the cron tick at the same time: claim_job gives one caller a short lease.
 */
export async function advanceJob(jobId: string): Promise<JobRow | null> {
  const db = admin();
  const { data: claimed, error } = await db.rpc("claim_job", { p_job: jobId } as never);
  if (error) throw error;
  const job = (claimed as JobRow[] | null)?.[0];
  if (!job) return null; // finished already, or someone else holds the lease

  // A queued job may still be inside startJob's submit call. Only treat it as dead once it is stale.
  if (job.status === "queued" && Date.now() - Date.parse(job.created_at) < 5 * 60 * 1000) {
    await db.from("jobs").update({ locked_until: null } as never).eq("id", job.id);
    return job;
  }

  if (Date.now() - Date.parse(job.created_at) > MAX_JOB_AGE_MS) {
    await refund(job.id, "Timed out waiting for the lab");
    return load(job.id);
  }

  const model = getModel(job.model_key);
  const adapter = model && getAdapter(model.lab);
  if (!model || !adapter || !job.provider_ref) {
    await refund(job.id, "Job cannot be resumed");
    return load(job.id);
  }

  let result: ProviderResult;
  try {
    result = await adapter.poll(job.provider_ref, model);
  } catch (e) {
    result = failure(e);
    // A network blip while polling should not refund a job the lab is still rendering.
    if (result.status === "failed" && !result.permanent) {
      await reschedule(job, job.provider_ref);
      return load(job.id);
    }
  }
  return applyResult(job.id, job.user_id, result, job);
}

function failure(e: unknown): ProviderResult {
  if (e instanceof ProviderError) return { status: "failed", error: e.message, permanent: e.permanent };
  return { status: "failed", error: e instanceof Error ? e.message : String(e), permanent: false };
}

async function applyResult(jobId: string, userId: string, result: ProviderResult, prev?: JobRow): Promise<JobRow> {
  switch (result.status) {
    case "running":
      await reschedule(prev ?? { id: jobId, poll_count: 0 }, result.ref);
      break;
    case "succeeded": {
      let outputs;
      try {
        outputs = await store(userId, jobId, result.outputs);
      } catch (e) {
        // Storage failed. While polling, try again next tick (the lab still has the file).
        // On a synchronous image result there is nothing to retry from, so refund.
        if (prev?.provider_ref) await reschedule(prev, prev.provider_ref);
        else await refund(jobId, `Could not save output: ${e instanceof Error ? e.message : e}`);
        break;
      }
      const { error } = await admin().rpc("settle_job", {
        p_job: jobId,
        p_outputs: outputs,
        p_lab_cost_micros: result.actualCostMicros ?? null,
      } as never);
      if (error) throw error;
      break;
    }
    case "failed":
      await refund(jobId, result.error);
      break;
  }
  return load(jobId);
}

/** Poll quickly at first, then back off. Video usually takes one to a few minutes. */
async function reschedule(job: { id: string; poll_count: number }, ref: string) {
  const delaySec = Math.min(5 * 2 ** Math.min(job.poll_count, 4), 60);
  const { error } = await admin()
    .from("jobs")
    .update({
      status: "running",
      provider_ref: ref,
      poll_count: job.poll_count + 1,
      next_poll_at: new Date(Date.now() + delaySec * 1000).toISOString(),
      locked_until: null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", job.id);
  if (error) throw error;
}

async function refund(jobId: string, reason: string) {
  const { error } = await admin().rpc("refund_job", { p_job: jobId, p_error: reason } as never);
  if (error) throw error;
}

async function store(userId: string, jobId: string, files: OutputFile[]) {
  return Promise.all(
    files.map(async (f, i) => {
      const key = `u/${userId}/jobs/${jobId}/${i}.${extFor(f.mime)}`;
      await putObject(key, f.bytes, f.mime);
      return { key, mime: f.mime, bytes: f.bytes.byteLength };
    }),
  );
}

export async function load(jobId: string): Promise<JobRow> {
  const { data, error } = await admin().from("jobs").select("*").eq("id", jobId).single();
  if (error) throw error;
  return data as JobRow;
}

/**
 * Called by the cron tick: advance every running job that is due, and clean up
 * jobs left queued by a request that died mid-submit (they get refunded).
 */
export async function advanceDueJobs(limit = 10) {
  const now = new Date();
  const staleQueued = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const db = admin();
  const [running, queued] = await Promise.all([
    db.from("jobs").select("id").eq("status", "running").lte("next_poll_at", now.toISOString()).order("next_poll_at").limit(limit),
    db.from("jobs").select("id").eq("status", "queued").lt("created_at", staleQueued).limit(limit),
  ]);
  if (running.error) throw running.error;
  if (queued.error) throw queued.error;
  const ids = [...(running.data as { id: string }[]), ...(queued.data as { id: string }[])].map((r) => r.id);
  const results = await Promise.allSettled(ids.map(advanceJob));
  return { checked: ids.length, failed: results.filter((r) => r.status === "rejected").length };
}
