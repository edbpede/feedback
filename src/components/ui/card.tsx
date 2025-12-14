import type { Component, JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "@lib/utils";

const Card: Component<JSX.HTMLAttributes<HTMLDivElement>> = (props) => {
  const [local, others] = splitProps(props, ["class", "children"]);
  return (
    <div
      class={cn("bg-card text-card-foreground rounded-lg border shadow-sm", local.class)}
      {...others}
    >
      {local.children}
    </div>
  );
};

const CardHeader: Component<JSX.HTMLAttributes<HTMLDivElement>> = (props) => {
  const [local, others] = splitProps(props, ["class", "children"]);
  return (
    <div class={cn("flex flex-col space-y-1.5 p-6", local.class)} {...others}>
      {local.children}
    </div>
  );
};

const CardTitle: Component<JSX.HTMLAttributes<HTMLHeadingElement>> = (props) => {
  const [local, others] = splitProps(props, ["class", "children"]);
  return (
    <h3 class={cn("text-2xl font-semibold leading-none tracking-tight", local.class)} {...others}>
      {local.children}
    </h3>
  );
};

const CardDescription: Component<JSX.HTMLAttributes<HTMLParagraphElement>> = (props) => {
  const [local, others] = splitProps(props, ["class", "children"]);
  return (
    <p class={cn("text-muted-foreground text-sm", local.class)} {...others}>
      {local.children}
    </p>
  );
};

const CardContent: Component<JSX.HTMLAttributes<HTMLDivElement>> = (props) => {
  const [local, others] = splitProps(props, ["class", "children"]);
  return (
    <div class={cn("p-6 pt-0", local.class)} {...others}>
      {local.children}
    </div>
  );
};

const CardFooter: Component<JSX.HTMLAttributes<HTMLDivElement>> = (props) => {
  const [local, others] = splitProps(props, ["class", "children"]);
  return (
    <div class={cn("flex items-center p-6 pt-0", local.class)} {...others}>
      {local.children}
    </div>
  );
};

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
