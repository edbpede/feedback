import { Collapsible as CollapsiblePrimitive, Tooltip as TooltipPrimitive } from "bits-ui";
import type { HTMLInputAttributes, HTMLTextareaAttributes } from "svelte/elements";

export { default as Alert } from "./alert.svelte";
export { default as AlertDescription } from "./alert-description.svelte";
export { default as AlertTitle } from "./alert-title.svelte";
export { type AlertProps, alertVariants } from "./alert-variants";
export { default as Button } from "./button.svelte";
export { type ButtonProps, buttonVariants } from "./button-variants";
export { default as Card } from "./card.svelte";
export { default as CardContent } from "./card-content.svelte";
export { default as CardDescription } from "./card-description.svelte";
export { default as CardFooter } from "./card-footer.svelte";
export { default as CardHeader } from "./card-header.svelte";
export { default as CardTitle } from "./card-title.svelte";
export { default as CollapsibleContent } from "./collapsible-content.svelte";
export { default as CollapsibleTrigger } from "./collapsible-trigger.svelte";
export { default as Input } from "./input.svelte";
export { default as Textarea } from "./textarea.svelte";
export { default as TooltipContent } from "./tooltip-content.svelte";
export { default as Tooltip } from "./tooltip.svelte";

/**
 * Collapsible and TooltipTrigger were raw re-exports of the primitive in the Solid
 * source (`const Collapsible = CollapsiblePrimitive`), with no wrapper. Mirrored here
 * so call sites keep their shape. TooltipTrigger in particular must stay unwrapped:
 * BalanceDisplay renders it through bits-ui's `child` snippet, which a wrapper would
 * intercept. The Tooltip root IS wrapped (tooltip.svelte) because bits-ui requires a
 * Tooltip.Provider ancestor that Kobalte did not.
 */
export const Collapsible = CollapsiblePrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

/**
 * InputProps and TextareaProps were plain JSX-attribute aliases in the Solid source.
 * A .svelte instance script cannot export a type, so the aliases live here; the
 * components consume the svelte/elements types directly.
 */
export type InputProps = HTMLInputAttributes;
export type TextareaProps = HTMLTextareaAttributes;
