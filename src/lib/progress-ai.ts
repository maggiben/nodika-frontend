export type ProgressAiProvider = "openai" | "anthropic";

export type ProgressAiSettings = {
  provider: ProgressAiProvider;
  model: string;
};

export const OPENAI_PROGRESS_MODELS = ["gpt-4o-mini", "gpt-4o"] as const;
export const ANTHROPIC_PROGRESS_MODELS = [
  "claude-sonnet-4-5",
  "claude-haiku-4-5",
  "claude-sonnet-5",
] as const;

export const DEFAULT_PROGRESS_AI_MODELS: Record<ProgressAiProvider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-sonnet-4-5",
};

export function modelsForProvider(
  provider: ProgressAiProvider,
): readonly string[] {
  return provider === "openai"
    ? OPENAI_PROGRESS_MODELS
    : ANTHROPIC_PROGRESS_MODELS;
}

export function isProgressAiProvider(
  value: unknown,
): value is ProgressAiProvider {
  return value === "openai" || value === "anthropic";
}

export function isAllowedProgressAiModel(
  provider: ProgressAiProvider,
  model: string,
): boolean {
  return modelsForProvider(provider).includes(model);
}

export function isProgressAiSettings(
  value: unknown,
): value is ProgressAiSettings {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (!isProgressAiProvider(record.provider)) {
    return false;
  }
  if (typeof record.model !== "string" || !record.model.trim()) {
    return false;
  }
  return isAllowedProgressAiModel(record.provider, record.model.trim());
}

export function defaultProgressAi(
  current?: ProgressAiSettings | null,
): ProgressAiSettings {
  if (current && isProgressAiSettings(current)) {
    return current;
  }
  return {
    provider: "openai",
    model: DEFAULT_PROGRESS_AI_MODELS.openai,
  };
}

export function modelForProviderChange(
  provider: ProgressAiProvider,
  previousModel: string,
): string {
  if (isAllowedProgressAiModel(provider, previousModel)) {
    return previousModel;
  }
  return DEFAULT_PROGRESS_AI_MODELS[provider];
}
