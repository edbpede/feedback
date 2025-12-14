import type { Component } from "solid-js";
import { t } from "@lib/i18n";
import { ThemeSwitcher } from "@components/ThemeSwitcher";
import { LanguageSwitcher } from "@components/LanguageSwitcher";
import { CardExternalLinks } from "@components/CardExternalLinks";
import { Logo } from "@components/Logo";
import { Card, CardContent } from "@components/ui/card";
import { Button } from "@components/ui/button";

interface WelcomeStepProps {
  onStart: () => void;
}

export const WelcomeStep: Component<WelcomeStepProps> = (props) => {
  return (
    <Card class="w-full max-w-lg text-center">
      <CardContent class="pt-6">
        <div class="mb-4 flex items-center justify-between">
          <CardExternalLinks />
          <div class="flex gap-1">
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
        </div>

        <Logo size="xl" class="mx-auto mb-6" />

        <h1 class="mb-4 text-2xl font-bold">{t("onboarding.welcome.title")}</h1>
        <p class="text-muted-foreground mb-8">{t("onboarding.welcome.description")}</p>

        <Button onClick={() => props.onStart()} size="lg" class="w-full sm:w-auto">
          <span class="mr-2">🚀</span>
          {t("onboarding.welcome.startButton")}
        </Button>
      </CardContent>
    </Card>
  );
};
