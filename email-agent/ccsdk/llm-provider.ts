import Anthropic from "@anthropic-ai/sdk";

const DEFAULT_MODEL_MAP: Record<string, string> = {
  opus: "claude-opus-4-20250514",
  sonnet: "claude-sonnet-4-20250514",
  haiku: "claude-3-5-haiku-20241022"
};

export const MINIMAX_MODELS = ["MiniMax-M3", "MiniMax-M2.7"] as const;

export const MINIMAX_ENDPOINTS = {
  global_en: "https://api.minimax.io/anthropic",
  cn_zh: "https://api.minimaxi.com/anthropic"
} as const;

type MiniMaxModel = typeof MINIMAX_MODELS[number];
type MiniMaxRegion = keyof typeof MINIMAX_ENDPOINTS;

interface LlmEnvironment {
  [key: string]: string | undefined;
}

export interface LlmClientConfig {
  apiKey: string | undefined;
  baseURL?: string;
  model: string;
}

function isMiniMaxModel(model: string): model is MiniMaxModel {
  return (MINIMAX_MODELS as readonly string[]).includes(model);
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
  if (configuredModel && !isMiniMaxModel(configuredModel)) {
    throw new Error(`MINIMAX_MODEL must be one of: ${MINIMAX_MODELS.join(", ")}`);
  }

  const perCallModel = requestedModel?.trim();
  if (
    perCallModel &&
    !DEFAULT_MODEL_MAP[perCallModel] &&
    !isMiniMaxModel(perCallModel)
  ) {
    throw new Error(`Unsupported MiniMax model: ${perCallModel}`);
  }

  return {
    apiKey,
    baseURL,
    model: perCallModel && isMiniMaxModel(perCallModel)
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
