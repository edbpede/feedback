import type { Component } from "solid-js";
import { t } from "@lib/i18n";
import { Card, CardContent } from "@components/ui/card";

/**
 * Loading state shown during PII detection.
 * Displays a spinner and explanatory text.
 */
export const PIIDetectionLoading: Component = () => {
  return (
    <Card class="w-full max-w-2xl">
      <CardContent class="py-12">
        <div class="flex flex-col items-center justify-center gap-6">
          {/* Spinner with shield icon */}
          <div class="relative">
            <div class="border-muted border-t-primary h-16 w-16 animate-spin rounded-full border-4" />
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="i-carbon-security text-primary text-2xl" />
            </div>
          </div>

          {/* Title */}
          <h2 class="text-xl font-semibold">{t("pii.detecting.title")}</h2>

          {/* Description */}
          <p class="text-muted-foreground max-w-md text-center">{t("pii.detecting.description")}</p>
        </div>
      </CardContent>
    </Card>
  );
};
