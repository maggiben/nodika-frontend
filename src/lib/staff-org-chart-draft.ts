import type { Locale } from "@/i18n/config";
import {
  reportRoleLabel,
  type StaffOrgChart,
  type StaffReportRole,
} from "@/lib/staff-org-chart";

const ROLE_LABELS: Record<Locale, Record<StaffReportRole, string>> = {
  es: {
    operario: "operario",
    jornalero: "jornalero",
    otro: "otro",
  },
  en: {
    operario: "operator",
    jornalero: "day laborer",
    otro: "other",
  },
};

export function buildPerformanceDraft(input: {
  locale: Locale;
  leadName: string;
  chart: StaffOrgChart;
}): string | null {
  if (chartHasNoReports(input.chart)) {
    return null;
  }

  const lead = input.leadName.trim() || input.chart.contactLabel?.trim() || "";
  const roleLabels = ROLE_LABELS[input.locale];
  const lines = input.chart.reports.map((report, index) => {
    const role = reportRoleLabel(report, roleLabels);
    return `${index + 1}. ${report.name} (${role})`;
  });

  if (input.locale === "en") {
    return [
      `Hi ${lead || "there"},`,
      "",
      "Could you share a short performance update for each person on your team?",
      "",
      ...lines,
      "",
      "For each person: how did they do this week, any issues, and any help they need?",
      "Thanks.",
    ].join("\n");
  }

  return [
    `Hola ${lead || ""},`.trimEnd(),
    "",
    "¿Podrías contarme cómo fue la performance de cada persona de tu equipo?",
    "",
    ...lines,
    "",
    "Para cada uno: cómo les fue esta semana, si hubo problemas y si necesitan apoyo.",
    "Gracias.",
  ].join("\n");
}

export function chartHasNoReports(chart: StaffOrgChart): boolean {
  return chart.reports.length === 0;
}
