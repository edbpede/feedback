import { splitProps, type Component } from "solid-js";
import { getTheme } from "@lib/theme";
import { getProviderLogoPath, type AIProvider } from "@config/models";
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
export const AIProviderLogo: Component<AIProviderLogoProps> = (props) => {
  const [local, others] = splitProps(props, ["provider", "size", "class"]);

  // Reactive: logo path changes when theme changes
  const logoPath = () => getProviderLogoPath(local.provider, getTheme());
  const sizeClass = () => sizeMap[local.size ?? "md"];

  return (
    <img
      src={logoPath()}
      alt={`${local.provider} logo`}
      role="img"
      aria-label={`${local.provider} AI provider logo`}
      class={cn(sizeClass(), "object-contain", local.class)}
      {...others}
    />
  );
};
