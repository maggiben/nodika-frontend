export type SnapshotValidationIssue = {
  path: string;
  message: string;
};

export type NodikaSnapshot = Record<string, unknown>;

export type SnapshotParseResult =
  | { success: true; data: NodikaSnapshot }
  | { success: false; errors: SnapshotValidationIssue[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function syntaxErrorMessage(error: unknown): string {
  if (error instanceof SyntaxError && error.message.trim().length > 0) {
    return `Invalid JSON syntax: ${error.message}`;
  }

  return "Invalid JSON syntax.";
}

export function validateNodikaSnapshot(value: unknown): SnapshotParseResult {
  if (!isRecord(value)) {
    return {
      success: false,
      errors: [
        { path: "root", message: "The snapshot must be a JSON object." },
      ],
    };
  }

  return { success: true, data: value };
}

export function parseNodikaSnapshot(json: string): SnapshotParseResult {
  try {
    return validateNodikaSnapshot(JSON.parse(json) as unknown);
  } catch (error) {
    return {
      success: false,
      errors: [{ path: "root", message: syntaxErrorMessage(error) }],
    };
  }
}
