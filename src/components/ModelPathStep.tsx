import { createSignal, onMount, type Component, For, Show } from "solid-js";
import { t } from "@lib/i18n";
import { ThemeSwitcher } from "@components/ThemeSwitcher";
import { LanguageSwitcher } from "@components/LanguageSwitcher";
import { CardExternalLinks } from "@components/CardExternalLinks";
import { Logo } from "@components/Logo";
import { Card, CardContent } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@components/ui/tooltip";
import { StepIndicator } from "@components/onboarding/StepIndicator";
import { EnhancedQualityPasswordDialog } from "@components/EnhancedQualityPasswordDialog";
import type { ModelPath, ApiResponse, EnhancedConfigResponse } from "@lib/types";
import { getTheme } from "@lib/theme";
import { getModelsForPath, getProviderLogoPath, type AIProvider } from "@config/models";

interface ModelPathStepProps {
  onContinue: (path: ModelPath) => void;
  onBack?: () => void;
  currentStep?: number;
  totalSteps?: number;
  initialPath?: ModelPath;
}

interface PathOption {
  id: ModelPath;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  features: { key: string; warning?: boolean }[];
  providers: AIProvider[];
  badge?: string;
}

const PATH_OPTIONS: PathOption[] = [
  {
    id: "privacy-first",
    titleKey: "modelPath.privacyFirst.title",
    descriptionKey: "modelPath.privacyFirst.description",
    icon: "i-carbon-security",
    badge: "modelPath.privacyFirst.badge",
    features: [
      { key: "modelPath.privacyFirst.features.tee" },
      { key: "modelPath.privacyFirst.features.fast" },
      { key: "modelPath.privacyFirst.features.gdpr" },
    ],
    providers: ["DeepSeek", "Alibaba", "Zhipu AI", "Google"],
  },
  {
    id: "enhanced-quality",
    titleKey: "modelPath.enhancedQuality.title",
    descriptionKey: "modelPath.enhancedQuality.description",
    icon: "i-carbon-ibm-watsonx-assistant",
    features: [
      { key: "modelPath.enhancedQuality.features.quality" },
      { key: "modelPath.enhancedQuality.features.models" },
      { key: "modelPath.enhancedQuality.features.anonymization", warning: true },
    ],
    providers: ["OpenAI", "Anthropic", "xAI", "Google"],
  },
];

