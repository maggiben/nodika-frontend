export const NODIKA_SNAPSHOT_SCHEMA_VERSION = "nodika-snapshot-v1";

export type SnapshotValidationIssue = {
  path: string;
  message: string;
};

export type NodikaSnapshot = {
  schema_version: typeof NODIKA_SNAPSHOT_SCHEMA_VERSION;
  meta: {
    projectId: string;
    projectNombre: string;
    ciclo_inicio: string;
    ciclo_fin: string;
    gestionSnapshotId: string;
    exportado_en: string;
  };
  tareas_con_objetivo: SnapshotTask[];
};

export type SnapshotTask = {
  id: string;
  label: string;
  rubroKey: string | null;
  ini: string;
  fin: string;
  duracion: number;
  avance_base: number;
  pct_objetivo: number | null;
  sector: string | null;
  agente: string | null;
};

export type SnapshotParseResult =
  | { success: true; data: NodikaSnapshot }
  | { success: false; errors: SnapshotValidationIssue[] };

const metaKeys = [
  "projectId",
  "projectNombre",
  "ciclo_inicio",
  "ciclo_fin",
  "gestionSnapshotId",
  "exportado_en",
] as const;

const taskKeys = [
  "id",
  "label",
  "rubroKey",
  "ini",
  "fin",
  "duracion",
  "avance_base",
  "pct_objetivo",
  "sector",
  "agente",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function addUnexpectedKeyIssues(
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
  path: string,
  issues: SnapshotValidationIssue[],
) {
  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) {
      issues.push({
        path: `${path}.${key}`,
        message: "Unknown field. Check the field name for a typo.",
      });
    }
  }
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function requireString(
  value: unknown,
  path: string,
  issues: SnapshotValidationIssue[],
): value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push({ path, message: "Must be a non-empty string." });
    return false;
  }

  return true;
}

function requireNullableString(
  value: unknown,
  path: string,
  issues: SnapshotValidationIssue[],
): value is string | null {
  if (value !== null && typeof value !== "string") {
    issues.push({ path, message: "Must be a string or null." });
    return false;
  }

  return true;
}

function requireNumber(
  value: unknown,
  path: string,
  issues: SnapshotValidationIssue[],
  options: { minimum?: number; maximum?: number } = {},
): value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    issues.push({ path, message: "Must be a finite number." });
    return false;
  }

  if (options.minimum !== undefined && value < options.minimum) {
    issues.push({ path, message: `Must be at least ${options.minimum}.` });
  }

  if (options.maximum !== undefined && value > options.maximum) {
    issues.push({ path, message: `Must be at most ${options.maximum}.` });
  }

  return true;
}

function validateMeta(
  value: unknown,
  issues: SnapshotValidationIssue[],
): value is NodikaSnapshot["meta"] {
  if (!isRecord(value)) {
    issues.push({ path: "meta", message: "Must be an object." });
    return false;
  }

  addUnexpectedKeyIssues(value, metaKeys, "meta", issues);

  for (const key of [
    "projectId",
    "projectNombre",
    "gestionSnapshotId",
  ] as const) {
    requireString(value[key], `meta.${key}`, issues);
  }

  for (const key of ["ciclo_inicio", "ciclo_fin"] as const) {
    if (
      requireString(value[key], `meta.${key}`, issues) &&
      !isIsoDate(value[key])
    ) {
      issues.push({
        path: `meta.${key}`,
        message: "Must be a valid YYYY-MM-DD date.",
      });
    }
  }

  if (
    typeof value.ciclo_inicio === "string" &&
    typeof value.ciclo_fin === "string" &&
    isIsoDate(value.ciclo_inicio) &&
    isIsoDate(value.ciclo_fin) &&
    value.ciclo_inicio > value.ciclo_fin
  ) {
    issues.push({
      path: "meta.ciclo_fin",
      message: "Must be on or after meta.ciclo_inicio.",
    });
  }

  if (
    requireString(value.exportado_en, "meta.exportado_en", issues) &&
    Number.isNaN(Date.parse(value.exportado_en))
  ) {
    issues.push({
      path: "meta.exportado_en",
      message: "Must be a valid ISO date-time.",
    });
  }

  return true;
}

function validateTask(
  value: unknown,
  index: number,
  issues: SnapshotValidationIssue[],
): value is SnapshotTask {
  const path = `tareas_con_objetivo[${index}]`;

  if (!isRecord(value)) {
    issues.push({ path, message: "Must be an object." });
    return false;
  }

  addUnexpectedKeyIssues(value, taskKeys, path, issues);
  requireString(value.id, `${path}.id`, issues);
  requireString(value.label, `${path}.label`, issues);

  for (const key of ["rubroKey", "sector", "agente"] as const) {
    requireNullableString(value[key], `${path}.${key}`, issues);
  }

  for (const key of ["ini", "fin"] as const) {
    if (
      requireString(value[key], `${path}.${key}`, issues) &&
      !isIsoDate(value[key])
    ) {
      issues.push({
        path: `${path}.${key}`,
        message: "Must be a valid YYYY-MM-DD date.",
      });
    }
  }

  if (
    typeof value.ini === "string" &&
    typeof value.fin === "string" &&
    isIsoDate(value.ini) &&
    isIsoDate(value.fin) &&
    value.ini > value.fin
  ) {
    issues.push({ path: `${path}.fin`, message: "Must be on or after ini." });
  }

  requireNumber(value.duracion, `${path}.duracion`, issues, { minimum: 0 });
  requireNumber(value.avance_base, `${path}.avance_base`, issues, {
    minimum: 0,
    maximum: 100,
  });

  if (value.pct_objetivo !== null) {
    requireNumber(value.pct_objetivo, `${path}.pct_objetivo`, issues, {
      minimum: 0,
      maximum: 100,
    });
  }

  return true;
}

export function validateNodikaSnapshot(value: unknown): SnapshotParseResult {
  const errors: SnapshotValidationIssue[] = [];

  if (!isRecord(value)) {
    return {
      success: false,
      errors: [
        { path: "root", message: "The snapshot must be a JSON object." },
      ],
    };
  }

  addUnexpectedKeyIssues(
    value,
    ["schema_version", "meta", "tareas_con_objetivo"],
    "root",
    errors,
  );

  if (value.schema_version !== NODIKA_SNAPSHOT_SCHEMA_VERSION) {
    errors.push({
      path: "schema_version",
      message: `Must be "${NODIKA_SNAPSHOT_SCHEMA_VERSION}".`,
    });
  }

  validateMeta(value.meta, errors);

  if (
    !Array.isArray(value.tareas_con_objetivo) ||
    value.tareas_con_objetivo.length === 0
  ) {
    errors.push({
      path: "tareas_con_objetivo",
      message: "Must contain at least one task.",
    });
  } else {
    const taskIds = new Set<string>();

    value.tareas_con_objetivo.forEach((task, index) => {
      validateTask(task, index, errors);

      if (isRecord(task) && typeof task.id === "string") {
        if (taskIds.has(task.id)) {
          errors.push({
            path: `tareas_con_objetivo[${index}].id`,
            message: "Task IDs must be unique.",
          });
        }
        taskIds.add(task.id);
      }
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: value as NodikaSnapshot };
}

export function parseNodikaSnapshot(json: string): SnapshotParseResult {
  try {
    return validateNodikaSnapshot(JSON.parse(json) as unknown);
  } catch {
    return {
      success: false,
      errors: [{ path: "root", message: "Invalid JSON syntax." }],
    };
  }
}
