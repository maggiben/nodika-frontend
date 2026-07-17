import { redirectToLoginIfUnauthorized } from "@/lib/session-client";

/**
 * Sync the browser-selected Nodika obra to Core account settings so
 * WhatsApp catalog / task checklist only use that project's source.
 * Pass `null` to clear the active project.
 */
export async function activateActiveProject(
  projectId: string | null,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const trimmed = projectId === null ? null : projectId.trim();
  if (trimmed !== null && !trimmed) {
    return { ok: false, message: "Missing project id." };
  }

  try {
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeProjectId: trimmed }),
    });
    if (redirectToLoginIfUnauthorized(response)) {
      return { ok: false, message: "Your session is no longer valid." };
    }
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        typeof body === "object" &&
        body !== null &&
        "message" in body &&
        typeof body.message === "string"
          ? body.message
          : "Could not activate project.";
      return { ok: false, message };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "Could not reach settings." };
  }
}
