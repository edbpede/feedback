import { createSignal, Show, type Component } from "solid-js";
import type { ApiResponse } from "@lib/types";
import { t } from "@lib/i18n";
import { LanguageSwitcher } from "@components/LanguageSwitcher";
import { ThemeSwitcher } from "@components/ThemeSwitcher";
import { CardExternalLinks } from "@components/CardExternalLinks";
import { Logo } from "@components/Logo";
import { Card, CardContent } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";

interface PasswordGateProps {
  onSuccess: () => void;
}

export const PasswordGate: Component<PasswordGateProps> = (props) => {
  // IMPORTANT: Never destructure props in SolidJS - it breaks reactivity
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password() }),
      });

      const result = (await response.json()) as ApiResponse<unknown>;

      if (result.success) {
        props.onSuccess(); // Access props directly, never destructure
      } else {
        setError(result.error);
      }
    } catch {
      setError(t("auth.connectionError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="flex items-center justify-center min-h-screen p-4">
      <Card class="w-full max-w-lg text-center">
        <CardContent class="pt-6">
          <div class="flex justify-between items-center mb-4">
            <CardExternalLinks />
            <div class="flex gap-1">
              <ThemeSwitcher />
              <LanguageSwitcher />
            </div>
          </div>

          <Logo size="xl" class="mx-auto mb-6" />

          <h1 class="text-2xl font-bold mb-4">{t("auth.title")}</h1>
          <p class="text-muted-foreground mb-8">{t("auth.description")}</p>

          <form onSubmit={handleSubmit} class="space-y-4">
            <Input
              type="password"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              placeholder={t("auth.passwordPlaceholder")}
              disabled={isLoading()}
              autofocus
            />

            <Show when={error()}>
              <p class="text-destructive text-sm">{error()}</p>
            </Show>

            <Button type="submit" class="w-full" disabled={isLoading() || !password()}>
              <Show when={isLoading()}>
                <span class="i-carbon-loading animate-spin inline-block mr-2" />
              </Show>
              {isLoading() ? t("auth.authenticating") : t("auth.submitButton")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
