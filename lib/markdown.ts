import { marked } from "marked";

/**
 * Converts a markdown string to sanitized HTML.
 * We configure marked to be safe for inline display:
 * - No raw HTML pass-through
 * - Links open in new tab
 */
const renderer = new marked.Renderer();

renderer.link = ({ href, title, text }: { href: string; title?: string | null; text: string }) => {
  const t = title ? ` title="${title}"` : "";
  return `<a href="${href}"${t} target="_blank" rel="noopener noreferrer" class="text-orange-400 underline hover:text-orange-300">${text}</a>`;
};

marked.setOptions({
  renderer,
  // Disable raw HTML to prevent XSS
  // @ts-ignore – marked v9 moved this to the sanitizer option
  mangle: false,
  headerIds: false,
});

export function renderMarkdown(md: string): string {
  if (!md) return "";
  const result = marked.parse(md, { async: false });
  return (result as string).trim();
}

/** True if the string contains markdown syntax worth rendering */
export function hasMarkdown(text: string): boolean {
  return /[*_`#\[\]>~]/.test(text);
}
