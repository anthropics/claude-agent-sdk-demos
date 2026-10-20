import Anthropic from "@anthropic-ai/sdk";

const DEFAULT_MODEL_MAP: Record<string, string> = {
  opus: "claude-opus-4-20250514",
  sonnet: "claude-sonnet-4-20250514",
  haiku: "claude-3-5-haiku-20241022"
};

export const MINIMAX_MODELS = ["MiniMax-M3.1-Flash", "MiniMax-M3"] as const;

export const MINIMAX_ENDPOINTS = {
  global_en: "https://api.minimax.io/anthropic",
  cn_zh: "https://api.minimaxi.com/anthropic"
} as const;

type MiniMaxRegion = keyof typeof MINIMAX_ENDPOINTS;

interface LlmEnvironment {
  [key: string]: string | undefined;
}

export interface LlmClientConfig {
  apiKey: string | undefined;
  baseURL?: string;
  model: string;
}

export function resolveLlmClientConfig(
  requestedModel?: string,
  environment: LlmEnvironment = process.env
): LlmClientConfig {
  const provider = environment.LLM_PROVIDER?.trim().toLowerCase();

  if (!provider || provider === "anthropic") {
    const model = requestedModel || "haiku";
    return {
      apiKey: environment.ANTHROPIC_API_KEY,
      model: DEFAULT_MODEL_MAP[model] || model
    };
  }

  if (provider !== "minimax") {
    throw new Error(`Unsupported LLM_PROVIDER value: ${environment.LLM_PROVIDER}`);
  }

  const apiKey = environment.MINIMAX_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("MINIMAX_API_KEY is required when LLM_PROVIDER is MiniMax");
  }

  const region = environment.MINIMAX_REGION?.trim() || "global_en";
  const baseURL = MINIMAX_ENDPOINTS[region as MiniMaxRegion];
  if (!baseURL) {
    throw new Error(
      `MINIMAX_REGION must be one of: ${Object.keys(MINIMAX_ENDPOINTS).join(", ")}`
    );
  }

  const configuredModel = environment.MINIMAX_MODEL?.trim();
  const perCallModel = requestedModel?.trim();

  return {
    apiKey,
    baseURL,
    // Recommendations are not an allowlist: preserve explicit legacy/custom IDs.
    model: perCallModel && !Object.prototype.hasOwnProperty.call(DEFAULT_MODEL_MAP, perCallModel)
      ? perCallModel
      : configuredModel || MINIMAX_MODELS[0]
  };
}

export function createLlmClient(requestedModel?: string): {
  client: Anthropic;
  model: string;
} {
  const config = resolveLlmClientConfig(requestedModel);
  return {
    client: new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseURL
    }),
    model: config.model
  };
}
