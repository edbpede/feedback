/**
 * @fileoverview Password dialog for enhanced-quality model access.
 * Prompts users to enter a password to unlock commercial AI models.
 * Used when the enhanced-quality path is selected in the model path step.
 */

import { createSignal, Show, type Component } from "solid-js";
import { Dialog } from "@kobalte/core/dialog";
import { t } from "@lib/i18n";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import type { ApiResponse } from "@lib/types";

/** Props for the EnhancedQualityPasswordDialog component */
interface EnhancedQualityPasswordDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when authentication succeeds */
  onSuccess: () => void;
}

/**
 * Modal dialog for authenticating access to enhanced-quality (commercial) models.
 * Submits password to /api/auth-enhanced and calls onSuccess on valid credentials.
 */
export const EnhancedQualityPasswordDialog: Component<EnhancedQualityPasswordDialogProps> = (
  props
) => {
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth-enhanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password() }),
      });

      const result = (await response.json()) as ApiResponse<unknown>;

      if (result.success) {
        setPassword("");
        props.onSuccess();
      } else {
        setError(t("enhancedAuth.invalidPassword"));
      }
    } catch {
      console.error("[EnhancedQualityPasswordDialog] Authentication request failed");
      setError(t("enhancedAuth.connectionError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset state when closing
      setPassword("");
      setError("");
    }
    props.onOpenChange(open);
  };

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay class="data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:animate-in data-[expanded]:fade-in-0 fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Content class="bg-card border-border data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:zoom-out-95 data-[expanded]:animate-in data-[expanded]:fade-in-0 data-[expanded]:zoom-in-95 w-full max-w-md rounded-xl border p-6 shadow-lg">
            {/* Header */}
            <div class="mb-6 text-center">
              <div class="bg-primary/10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
                <span class="i-carbon-locked text-primary text-2xl" />
              </div>
              <Dialog.Title class="text-xl font-bold">{t("enhancedAuth.title")}</Dialog.Title>
              <Dialog.Description class="text-muted-foreground mt-2 text-sm">
                {t("enhancedAuth.description")}
              </Dialog.Description>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} class="space-y-4">
              <Input
                type="password"
                value={password()}
                onInput={(e) => setPassword(e.currentTarget.value)}
                placeholder={t("enhancedAuth.passwordPlaceholder")}
                disabled={isLoading()}
                autofocus
              />

              <Show when={error()}>
                <p class="text-destructive text-sm">{error()}</p>
              </Show>

              <div class="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  class="flex-1"
                  onClick={() => handleOpenChange(false)}
                  disabled={isLoading()}
                >
                  {t("enhancedAuth.cancelButton")}
                </Button>
                <Button type="submit" class="flex-1" disabled={isLoading() || !password()}>
                  <Show when={isLoading()}>
                    <span class="i-carbon-loading mr-2 inline-block animate-spin" />
                  </Show>
                  {isLoading() ? t("enhancedAuth.authenticating") : t("enhancedAuth.submitButton")}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog>
  );
};
