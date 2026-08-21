<script lang="ts">
  import { type AIProvider, getProviderLogoPath } from "@config/models";
  import { getTheme } from "@lib/theme";
  import { cn } from "@lib/utils";

  interface AIProviderLogoProps {
    /** The AI provider to display the logo for */
    provider: AIProvider;
    /** Logo size preset */
    size?: "xs" | "sm" | "md" | "lg";
    /** Additional CSS classes */
    class?: string;
  }

  const sizeMap = {
    xs: "w-4 h-4", // 16px - for inline with text
    sm: "w-6 h-6", // 24px - for message bubbles
    md: "w-8 h-8", // 32px - for cards
    lg: "w-12 h-12", // 48px - for large displays
  };

  /**
   * Displays an AI provider logo with automatic theme switching.
   * Logo updates reactively when the theme changes.
   */
  let { provider, size, class: className, ...rest }: AIProviderLogoProps = $props();

  // Reactive: logo path changes when theme changes
  const logoPath = $derived(getProviderLogoPath(provider, getTheme()));
  const sizeClass = $derived(sizeMap[size ?? "md"]);
</script>

<img
  src={logoPath}
  alt="{provider} logo"
  aria-label="{provider} AI provider logo"
  class={cn(sizeClass, "object-contain", className)}
  {...rest}
/>
