import {
  MINIMAX_ENDPOINTS,
  MINIMAX_MODELS,
  resolveLlmClientConfig
} from "./llm-provider";

describe("resolveLlmClientConfig", () => {
  it("preserves the existing default model aliases", () => {
    expect(resolveLlmClientConfig("sonnet", { ANTHROPIC_API_KEY: "test-key" })).toEqual({
      apiKey: "test-key",
      model: "claude-sonnet-4-20250514"
    });
  });

  it("uses the global MiniMax endpoint and primary model by default", () => {
    expect(resolveLlmClientConfig(undefined, {
      LLM_PROVIDER: "MiniMax",
      MINIMAX_API_KEY: "test-key"
    })).toEqual({
      apiKey: "test-key",
      baseURL: MINIMAX_ENDPOINTS.global_en,
      model: MINIMAX_MODELS[0]
    });
  });

  it("supports the CN endpoint and the second current model", () => {
    expect(resolveLlmClientConfig("MiniMax-M2.7", {
      LLM_PROVIDER: "MiniMax",
      MINIMAX_API_KEY: "test-key",
      MINIMAX_REGION: "cn_zh"
    })).toEqual({
      apiKey: "test-key",
      baseURL: MINIMAX_ENDPOINTS.cn_zh,
      model: MINIMAX_MODELS[1]
    });
  });

  it("rejects unsupported MiniMax regions", () => {
    expect(() => resolveLlmClientConfig(undefined, {
      LLM_PROVIDER: "MiniMax",
      MINIMAX_API_KEY: "test-key",
      MINIMAX_REGION: "unsupported"
    })).toThrow("MINIMAX_REGION must be one of: global_en, cn_zh");
  });

  it("rejects unsupported configured MiniMax models", () => {
    expect(() => resolveLlmClientConfig(undefined, {
      LLM_PROVIDER: "MiniMax",
      MINIMAX_API_KEY: "test-key",
      MINIMAX_MODEL: "unsupported"
    })).toThrow("MINIMAX_MODEL must be one of: MiniMax-M3, MiniMax-M2.7");
  });
});
