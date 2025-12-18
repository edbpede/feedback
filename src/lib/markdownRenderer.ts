import type { Tokens } from "marked";

// CSS injection state
let cssInjected = false;

// Cached renderer promise
let rendererPromise: Promise<{
  parse: (content: string) => string;
}> | null = null;

/**
 * Lazily initializes and caches the markdown renderer.
 * Loads highlight.js CSS on first invocation.
 */
async function initializeRenderer() {
  // Import marked and highlight.js dynamically
  const [{ marked }, hljs] = await Promise.all([import("marked"), import("highlight.js/lib/core")]);

  // Import language definitions in parallel
  const [javascript, typescript, python, xml, css, json, markdown, plaintext] = await Promise.all([
    import("highlight.js/lib/languages/javascript"),
    import("highlight.js/lib/languages/typescript"),
    import("highlight.js/lib/languages/python"),
    import("highlight.js/lib/languages/xml"),
    import("highlight.js/lib/languages/css"),
    import("highlight.js/lib/languages/json"),
    import("highlight.js/lib/languages/markdown"),
    import("highlight.js/lib/languages/plaintext"),
  ]);

  // Register languages
  hljs.default.registerLanguage("javascript", javascript.default);
  hljs.default.registerLanguage("js", javascript.default);
  hljs.default.registerLanguage("typescript", typescript.default);
  hljs.default.registerLanguage("ts", typescript.default);
  hljs.default.registerLanguage("python", python.default);
  hljs.default.registerLanguage("py", python.default);
  hljs.default.registerLanguage("html", xml.default);
  hljs.default.registerLanguage("xml", xml.default);
  hljs.default.registerLanguage("css", css.default);
  hljs.default.registerLanguage("json", json.default);
  hljs.default.registerLanguage("markdown", markdown.default);
  hljs.default.registerLanguage("md", markdown.default);
  hljs.default.registerLanguage("plaintext", plaintext.default);
  hljs.default.registerLanguage("text", plaintext.default);

  // Configure renderer with syntax highlighting
  const renderer = new marked.Renderer();
  renderer.code = ({ text, lang }: Tokens.Code) => {
    const language = lang && hljs.default.getLanguage(lang) ? lang : "plaintext";
    const highlighted = hljs.default.highlight(text, { language }).value;
    return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
  };

  marked.setOptions({
    breaks: true,
    gfm: true,
    renderer,
  });

  return {
    parse: (content: string) => marked.parse(content) as string,
  };
}

/**
 * Injects highlight.js CSS into the document head.
 * Only runs once, subsequent calls are no-ops.
 */
function injectHighlightCSS() {
  if (cssInjected || typeof document === "undefined") return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/styles/github-dark.css";
  document.head.appendChild(link);
  cssInjected = true;
}

/**
 * Parses markdown content with syntax highlighting.
 * Lazily loads dependencies on first use.
 */
export async function parseMarkdown(content: string): Promise<string> {
  // Inject CSS on first use
  injectHighlightCSS();

  // Initialize renderer (cached after first call)
  if (!rendererPromise) {
    rendererPromise = initializeRenderer();
  }

  const renderer = await rendererPromise;
  return renderer.parse(content);
}

/**
 * Synchronous fallback for initial render.
 * Returns escaped HTML without syntax highlighting.
 */
export function parseMarkdownSync(content: string): string {
  // Basic HTML escaping for safety
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}
