import type { VoidComponent } from "solid-js";
import { For } from "solid-js";
import { t } from "@lib/i18n";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@components/ui/collapsible";
import { Tooltip, TooltipTrigger, TooltipContent } from "@components/ui/tooltip";

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
    <div class="border-primary/20 bg-primary/5 mb-6 rounded-lg border px-4 py-3">
      {/* Main banner row */}
      <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {/* Title with icon */}
        <div class="flex items-center gap-2">
          <span class="i-carbon-security text-primary text-lg" />
          <span class="text-sm font-semibold">
            {t("onboarding.steps.modelSelection.privacy.title")}
          </span>
        </div>

        {/* Divider (hidden on mobile) */}
        <span class="text-border hidden sm:block">|</span>

        {/* Benefits as icon + label with tooltips */}
        <div class="flex flex-wrap items-center justify-center gap-4">
          <For each={benefits}>
            {(benefit) => (
              <Tooltip>
                <TooltipTrigger class="flex cursor-help items-center gap-1.5">
                  <span class={`${benefit.icon} text-primary text-sm`} />
                  <span class="text-xs font-medium">{t(benefit.titleKey)}</span>
                </TooltipTrigger>
                <TooltipContent class="max-w-xs">
                  <p>{t(benefit.descKey)}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </For>
        </div>
      </div>

      {/* Collapsible details */}
      <Collapsible>
        <CollapsibleTrigger class="text-muted-foreground hover:text-foreground group mt-2 flex w-full items-center justify-center gap-2 py-1 text-xs transition-colors">
          <span>{t("onboarding.steps.modelSelection.privacy.expandTrigger")}</span>
          <span class="i-carbon-chevron-down text-xs transition-transform duration-200 group-data-[expanded]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div class="bg-muted/30 mt-3 space-y-3 rounded-md p-3 text-xs">
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
            <div class="border-border/50 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-2">
              <span class="text-muted-foreground">
                {t("onboarding.steps.modelSelection.privacy.learnMoreLabel")}
              </span>
              <a
                href="https://techcommunity.microsoft.com/blog/azureconfidentialcomputingblog/azure-ai-confidential-inferencing-technical-deep-dive/4253150"
                class="text-primary inline-flex items-center gap-0.5 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("onboarding.steps.modelSelection.privacy.sourceAzure")}
                <span class="i-carbon-arrow-up-right text-[10px]" />
              </a>
              <a
                href="https://cloud.google.com/blog/products/identity-security/how-confidential-computing-lays-the-foundation-for-trusted-ai"
                class="text-primary inline-flex items-center gap-0.5 hover:underline"
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
