import { createSignal, Show, type Component } from "solid-js";
import type { ApiResponse } from "@lib/types";
import { t } from "@lib/i18n";
import { LanguageSwitcher } from "@components/LanguageSwitcher";
import { ThemeSwitcher } from "@components/ThemeSwitcher";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@components/ui/card";
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
      <Card class="w-full max-w-md">
        <CardHeader>
          <div class="flex justify-between items-start">
            <CardTitle>{t("auth.title")}</CardTitle>
            <div class="flex items-center gap-1">
              <ThemeSwitcher />
              <LanguageSwitcher />
            </div>
          </div>
          <CardDescription>{t("auth.description")}</CardDescription>
        </CardHeader>
        <CardContent>
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
