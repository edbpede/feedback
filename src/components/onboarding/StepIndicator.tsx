import type { Component } from "solid-js";
import { For } from "solid-js";

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
}

export const StepIndicator: Component<StepIndicatorProps> = (props) => {
  return (
    <div class="mb-6 flex items-center justify-center gap-2">
      <For each={Array.from({ length: props.totalSteps })}>
        {(_, index) => (
          <div
            class={`h-2 rounded-full transition-all duration-300 ${
              index() < props.currentStep
                ? "bg-primary w-2"
                : index() === props.currentStep
                  ? "bg-primary w-6"
                  : "bg-muted w-2"
            }`}
          />
        )}
      </For>
    </div>
  );
};
