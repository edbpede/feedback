import { type Component, For } from "solid-js";

interface ExternalLink {
  name: string;
  src: string;
  href: string;
  alt: string;
}

const links: ExternalLink[] = [
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

/**
 * Compact external links for card headers.
 * Displays icons in a subtle, muted style for top-left corner placement.
 */
export const CardExternalLinks: Component = () => {
  return (
    <div class="flex items-center gap-2.5">
      {/* biome-ignore-start lint/a11y/useAnchorContent: Biome 2.5.6 does not honour aria-label on
          an anchor whose only child is aria-hidden; the accessible name of each icon link comes
          from its aria-label. */}
      <For each={links}>
        {(link) => {
          const isExternal = link.href.startsWith("http");
          return (
            <a
              href={link.href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              class="focus-visible:ring-ring rounded opacity-40 transition-opacity duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              aria-label={link.alt}
            >
              <img
                src={link.src}
                alt=""
                class={link.name === "agpl" ? "h-4 w-auto" : "h-4 w-4"}
                aria-hidden="true"
              />
            </a>
          );
        }}
      </For>
      {/* biome-ignore-end lint/a11y/useAnchorContent: end of icon-link row */}
    </div>
  );
};
