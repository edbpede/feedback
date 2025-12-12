import type { Component, JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive [&>svg]:text-destructive",
        warning:
          "border-amber-500/50 bg-amber-50 text-amber-900 [&>svg]:text-amber-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface AlertProps
  extends JSX.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

const Alert: Component<AlertProps> = (props) => {
  const [local, others] = splitProps(props, ["class", "variant", "children"]);
  return (
    <div
      role="alert"
      class={cn(alertVariants({ variant: local.variant }), local.class)}
      {...others}
    >
      {local.children}
    </div>
  );
};

const AlertTitle: Component<JSX.HTMLAttributes<HTMLHeadingElement>> = (props) => {
  const [local, others] = splitProps(props, ["class", "children"]);
  return (
    <h5
      class={cn("mb-1 font-medium leading-none tracking-tight", local.class)}
      {...others}
    >
      {local.children}
    </h5>
  );
};

const AlertDescription: Component<JSX.HTMLAttributes<HTMLParagraphElement>> = (props) => {
  const [local, others] = splitProps(props, ["class", "children"]);
  return (
    <div class={cn("text-sm [&_p]:leading-relaxed", local.class)} {...others}>
      {local.children}
    </div>
  );
};

export { Alert, AlertTitle, AlertDescription, alertVariants };
