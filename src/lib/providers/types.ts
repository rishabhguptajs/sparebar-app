import type { Kind, Lab, ModelConfig } from "@/config/models";

/** The model config as adapters receive it. */
export type ModelConfigLike = ModelConfig;

export type ReferenceImage = { mime: string; base64: string };

export type GenerateInput = {
  model: ModelConfig;
  prompt: string;
  aspectRatio?: string;
  references?: ReferenceImage[];
};

export type OutputFile = { mime: string; bytes: Uint8Array };

/** What the lab told us, normalised. */
export type ProviderResult =
  | { status: "running"; ref: string }
  | { status: "succeeded"; ref?: string; outputs: OutputFile[]; actualCostMicros?: number }
  | { status: "failed"; ref?: string; error: string; /** true when retrying could not help */ permanent: boolean };

export interface ProviderAdapter {
  lab: Lab;
  /** Start a generation. Image models may finish in this call. */
  submit(input: GenerateInput): Promise<ProviderResult>;
  /** Check a running generation started by submit. */
  poll(ref: string, model: ModelConfig): Promise<ProviderResult>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly permanent: boolean,
    readonly status?: number,
    /** Set by an adapter when the lab's structured error code says the account has a billing problem. */
    readonly billing = false,
  ) {
    super(message);
  }
}

export type { Kind };
