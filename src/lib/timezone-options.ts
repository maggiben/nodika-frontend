export const DEFAULT_TIMEZONE = "America/Argentina/Buenos_Aires";

export const TIMEZONE_OPTIONS = [
  {
    value: "America/Argentina/Buenos_Aires",
    label: "America/Argentina/Buenos_Aires (ART)",
  },
  { value: "America/Sao_Paulo", label: "America/Sao_Paulo (BRT)" },
  { value: "America/Santiago", label: "America/Santiago (CLT)" },
  { value: "America/Mexico_City", label: "America/Mexico_City (CST)" },
  { value: "America/Bogota", label: "America/Bogota (COT)" },
  { value: "America/Lima", label: "America/Lima (PET)" },
  { value: "America/New_York", label: "America/New_York (ET)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PT)" },
  { value: "Europe/Madrid", label: "Europe/Madrid (CET)" },
  { value: "UTC", label: "UTC" },
] as const;

export type TimezoneOption = (typeof TIMEZONE_OPTIONS)[number];
