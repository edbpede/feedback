import { splitProps, type Component } from "solid-js";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  class?: string;
}

const sizeMap = {
  sm: "w-8 h-8",    // 32px
  md: "w-16 h-16",  // 64px
  lg: "w-24 h-24",  // 96px
  xl: "w-32 h-32",  // 128px
};

export const Logo: Component<LogoProps> = (props) => {
  const [local, others] = splitProps(props, ["size", "class"]);
  const sizeClass = () => sizeMap[local.size ?? "md"];

  return (
    <img
      src="/feedback-logo.svg"
      alt="Feedback Bot Logo"
      role="img"
      aria-label="Feedback Bot til Studerende logo"
      class={`${sizeClass()} ${local.class ?? ""}`}
      {...others}
    />
  );
};
