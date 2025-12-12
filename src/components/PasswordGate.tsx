import { createSignal, Show, type Component } from "solid-js";
import type { ApiResponse } from "@lib/types";
import { t } from "@lib/i18n";
import { LanguageSwitcher } from "@components/LanguageSwitcher";

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
      <div class="card w-full max-w-md">
        <div class="flex justify-between items-start mb-2">
          <h1 class="text-2xl font-bold">{t("auth.title")}</h1>
          <LanguageSwitcher />
        </div>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          {t("auth.description")}
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password()}
            onInput={(e) => setPassword(e.currentTarget.value)}
            placeholder={t("auth.passwordPlaceholder")}
            class="input-base mb-4"
            disabled={isLoading()}
            autofocus
          />

          <Show when={error()}>
            <p class="text-red-600 dark:text-red-400 text-sm mb-4">{error()}</p>
          </Show>

          <button
            type="submit"
            class="btn-primary w-full"
            disabled={isLoading() || !password()}
          >
            <Show when={isLoading()}>
              <span class="i-carbon-loading animate-spin inline-block mr-2" />
            </Show>
            {isLoading() ? t("auth.authenticating") : t("auth.submitButton")}
          </button>
        </form>
      </div>
    </div>
  );
};
