"use client";

import {
  Alert,
  Box,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import { useDictionary } from "@/i18n/dictionary-provider";
import { computeNextSendDates } from "@/lib/compute-next-send-dates";
import type { AccountSettings, EmailSchedule } from "@/lib/core-auth";
import type { Locale } from "@/i18n/config";

const weekdayKeys = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function formatPreviewDate(value: string, locale: Locale, timeZone: string) {
  return new Intl.DateTimeFormat(locale === "es" ? "es-AR" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

export function EmailFollowUpSchedulePanel() {
  const { locale, t } = useDictionary();
  const [schedule, setSchedule] = useState<EmailSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savingSchedule, setSavingSchedule] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
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
    () => (schedule ? computeNextSendDates(schedule) : []),
    [schedule],
  );

  function toggleWeekday(day: number) {
    if (!schedule) {
      return;
    }
    const days = schedule.daysOfWeek.includes(day)
      ? schedule.daysOfWeek.filter((value) => value !== day)
      : [...schedule.daysOfWeek, day].sort((a, b) => a - b);
    setSchedule({
      ...schedule,
      daysOfWeek: days.length > 0 ? days : [day],
    });
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
        setSchedule(next.emailSchedule);
      }
      setSaveMessage(t("settings.scheduleSaved"));
    } catch {
      setSaveError(t("settings.unreachable"));
    } finally {
      setSavingSchedule(false);
    }
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography component="h2" variant="h6">
        {t("settings.emailTitle")}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2, mt: 0.5 }}>
        {t("settings.emailDescription")}
      </Typography>

      {loading ? <Typography>{t("settings.loading")}</Typography> : null}
      {loadError ? <Alert severity="error">{loadError}</Alert> : null}

      {!loading && !loadError && schedule ? (
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
            <InputLabel id="staff-email-frequency-label">
              {t("settings.frequency")}
            </InputLabel>
            <Select
              disabled={!schedule.enabled}
              label={t("settings.frequency")}
              labelId="staff-email-frequency-label"
              onChange={(event) =>
                setSchedule({
                  ...schedule,
                  frequency: event.target.value as EmailSchedule["frequency"],
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
                disabled={!schedule.enabled}
                sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}
              >
                {weekdayKeys.map((key, index) => (
                  <ToggleButton
                    key={key}
                    onClick={() => toggleWeekday(index)}
                    selected={schedule.daysOfWeek.includes(index)}
                    value={index}
                  >
                    {t(`settings.weekdaysShort.${key}`)}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          ) : (
            <FormControl size="small" sx={{ maxWidth: 220 }}>
              <InputLabel id="staff-email-day-of-month-label">
                {t("settings.dayOfMonth")}
              </InputLabel>
              <Select
                disabled={!schedule.enabled}
                label={t("settings.dayOfMonth")}
                labelId="staff-email-day-of-month-label"
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
                    {formatPreviewDate(
                      date,
                      locale,
                      schedule.timezone || "America/Argentina/Buenos_Aires",
                    )}
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
          {saveMessage ? <Alert severity="success">{saveMessage}</Alert> : null}

          <Button
            disabled={savingSchedule}
            onClick={() => void saveSchedule()}
            variant="contained"
          >
            {savingSchedule ? t("settings.saving") : t("settings.saveSchedule")}
          </Button>
        </Stack>
      ) : null}
    </Paper>
  );
}
