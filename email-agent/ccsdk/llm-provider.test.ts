import {
  MINIMAX_ENDPOINTS,
  MINIMAX_MODELS,
  resolveLlmClientConfig
} from "./llm-provider";

const minimaxEnvironment = {
  LLM_PROVIDER: "MiniMax",
  MINIMAX_API_KEY: "test-key"
};

describe("resolveLlmClientConfig", () => {
  it("preserves the existing default model aliases", () => {
    expect(resolveLlmClientConfig("sonnet", { ANTHROPIC_API_KEY: "test-key" })).toEqual({
      apiKey: "test-key",
      model: "claude-sonnet-4-20250514"
    });
    expect(resolveLlmClientConfig(undefined, {}).model).toBe("claude-3-5-haiku-20241022");
    expect(resolveLlmClientConfig("custom-model", {}).model).toBe("custom-model");
  });

  it("recommends only Flash and M3, with Flash first", () => {
    expect(MINIMAX_MODELS).toEqual(["MiniMax-M3.1-Flash", "MiniMax-M3"]);
  });

  it.each([undefined, "", "haiku", "sonnet", "opus"])(
    "uses the global MiniMax endpoint and Flash by default for %s",
    (requestedModel) => {
      expect(resolveLlmClientConfig(requestedModel, minimaxEnvironment)).toEqual({
        apiKey: "test-key",
        baseURL: MINIMAX_ENDPOINTS.global_en,
        model: "MiniMax-M3.1-Flash"
      });
    }
  );

  it("supports the CN endpoint and M3", () => {
    expect(resolveLlmClientConfig("MiniMax-M3", {
      ...minimaxEnvironment,
      MINIMAX_REGION: "cn_zh"
    })).toEqual({
      apiKey: "test-key",
      baseURL: MINIMAX_ENDPOINTS.cn_zh,
      model: "MiniMax-M3"
    });
  });

  it.each(["MiniMax-M3.1-Flash", "MiniMax-M3", "MiniMax-M2.7", "custom-model"])(
    "preserves configured and per-call model ID %s",
    (model) => {
      const environment = { ...minimaxEnvironment, MINIMAX_MODEL: model };
      expect(resolveLlmClientConfig(undefined, environment).model).toBe(model);
      expect(resolveLlmClientConfig("haiku", environment).model).toBe(model);
      expect(resolveLlmClientConfig(model, {
        ...minimaxEnvironment,
        MINIMAX_MODEL: "another-custom-model"
      }).model).toBe(model);
    }
  );

  it("treats whitespace-only configuration as unset", () => {
    expect(resolveLlmClientConfig(" ", {
      LLM_PROVIDER: " minimax ",
      MINIMAX_API_KEY: " test-key ",
      MINIMAX_MODEL: " ",
      MINIMAX_REGION: " "
    })).toEqual({
      apiKey: "test-key",
      baseURL: MINIMAX_ENDPOINTS.global_en,
      model: "MiniMax-M3.1-Flash"
    });
  });

  it("rejects unsupported MiniMax regions", () => {
    expect(() => resolveLlmClientConfig(undefined, {
      ...minimaxEnvironment,
      MINIMAX_REGION: "unsupported"
    })).toThrow("MINIMAX_REGION must be one of: global_en, cn_zh");
  });

  it("requires a MiniMax API key", () => {
    expect(() => resolveLlmClientConfig(undefined, {
      LLM_PROVIDER: "MiniMax"
    })).toThrow("MINIMAX_API_KEY is required");
  });

  it("rejects unknown providers", () => {
    expect(() => resolveLlmClientConfig(undefined, {
      LLM_PROVIDER: "unsupported"
    })).toThrow("Unsupported LLM_PROVIDER value");
  });
});
