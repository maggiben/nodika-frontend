export function emailInitials(email: string): string {
  const trimmed = email.trim();
  const localPart = trimmed.split("@")[0] ?? trimmed;
  const letters = localPart.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ]/g, "");

  if (letters.length >= 2) {
    return letters.slice(0, 2).toUpperCase();
  }

  if (letters.length === 1) {
    return `${letters}${letters}`.toUpperCase();
  }

  return trimmed.slice(0, 2).toUpperCase();
}
