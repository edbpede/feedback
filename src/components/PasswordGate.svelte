<script lang="ts">
import CardExternalLinks from "@components/CardExternalLinks.svelte";
import LanguageSwitcher from "@components/LanguageSwitcher.svelte";
import Logo from "@components/Logo.svelte";
import ThemeSwitcher from "@components/ThemeSwitcher.svelte";
import { Button, Card, CardContent, Input } from "@components/ui";
import { t } from "@lib/i18n";
import type { ApiResponse } from "@lib/types";

interface PasswordGateProps {
  onSuccess: () => void;
}

let { onSuccess }: PasswordGateProps = $props();

let password = $state("");
let error = $state("");
let isLoading = $state(false);

const handleSubmit = async (e: Event) => {
  e.preventDefault();
  error = "";
  isLoading = true;

  try {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const result = (await response.json()) as ApiResponse<unknown>;

    if (result.success) {
      onSuccess();
    } else {
      error = result.error;
    }
  } catch {
    error = t("auth.connectionError");
  } finally {
    isLoading = false;
  }
};
</script>

<div class="flex min-h-screen items-center justify-center p-4">
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

      <h1 class="mb-4 text-2xl font-bold">{t("auth.title")}</h1>
      <p class="text-muted-foreground mb-8">{t("auth.description")}</p>

      <form onsubmit={handleSubmit} class="space-y-4">
        <!-- svelte-ignore a11y_autofocus -->
        <Input
          type="password"
          value={password}
          oninput={(e) => {
            password = e.currentTarget.value;
          }}
          placeholder={t("auth.passwordPlaceholder")}
          disabled={isLoading}
          autofocus
        />

        {#if error}
          <p class="text-destructive text-sm">{error}</p>
        {/if}

        <Button type="submit" class="w-full" disabled={isLoading || !password}>
          {#if isLoading}
            <span class="i-carbon-loading mr-2 inline-block animate-spin"></span>
          {/if}
          {isLoading ? t("auth.authenticating") : t("auth.submitButton")}
        </Button>
      </form>
    </CardContent>
  </Card>
</div>
