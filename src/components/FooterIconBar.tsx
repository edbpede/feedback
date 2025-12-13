import { For, type Component } from "solid-js";

interface FooterIcon {
  name: string;
  src: string;
  href: string;
  alt: string;
}

const icons: FooterIcon[] = [
  {
    name: "edbpede",
    src: "/icons/edbpede.svg",
    href: "/",
    alt: "EDB Pede - Homepage",
  },
  {
    name: "github",
    src: "/icons/github.svg",
    href: "https://github.com/edbpede/feedback",
    alt: "GitHub Repository",
  },
  {
    name: "donate",
    src: "/icons/donate.svg",
    href: "https://kutt.it/Hrtu2H",
    alt: "Support/Donate",
  },
  {
    name: "agpl",
    src: "/icons/agpl.svg",
    href: "https://www.gnu.org/licenses/agpl-3.0.en.html",
    alt: "AGPL-3.0 License",
  },
];

export const FooterIconBar: Component = () => {
  return (
    <div class="flex items-center justify-center gap-4 py-3 px-4 bg-background/50">
      <For each={icons}>
        {(icon) => {
          const isExternal = icon.href.startsWith("http");
          return (
            <a
              href={icon.href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              class="opacity-60 hover:opacity-100 transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
              aria-label={icon.alt}
            >
              <img
                src={icon.src}
                alt=""
                class="w-6 h-6"
                aria-hidden="true"
              />
            </a>
          );
        }}
      </For>
    </div>
  );
};
