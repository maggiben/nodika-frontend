export const CATALOG_BODY_PREVIEW_MAX = 100;

/** UI-only truncation. Full text must remain untruncated in the database. */
export function truncateForPreview(
  text: string,
  max = CATALOG_BODY_PREVIEW_MAX,
): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}