export const ModelPathStep: Component<ModelPathStepProps> = (props) => {
  const [selectedPath, setSelectedPath] = createSignal<ModelPath>(
    props.initialPath ?? "privacy-first"
  );
  const theme = () => getTheme();

  // Enhanced quality config state
  const [enhancedConfigured, setEnhancedConfigured] = createSignal(true); // Default true to avoid flash
  const [enhancedAuthenticated, setEnhancedAuthenticated] = createSignal(false);
  const [showPasswordDialog, setShowPasswordDialog] = createSignal(false);
  const [isCheckingConfig, setIsCheckingConfig] = createSignal(true);

  // Check enhanced quality config on mount
  onMount(async () => {
    try {
      const response = await fetch("/api/check-enhanced");
      const result = (await response.json()) as ApiResponse<EnhancedConfigResponse>;
      if (result.success) {
        setEnhancedConfigured(result.data.configured);
        setEnhancedAuthenticated(result.data.authenticated);
      }
    } catch {
      // On error, assume not configured for safety
      setEnhancedConfigured(false);
    } finally {
      setIsCheckingConfig(false);
    }
  });

  const handleContinue = () => {
    // If privacy-first is selected, proceed directly
    if (selectedPath() === "privacy-first") {
      props.onContinue(selectedPath());
      return;
    }

    // Enhanced quality selected - check if already authenticated
    if (enhancedAuthenticated()) {
      props.onContinue(selectedPath());
      return;
    }

    // Need to authenticate - show password dialog
    setShowPasswordDialog(true);
  };

  const handlePasswordSuccess = () => {
    setEnhancedAuthenticated(true);
    setShowPasswordDialog(false);
    props.onContinue(selectedPath());
  };

  // Check if enhanced quality option should be disabled
  const isEnhancedDisabled = () => !enhancedConfigured() && !isCheckingConfig();

  return (
    <Card class="w-full max-w-3xl">
      <CardContent class="pt-6">
        {/* Header with controls */}
        <div class="mb-4 flex items-center justify-between">
          <CardExternalLinks />
          <div class="flex gap-1">
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
        </div>

        {/* Logo */}
        <Logo size="lg" class="mx-auto mb-6" />

        {/* Step indicator */}
        <Show when={props.currentStep !== undefined && props.totalSteps !== undefined}>
          <StepIndicator
            currentStep={props.currentStep!}
            totalSteps={props.totalSteps!}
            class="mb-6"
          />
        </Show>

        {/* Title and description */}
        <h1 class="mb-2 text-center text-2xl font-bold">{t("modelPath.title")}</h1>
        <p class="text-muted-foreground mb-8 text-center">{t("modelPath.description")}</p>

        {/* Path selection cards */}
        <div class="mb-8 grid gap-4 sm:grid-cols-2">
          <For each={PATH_OPTIONS}>
            {(option) => {
              const isSelected = () => selectedPath() === option.id;
              const models = () => getModelsForPath(option.id);
              const isDisabled = () => option.id === "enhanced-quality" && isEnhancedDisabled();

              // Wrap in tooltip if disabled
              const cardContent = () => (
                <button
                  type="button"
                  onClick={() => !isDisabled() && setSelectedPath(option.id)}
                  disabled={isDisabled()}
                  class={`relative flex w-full flex-col rounded-xl border-2 p-5 text-left transition-all ${
                    isDisabled()
                      ? "border-border/50 cursor-not-allowed opacity-50"
                      : isSelected()
                        ? "border-primary bg-accent/20 ring-primary/20 ring-2"
                        : "border-border hover:border-muted-foreground"
                  }`}
                >
                  {/* Badge */}
                  {option.badge && (
                    <span class="bg-primary text-primary-foreground absolute -top-2.5 left-4 rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {t(option.badge as Parameters<typeof t>[0])}
                    </span>
                  )}

                  {/* Icon */}
                  <div class="mb-4 flex items-center justify-center">
                    <div
                      class={`flex h-14 w-14 items-center justify-center rounded-full ${
                        isSelected() ? "bg-primary/10" : "bg-muted"
                      }`}
                    >
                      <span
                        class={`${option.icon} text-2xl ${isSelected() ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 class="mb-2 text-center text-lg font-semibold">
                    {t(option.titleKey as Parameters<typeof t>[0])}
                  </h3>

                  {/* Description */}
                  <p class="text-muted-foreground mb-4 text-center text-sm">
                    {t(option.descriptionKey as Parameters<typeof t>[0])}
                  </p>

                  {/* Features */}
                  <ul class="mb-4 space-y-2">
                    <For each={option.features}>
                      {(feature) => (
                        <li class="flex items-center gap-2 text-sm">
                          <span
                            class={`${feature.warning ? "i-carbon-warning text-amber-500" : "i-carbon-checkmark-filled text-emerald-500"}`}
                          />
                          <span class={feature.warning ? "text-amber-600 dark:text-amber-400" : ""}>
                            {t(feature.key as Parameters<typeof t>[0])}
                          </span>
                        </li>
                      )}
                    </For>
                  </ul>

                  {/* Provider logos */}
                  <div class="border-border/50 mt-auto flex flex-wrap items-center justify-center gap-2 border-t pt-4">
                    <For each={option.providers.slice(0, 4)}>
                      {(provider) => (
                        <img
                          src={getProviderLogoPath(provider, theme())}
                          alt={provider}
                          class="h-5 w-5 object-contain opacity-60"
                          title={provider}
                        />
                      )}
                    </For>
                  </div>

                  {/* Selection indicator */}
                  <Show when={isSelected() && !isDisabled()}>
                    <div class="bg-primary absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full">
                      <span class="i-carbon-checkmark text-primary-foreground text-sm" />
                    </div>
                  </Show>

                  {/* Disabled badge */}
                  <Show when={isDisabled()}>
                    <div class="bg-muted text-muted-foreground absolute -right-2 -top-2 rounded-full px-2 py-0.5 text-xs font-medium">
                      {t("enhancedAuth.notConfigured")}
                    </div>
                  </Show>
                </button>
              );

              return (
                <Show when={isDisabled()} fallback={cardContent()}>
                  <Tooltip>
                    <TooltipTrigger as="div" class="w-full">
                      {cardContent()}
                    </TooltipTrigger>
                    <TooltipContent>{t("enhancedAuth.notConfiguredTooltip")}</TooltipContent>
                  </Tooltip>
                </Show>
              );
            }}
          </For>
        </div>

        {/* Navigation buttons */}
        <div class="flex justify-center gap-4">
          <Show when={props.onBack}>
            <Button onClick={props.onBack} variant="outline" size="lg">
              <span class="i-carbon-arrow-left mr-2" />
              {t("common.back")}
            </Button>
          </Show>
          <Button onClick={handleContinue} size="lg" class="min-w-[200px]">
            {t("modelPath.continueButton")}
            <span class="i-carbon-arrow-right ml-2" />
          </Button>
        </div>
      </CardContent>

      {/* Password dialog for enhanced quality */}
      <EnhancedQualityPasswordDialog
        open={showPasswordDialog()}
        onOpenChange={setShowPasswordDialog}
        onSuccess={handlePasswordSuccess}
      />
    </Card>
  );
};
