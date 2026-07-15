"use client";

import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  locales,
  type Locale,
} from "@/i18n/config";
import { useDictionary } from "@/i18n/dictionary-provider";
import type { AccountSettings, EmailSchedule } from "@/lib/core-auth";

type ThemePreference = "light" | "dark" | "system";

const weekdayKeys = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function replaceLocale(pathname: string, nextLocale: Locale) {
  const segments = pathname.split("/");
  if (segments.length > 1 && isLocale(segments[1] ?? "")) {
    segments[1] = nextLocale;
    return segments.join("/") || `/${nextLocale}`;
  }
  return `/${nextLocale}${pathname === "/" ? "" : pathname}`;
}

function formatPreviewDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "es" ? "es-AR" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function UserSettingsForm() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, t } = useDictionary();
  const { mode, setMode } = useColorScheme();
  const activeMode = (mode ?? "system") as ThemePreference;

  const [settings, setSettings] = useState<AccountSettings | null>(null);
  const [schedule, setSchedule] = useState<EmailSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      setLoading(true);
      setLoadError(null);

      try {
        const response = await fetch("/api/settings");
        const body: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          if (!cancelled) {
            setLoadError(
              typeof body === "object" &&
                body !== null &&
                "message" in body &&
                typeof body.message === "string"
                ? body.message
                : t("settings.loadError"),
            );
          }
          return;
        }

        if (!cancelled && body && typeof body === "object") {
          const next = body as AccountSettings;
          setSettings(next);
          setSchedule(next.emailSchedule);
        }
      } catch {
        if (!cancelled) {
          setLoadError(t("settings.unreachable"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSettings();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const previewDates = useMemo(
    () => settings?.nextSendDates ?? [],
    [settings?.nextSendDates],
  );

  function changeTheme(preference: ThemePreference) {
    setMode(preference);
  }

  function changeLanguage(event: SelectChangeEvent) {
    const nextLocale = event.target.value;
    if (!isLocale(nextLocale) || nextLocale === locale) {
      return;
    }

    document.cookie = `${LOCALE_COOKIE}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    router.push(replaceLocale(pathname || `/${defaultLocale}`, nextLocale));
    router.refresh();
  }

  async function saveSchedule() {
    if (!schedule) {
      return;
    }

    setSavingSchedule(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      const response = await fetch("/api/settings", {
        body: JSON.stringify(schedule),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setSaveError(
          typeof body === "object" &&
            body !== null &&
            "message" in body &&
            typeof body.message === "string"
            ? body.message
            : t("settings.saveError"),
        );
        return;
      }

      if (body && typeof body === "object") {
        const next = body as AccountSettings;
        setSettings(next);
        setSchedule(next.emailSchedule);
      }
      setSaveMessage(t("settings.scheduleSaved"));
    } catch {
      setSaveError(t("settings.unreachable"));
    } finally {
      setSavingSchedule(false);
    }
  }

  async function submitPasswordChange() {
    setPasswordMessage(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError(t("settings.passwordMismatch"));
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch("/api/settings/change-password", {
        body: JSON.stringify({ currentPassword, newPassword }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setPasswordError(
          typeof body === "object" &&
            body !== null &&
            "message" in body &&
            typeof body.message === "string"
            ? body.message
            : t("settings.passwordError"),
        );
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage(t("settings.passwordSaved"));
    } catch {
      setPasswordError(t("settings.unreachable"));
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>{t("settings.loading")}</Typography>
      </Container>
    );
  }

  if (loadError) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{loadError}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, sm: 6 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography component="h1" variant="h4">
            {t("settings.title")}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {t("settings.description")}
          </Typography>
          {settings?.email ? (
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {t("settings.signedInAs", { email: settings.email })}
            </Typography>
          ) : null}
        </Box>

        <Paper sx={{ p: 3 }}>
          <Typography component="h2" variant="h6">
            {t("settings.appearanceTitle")}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2, mt: 0.5 }}>
            {t("settings.appearanceDescription")}
          </Typography>
          <ToggleButtonGroup
            exclusive
            onChange={(_, value: ThemePreference | null) => {
              if (value) {
                changeTheme(value);
              }
            }}
            size="small"
            value={activeMode}
          >
            <ToggleButton value="light">{t("nav.lightTheme")}</ToggleButton>
            <ToggleButton value="dark">{t("nav.darkTheme")}</ToggleButton>
            <ToggleButton value="system">{t("nav.systemTheme")}</ToggleButton>
          </ToggleButtonGroup>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography component="h2" variant="h6">
            {t("settings.languageTitle")}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2, mt: 0.5 }}>
            {t("settings.languageDescription")}
          </Typography>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="settings-language-label">
              {t("nav.language")}
            </InputLabel>
            <Select
              label={t("nav.language")}
              labelId="settings-language-label"
              onChange={changeLanguage}
              value={locale}
            >
              {locales.map((item) => (
                <MenuItem key={item} value={item}>
                  {item === "es" ? "Español" : "English"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography component="h2" variant="h6">
            {t("settings.passwordTitle")}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2, mt: 0.5 }}>
            {t("settings.passwordDescription")}
          </Typography>
          <Stack spacing={2} sx={{ maxWidth: 420 }}>
            <TextField
              autoComplete="current-password"
              label={t("settings.currentPassword")}
              onChange={(event) => setCurrentPassword(event.target.value)}
              type="password"
              value={currentPassword}
            />
            <TextField
              autoComplete="new-password"
              label={t("settings.newPassword")}
              onChange={(event) => setNewPassword(event.target.value)}
              type="password"
              value={newPassword}
            />
            <TextField
              autoComplete="new-password"
              label={t("settings.confirmPassword")}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              value={confirmPassword}
            />
            {passwordError ? (
              <Alert severity="error">{passwordError}</Alert>
            ) : null}
            {passwordMessage ? (
              <Alert severity="success">{passwordMessage}</Alert>
            ) : null}
            <Button
              disabled={changingPassword}
              onClick={submitPasswordChange}
              variant="contained"
            >
              {changingPassword
                ? t("settings.passwordSaving")
                : t("settings.passwordSave")}
            </Button>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography component="h2" variant="h6">
            {t("settings.emailTitle")}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2, mt: 0.5 }}>
            {t("settings.emailDescription")}
          </Typography>

          {schedule ? (
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={schedule.enabled}
                    onChange={(event) =>
                      setSchedule({
                        ...schedule,
                        enabled: event.target.checked,
                      })
                    }
                  />
                }
                label={t("settings.emailEnabled")}
              />

              <FormControl size="small" sx={{ maxWidth: 220 }}>
                <InputLabel id="settings-frequency-label">
                  {t("settings.frequency")}
                </InputLabel>
                <Select
                  disabled={!schedule.enabled}
                  label={t("settings.frequency")}
                  labelId="settings-frequency-label"
                  onChange={(event) =>
                    setSchedule({
                      ...schedule,
                      frequency: event.target
                        .value as EmailSchedule["frequency"],
                    })
                  }
                  value={schedule.frequency}
                >
                  <MenuItem value="weekly">{t("settings.weekly")}</MenuItem>
                  <MenuItem value="monthly">{t("settings.monthly")}</MenuItem>
                </Select>
              </FormControl>

              {schedule.frequency === "weekly" ? (
                <Box>
                  <FormLabel>{t("settings.weekdays")}</FormLabel>
                  <ToggleButtonGroup
                    aria-label={t("settings.weekdays")}
                    color="primary"
                    disabled={!schedule.enabled}
                    size="small"
                    sx={{ mt: 1 }}
                    value={schedule.daysOfWeek}
                    onChange={(_, days: number[]) => {
                      if (days.length === 0) {
                        return;
                      }

                      setSchedule({
                        ...schedule,
                        daysOfWeek: [...days].sort((a, b) => a - b),
                      });
                    }}
                  >
                    {weekdayKeys.map((key, index) => (
                      <ToggleButton key={key} value={index}>
                        {t(`settings.weekdaysShort.${key}`)}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Box>
              ) : (
                <FormControl size="small" sx={{ maxWidth: 220 }}>
                  <InputLabel id="settings-day-of-month-label">
                    {t("settings.dayOfMonth")}
                  </InputLabel>
                  <Select
                    disabled={!schedule.enabled}
                    label={t("settings.dayOfMonth")}
                    labelId="settings-day-of-month-label"
                    onChange={(event) =>
                      setSchedule({
                        ...schedule,
                        dayOfMonth: Number(event.target.value),
                      })
                    }
                    value={schedule.dayOfMonth}
                  >
                    {Array.from({ length: 28 }, (_, index) => index + 1).map(
                      (day) => (
                        <MenuItem key={day} value={day}>
                          {day}
                        </MenuItem>
                      ),
                    )}
                  </Select>
                </FormControl>
              )}

              <TextField
                disabled={!schedule.enabled}
                label={t("settings.sendTime")}
                onChange={(event) =>
                  setSchedule({ ...schedule, sendTime: event.target.value })
                }
                slotProps={{ htmlInput: { step: 300 } }}
                sx={{ maxWidth: 220 }}
                type="time"
                value={schedule.sendTime}
              />

              <Divider />

              <Box>
                <Typography variant="subtitle2">
                  {t("settings.nextSends")}
                </Typography>
                {schedule.enabled && previewDates.length > 0 ? (
                  <Stack spacing={0.5} sx={{ mt: 1 }}>
                    {previewDates.map((date) => (
                      <Typography key={date} color="text.secondary">
                        {formatPreviewDate(date, locale)}
                      </Typography>
                    ))}
                  </Stack>
                ) : (
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    {t("settings.noUpcomingSends")}
                  </Typography>
                )}
              </Box>

              {saveError ? <Alert severity="error">{saveError}</Alert> : null}
              {saveMessage ? (
                <Alert severity="success">{saveMessage}</Alert>
              ) : null}

              <Button
                disabled={savingSchedule}
                onClick={saveSchedule}
                variant="contained"
              >
                {savingSchedule
                  ? t("settings.saving")
                  : t("settings.saveSchedule")}
              </Button>
            </Stack>
          ) : null}
        </Paper>
      </Stack>
    </Container>
  );
}
