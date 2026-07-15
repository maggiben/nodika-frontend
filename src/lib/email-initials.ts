export function emailInitials(email: string): string {
  const localPart = email.trim().split("@")[0] ?? "";
  const letters: string[] = [];

  for (const char of localPart) {
    if (/[\p{L}]/u.test(char)) {
      letters.push(char);
      if (letters.length === 2) {
        break;
      }
    }
  }

  if (letters.length >= 2) {
    return letters.join("").toUpperCase();
  }

  if (letters.length === 1) {
    return `${letters[0]}${letters[0]}`.toUpperCase();
  }

  const fallback = localPart.slice(0, 2);
  return fallback.length > 0 ? fallback.toUpperCase() : "??";
}
