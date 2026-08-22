<script lang="ts">
  import AIProviderLogo from "@components/AIProviderLogo.svelte";
  import { getFallbackModels } from "@config/models";
  import { t } from "@lib/i18n";

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
  let { failedModelId, subject, onSelectModel }: FallbackModelSelectorProps = $props();

  const fallbackData = $derived(getFallbackModels(failedModelId, subject));
</script>

<div class="mt-4">
  <p class="text-muted-foreground mb-3 text-sm">{t("chat.fallbackModelSelector.title")}</p>
  <div class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
    {#each fallbackData.models as model (model.id)}
      {@const isRecommended = model.id === fallbackData.recommendedId}
      <button
        type="button"
        onclick={() => onSelectModel(model.id)}
        class="border-border bg-background hover:border-primary hover:bg-accent/30 focus:ring-ring relative flex flex-shrink-0 items-center gap-2 rounded-lg border px-3 py-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
      >
        {#if isRecommended}
          <span
            class="bg-primary text-primary-foreground absolute -top-2.5 left-2 rounded-full px-2 py-0.5 text-xs font-medium"
          >
            {t("chat.fallbackModelSelector.recommended")}
          </span>
        {/if}
        <AIProviderLogo provider={model.provider} size="xs" />
        <span class="whitespace-nowrap text-sm font-medium">{t(model.nameKey)}</span>
      </button>
    {/each}
  </div>
</div>
