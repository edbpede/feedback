import type { VoidComponent } from "solid-js";
import { For } from "solid-js";
import { t } from "@lib/i18n";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@components/ui/collapsible";

const benefits = [
  {
    icon: "i-carbon-locked",
    titleKey: "onboarding.steps.modelSelection.privacy.benefits.encrypted.title",
    descKey: "onboarding.steps.modelSelection.privacy.benefits.encrypted.description",
  },
  {
    icon: "i-carbon-checkmark-outline",
    titleKey: "onboarding.steps.modelSelection.privacy.benefits.gdpr.title",
    descKey: "onboarding.steps.modelSelection.privacy.benefits.gdpr.description",
  },
  {
    icon: "i-carbon-chip",
    titleKey: "onboarding.steps.modelSelection.privacy.benefits.hardware.title",
    descKey: "onboarding.steps.modelSelection.privacy.benefits.hardware.description",
  },
] as const;

export const PrivacyInfoBox: VoidComponent = () => {
  return (
    <div class="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
      {/* Header */}
      <div class="flex items-center gap-3 mb-4">
        <span class="i-carbon-security text-primary text-xl flex-shrink-0" />
        <div>
          <h3 class="font-semibold text-sm">
            {t("onboarding.steps.modelSelection.privacy.title")}
          </h3>
          <p class="text-xs text-muted-foreground">
            {t("onboarding.steps.modelSelection.privacy.subtitle")}
          </p>
        </div>
      </div>

      {/* Benefits Grid - Always Visible */}
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <For each={benefits}>
          {(benefit) => (
            <div class="bg-background rounded-md p-3 text-center shadow-sm">
              <span class={`${benefit.icon} text-primary text-lg mb-1 block mx-auto`} />
              <p class="text-xs font-medium">{t(benefit.titleKey)}</p>
              <p class="text-xs text-muted-foreground mt-1 leading-snug">
                {t(benefit.descKey)}
              </p>
            </div>
          )}
        </For>
      </div>

      {/* Collapsible Details */}
      <Collapsible>
        <CollapsibleTrigger class="w-full flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors group">
          <span>{t("onboarding.steps.modelSelection.privacy.expandTrigger")}</span>
          <span class="i-carbon-chevron-down text-xs transition-transform duration-200 group-data-[expanded]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div class="mt-3 p-3 bg-muted/30 rounded-md text-xs space-y-3">
            <p class="text-muted-foreground leading-relaxed">
              {t("onboarding.steps.modelSelection.privacy.details.teeExplanation")}
            </p>
            <div class="flex flex-col gap-1.5">
              <p class="text-muted-foreground">
                <span class="i-carbon-flash text-primary mr-1 inline-block align-middle" />
                {t("onboarding.steps.modelSelection.privacy.details.performance")}
              </p>
              <p class="text-muted-foreground">
                <span class="i-carbon-certificate text-primary mr-1 inline-block align-middle" />
                {t("onboarding.steps.modelSelection.privacy.details.verification")}
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 border-t border-border/50">
              <span class="text-muted-foreground">
                {t("onboarding.steps.modelSelection.privacy.learnMoreLabel")}
              </span>
              <a
                href="https://techcommunity.microsoft.com/blog/azureconfidentialcomputingblog/azure-ai-confidential-inferencing-technical-deep-dive/4253150"
                class="text-primary hover:underline inline-flex items-center gap-0.5"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("onboarding.steps.modelSelection.privacy.sourceAzure")}
                <span class="i-carbon-arrow-up-right text-[10px]" />
              </a>
              <a
                href="https://cloud.google.com/blog/products/identity-security/how-confidential-computing-lays-the-foundation-for-trusted-ai"
                class="text-primary hover:underline inline-flex items-center gap-0.5"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("onboarding.steps.modelSelection.privacy.sourceGoogle")}
                <span class="i-carbon-arrow-up-right text-[10px]" />
              </a>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
