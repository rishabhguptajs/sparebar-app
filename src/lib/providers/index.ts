import type { Lab } from "@/config/models";
import { alibaba } from "./alibaba";
import { google } from "./google";
import { minimax } from "./minimax";
import { xai } from "./xai";
import type { ProviderAdapter } from "./types";

// Register a lab here once its adapter exists. Models for unregistered labs stay unavailable.
const ADAPTERS: Partial<Record<Lab, ProviderAdapter>> = {
  google,
  xai,
  minimax,
  alibaba,
};

export function getAdapter(lab: Lab): ProviderAdapter | undefined {
  return ADAPTERS[lab];
}

export * from "./types";
