import { For, Show, type Component } from "solid-js";
import { t } from "@lib/i18n";
import { AIProviderLogo } from "@components/AIProviderLogo";
import { getFallbackModels, type ModelConfig } from "@config/models";

interface FallbackModelSelectorProps {
  /** The model ID that failed and should be excluded from options */
  failedModelId: string;
  /** User's subject for determining recommended model */
  subject?: string;
  /** Callback when user selects a fallback model */
  onSelectModel: (modelId: string) => void;
}

/**
 * Displays a horizontal row of fallback model options when the primary model fails.
 * Shows provider logos and highlights the recommended model for the user's subject.
 */
export const FallbackModelSelector: Component<FallbackModelSelectorProps> = (props) => {
  const fallbackData = () => getFallbackModels(props.failedModelId, props.subject);

  return (
    <div class="mt-4">
      <p class="text-sm text-muted-foreground mb-3">
        {t("chat.fallbackModelSelector.title")}
      </p>
      <div class="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        <For each={fallbackData().models}>
          {(model: ModelConfig) => {
            const isRecommended = () => model.id === fallbackData().recommendedId;

            return (
              <button
                type="button"
                onClick={() => props.onSelectModel(model.id)}
                class="relative flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:border-primary hover:bg-accent/30 transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <Show when={isRecommended()}>
                  <span class="absolute -top-2 left-2 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded-full">
                    {t("chat.fallbackModelSelector.recommended")}
                  </span>
                </Show>
                <AIProviderLogo provider={model.provider} size="xs" />
                <span class="text-sm font-medium whitespace-nowrap">
                  {t(model.nameKey)}
                </span>
              </button>
            );
          }}
        </For>
      </div>
    </div>
  );
};
