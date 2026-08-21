<script lang="ts">
  interface Props {
    totalSteps: number;
    currentStep: number;
  }

  let { totalSteps, currentStep }: Props = $props();
</script>

<div class="mb-6 flex items-center justify-center gap-2">
  {#each Array(totalSteps) as _, index (index)}
    <div
      class={`h-2 rounded-full transition-all duration-300 ${
        index < currentStep
          ? "bg-primary w-2"
          : index === currentStep
            ? "bg-primary w-6"
            : "bg-muted w-2"
      }`}
    ></div>
  {/each}
</div>
