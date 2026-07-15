export type MessageValues = Record<string, string | number>;

export function formatMessage(
  template: string,
  values: MessageValues = {},
): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = values[key];
    return value === undefined ? `{${key}}` : String(value);
  });
}

export function getMessage(
  dictionary: Record<string, unknown>,
  path: string,
): string {
  const value = path.split(".").reduce<unknown>((current, key) => {
    if (typeof current !== "object" || current === null || !(key in current)) {
      return undefined;
    }
    return (current as Record<string, unknown>)[key];
  }, dictionary);

  return typeof value === "string" ? value : path;
}
