import type { Component } from "solid-js";
import { For } from "solid-js";

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
}

export const StepIndicator: Component<StepIndicatorProps> = (props) => {
  return (
    <div class="flex items-center justify-center gap-2 mb-6">
      <For each={Array.from({ length: props.totalSteps })}>
        {(_, index) => (
          <div
            class={`h-2 rounded-full transition-all duration-300 ${
              index() < props.currentStep
                ? "w-2 bg-blue-600"
                : index() === props.currentStep
                  ? "w-6 bg-blue-600"
                  : "w-2 bg-gray-300 dark:bg-gray-600"
            }`}
          />
        )}
      </For>
    </div>
  );
};
