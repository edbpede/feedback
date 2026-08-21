<script lang="ts">
  interface Props {
    size?: "sm" | "md" | "lg" | "xl";
    class?: string;
  }

  const sizeMap = {
    sm: "w-8 h-8", // 32px
    md: "w-16 h-16", // 64px
    lg: "w-24 h-24", // 96px
    xl: "w-32 h-32", // 128px
  };

  let { size, class: className, ...rest }: Props = $props();
  const sizeClass = $derived(sizeMap[size ?? "md"]);
</script>

<img
  src="/feedback-logo.svg"
  alt="Feedback Bot Logo"
  aria-label="Feedback Bot til Studerende logo"
  class={`${sizeClass} ${className ?? ""}`}
  {...rest}
/>
