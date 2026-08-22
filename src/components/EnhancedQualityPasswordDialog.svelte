<script lang="ts">
/**
 * @fileoverview Password dialog for enhanced-quality model access.
 * Prompts users to enter a password to unlock commercial AI models.
 * Used when the enhanced-quality path is selected in the model path step.
 */

import { Button, Input } from "@components/ui";
import { t } from "@lib/i18n";
import type { ApiResponse } from "@lib/types";
import { Dialog } from "bits-ui";

/** Props for the EnhancedQualityPasswordDialog component */
interface EnhancedQualityPasswordDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when authentication succeeds */
  onSuccess: () => void;
}

let { open, onOpenChange, onSuccess }: EnhancedQualityPasswordDialogProps = $props();

let password = $state("");
let error = $state("");
let isLoading = $state(false);

/**
 * Whether anything should be rendered inside the portal.
 *
 * Kobalte's Dialog.Portal was presence-gated - it rendered
 * <Show when={contentPresent() || overlayPresent()}> - so nothing under it existed
 * while the dialog was closed. bits-ui's Portal mounts unconditionally as soon as it
 * has a target, and Dialog.Root renders its children unconditionally. Only Overlay and
 * Content self-gate; the plain positioning div between them does not, so without this
 * gate a full-viewport z-50 div would sit in the document swallowing every click on the
 * page behind the dialog.
 *
 * Tracking presence rather than `open` keeps the div mounted through the exit
 * animation, which is what contentPresent() did: bits-ui fires onOpenChangeComplete
 * from its PresenceManager once the transition has finished.
 */
let present = $state(false);
$effect(() => {
  if (open) present = true;
});

const handleSubmit = async (e: Event) => {
  e.preventDefault();
  error = "";
  isLoading = true;

  try {
    const response = await fetch("/api/auth-enhanced", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const result = (await response.json()) as ApiResponse<unknown>;

    if (result.success) {
      password = "";
      onSuccess();
    } else {
      error = t("enhancedAuth.invalidPassword");
    }
  } catch {
    console.error("[EnhancedQualityPasswordDialog] Authentication request failed");
    error = t("enhancedAuth.connectionError");
  } finally {
    isLoading = false;
  }
};

const handleOpenChange = (open: boolean) => {
  if (!open) {
    // Reset state when closing
    password = "";
    error = "";
  }
  onOpenChange(open);
};
</script>
<Dialog.Root
  {open}
  onOpenChange={handleOpenChange}
  onOpenChangeComplete={(isOpen) => {
    if (!isOpen) present = false;
  }}
>
  <Dialog.Portal>
    <Dialog.Overlay
      class="data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 backdrop-blur-xs"
    />
    {#if present}
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Dialog.Content
          class="bg-card border-border data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 w-full max-w-md rounded-xl border p-6 shadow-lg"
        >
          <!-- Header -->
          <div class="mb-6 text-center">
            <div
              class="bg-primary/10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            >
              <span class="i-carbon-locked text-primary text-2xl"></span>
            </div>
            <Dialog.Title class="text-xl font-bold">{t("enhancedAuth.title")}</Dialog.Title>
            <Dialog.Description class="text-muted-foreground mt-2 text-sm">
              {t("enhancedAuth.description")}
            </Dialog.Description>
          </div>

          <!-- Form -->
          <form onsubmit={handleSubmit} class="space-y-4">
            <!-- svelte-ignore a11y_autofocus -->
            <Input
              type="password"
              value={password}
              oninput={(e) => {
                password = e.currentTarget.value;
              }}
              placeholder={t("enhancedAuth.passwordPlaceholder")}
              disabled={isLoading}
              autofocus
            />

            {#if error}
              <p class="text-destructive text-sm">{error}</p>
            {/if}

            <div class="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                class="flex-1"
                onclick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                {t("enhancedAuth.cancelButton")}
              </Button>
              <Button type="submit" class="flex-1" disabled={isLoading || !password}>
                {#if isLoading}
                  <span class="i-carbon-loading mr-2 inline-block animate-spin"></span>
                {/if}
                {isLoading ? t("enhancedAuth.authenticating") : t("enhancedAuth.submitButton")}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </div>
    {/if}
  </Dialog.Portal>
</Dialog.Root>
