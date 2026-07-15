export const CATALOG_BODY_PREVIEW_MAX = 100;

/** Collapse runs of spaces/tabs, but keep newline structure. */
function normalizePreviewWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** UI-only truncation. Full text must remain untruncated in the database. */
export function truncateForPreview(
  text: string,
  max = CATALOG_BODY_PREVIEW_MAX,
): string {
  const normalized = normalizePreviewWhitespace(text);
  if (normalized.length <= max) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, max - 1)).replace(/\s+$/, "")}…`;
}
