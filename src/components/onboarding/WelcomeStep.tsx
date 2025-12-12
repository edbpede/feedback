import type { Component } from "solid-js";
import { t } from "@lib/i18n";
import { ThemeSwitcher } from "@components/ThemeSwitcher";
import { LanguageSwitcher } from "@components/LanguageSwitcher";
import { Card, CardContent } from "@components/ui/card";
import { Button } from "@components/ui/button";

interface WelcomeStepProps {
  onStart: () => void;
}

export const WelcomeStep: Component<WelcomeStepProps> = (props) => {
  return (
    <Card class="w-full max-w-lg text-center">
      <CardContent class="pt-6">
        <div class="flex justify-end gap-1 mb-4">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>

        <div class="text-6xl mb-6">👋</div>

        <h1 class="text-2xl font-bold mb-4">{t("onboarding.welcome.title")}</h1>
        <p class="text-muted-foreground mb-8">
          {t("onboarding.welcome.description")}
        </p>

        <Button
          onClick={() => props.onStart()}
          size="lg"
          class="w-full sm:w-auto"
        >
          <span class="mr-2">🚀</span>
          {t("onboarding.welcome.startButton")}
        </Button>
      </CardContent>
    </Card>
  );
};
