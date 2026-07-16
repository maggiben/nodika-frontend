"use client";

import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  locales,
  type Locale,
} from "@/i18n/config";
import { useDictionary } from "@/i18n/dictionary-provider";
import type { AccountSettings } from "@/lib/core-auth";
import {
  DEFAULT_PROGRESS_AI_MODELS,
  defaultProgressAi,
  modelsForProvider,
  modelForProviderChange,
  type ProgressAiProvider,
  type ProgressAiSettings,
} from "@/lib/progress-ai";

type ThemePreference = "light" | "dark" | "system";

const TIMEZONE_OPTIONS = [
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

function replaceLocale(pathname: string, nextLocale: Locale) {
  const segments = pathname.split("/");
  if (segments.length > 1 && isLocale(segments[1] ?? "")) {
    segments[1] = nextLocale;
    return segments.join("/") || `/${nextLocale}`;
  }
  return `/${nextLocale}${pathname === "/" ? "" : pathname}`;
}

export function UserSettingsForm() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, t } = useDictionary();
  const { mode, setMode } = useColorScheme();
  const activeMode = (mode ?? "system") as ThemePreference;

  const [settings, setSettings] = useState<AccountSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [timezone, setTimezone] = useState("America/Argentina/Buenos_Aires");
  const [timezoneMessage, setTimezoneMessage] = useState<string | null>(null);
  const [timezoneError, setTimezoneError] = useState<string | null>(null);
  const [savingTimezone, setSavingTimezone] = useState(false);

  const [progressAi, setProgressAi] =
    useState<ProgressAiSettings>(defaultProgressAi());
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [anthropicApiKey, setAnthropicApiKey] = useState("");
  const [openaiKeyConfigured, setOpenaiKeyConfigured] = useState(false);
  const [anthropicKeyConfigured, setAnthropicKeyConfigured] = useState(false);
  const [progressAiMessage, setProgressAiMessage] = useState<string | null>(
    null,
  );
  const [progressAiError, setProgressAiError] = useState<string | null>(null);
  const [savingProgressAi, setSavingProgressAi] = useState(false);

  function applyProgressAiFromSettings(next: AccountSettings) {
    setProgressAi(defaultProgressAi(next.progressAi));
    setOpenaiKeyConfigured(Boolean(next.progressAi?.openaiKeyConfigured));
    setAnthropicKeyConfigured(
      Boolean(next.progressAi?.anthropicKeyConfigured),
    );
    setOpenaiApiKey("");
    setAnthropicApiKey("");
  }

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
          setTimezone(
            next.emailSchedule.timezone || "America/Argentina/Buenos_Aires",
          );
          applyProgressAiFromSettings(next);
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

  async function saveTimezone() {
    setTimezoneMessage(null);
    setTimezoneError(null);
    setSavingTimezone(true);

    try {
      const response = await fetch("/api/settings", {
        body: JSON.stringify({ timezone }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setTimezoneError(
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
        setTimezone(
          next.emailSchedule.timezone || "America/Argentina/Buenos_Aires",
        );
        applyProgressAiFromSettings(next);
      }
      setTimezoneMessage(t("settings.timezoneSaved"));
    } catch {
      setTimezoneError(t("settings.unreachable"));
    } finally {
      setSavingTimezone(false);
    }
  }

  function changeProgressProvider(provider: ProgressAiProvider) {
    setProgressAi((current) => ({
      provider,
      model: modelForProviderChange(provider, current.model),
    }));
  }

  async function saveProgressAi(options?: {
    clearOpenAi?: boolean;
    clearAnthropic?: boolean;
  }) {
    setProgressAiMessage(null);
    setProgressAiError(null);
    setSavingProgressAi(true);

    const payload: Record<string, unknown> = {
      provider: progressAi.provider,
      model: progressAi.model,
    };

    if (options?.clearOpenAi) {
      payload.openaiApiKey = null;
    } else if (openaiApiKey.trim()) {
      payload.openaiApiKey = openaiApiKey.trim();
    }

    if (options?.clearAnthropic) {
      payload.anthropicApiKey = null;
    } else if (anthropicApiKey.trim()) {
      payload.anthropicApiKey = anthropicApiKey.trim();
    }

    try {
      const response = await fetch("/api/settings", {
        body: JSON.stringify({ progressAi: payload }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setProgressAiError(
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
        applyProgressAiFromSettings(next);
      }
      setProgressAiMessage(t("settings.progressAiSaved"));
    } catch {
      setProgressAiError(t("settings.unreachable"));
    } finally {
      setSavingProgressAi(false);
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
            {t("settings.timezoneTitle")}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2, mt: 0.5 }}>
            {t("settings.timezoneDescription")}
          </Typography>
          <Stack spacing={2} sx={{ maxWidth: 420 }}>
            <FormControl size="small">
              <InputLabel id="settings-timezone-label">
                {t("settings.timezone")}
              </InputLabel>
              <Select
                label={t("settings.timezone")}
                labelId="settings-timezone-label"
                onChange={(event) => setTimezone(event.target.value)}
                value={timezone}
              >
                {TIMEZONE_OPTIONS.some(
                  (option) => option.value === timezone,
                ) ? null : (
                  <MenuItem value={timezone}>{timezone}</MenuItem>
                )}
                {TIMEZONE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {timezoneError ? (
              <Alert severity="error">{timezoneError}</Alert>
            ) : null}
            {timezoneMessage ? (
              <Alert severity="success">{timezoneMessage}</Alert>
            ) : null}
            <Button
              disabled={savingTimezone}
              onClick={() => void saveTimezone()}
              variant="contained"
            >
              {savingTimezone
                ? t("settings.timezoneSaving")
                : t("settings.timezoneSave")}
            </Button>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography component="h2" variant="h6">
            {t("settings.progressAiTitle")}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2, mt: 0.5 }}>
            {t("settings.progressAiDescription")}
          </Typography>
          <Stack spacing={2} sx={{ maxWidth: 420 }}>
            <FormControl size="small">
              <InputLabel id="settings-progress-provider-label">
                {t("settings.progressAiProvider")}
              </InputLabel>
              <Select
                label={t("settings.progressAiProvider")}
                labelId="settings-progress-provider-label"
                onChange={(event) =>
                  changeProgressProvider(
                    event.target.value as ProgressAiProvider,
                  )
                }
                value={progressAi.provider}
              >
                <MenuItem value="openai">
                  {t("settings.progressAiOpenAI")}
                </MenuItem>
                <MenuItem value="anthropic">
                  {t("settings.progressAiAnthropic")}
                </MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel id="settings-progress-model-label">
                {t("settings.progressAiModel")}
              </InputLabel>
              <Select
                label={t("settings.progressAiModel")}
                labelId="settings-progress-model-label"
                onChange={(event) =>
                  setProgressAi((current) => ({
                    ...current,
                    model: event.target.value,
                  }))
                }
                value={
                  modelsForProvider(progressAi.provider).includes(
                    progressAi.model,
                  )
                    ? progressAi.model
                    : (DEFAULT_PROGRESS_AI_MODELS[progressAi.provider] ??
                      progressAi.model)
                }
              >
                {modelsForProvider(progressAi.provider).map((model) => (
                  <MenuItem key={model} value={model}>
                    {model}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              autoComplete="off"
              helperText={
                openaiKeyConfigured
                  ? t("settings.progressAiKeyConfigured")
                  : t("settings.progressAiKeyMissing")
              }
              label={t("settings.progressAiOpenAiKey")}
              onChange={(event) => setOpenaiApiKey(event.target.value)}
              type="password"
              value={openaiApiKey}
            />
            {openaiKeyConfigured ? (
              <Button
                color="inherit"
                disabled={savingProgressAi}
                onClick={() => void saveProgressAi({ clearOpenAi: true })}
                size="small"
              >
                {t("settings.progressAiClearOpenAi")}
              </Button>
            ) : null}
            <TextField
              autoComplete="off"
              helperText={
                anthropicKeyConfigured
                  ? t("settings.progressAiKeyConfigured")
                  : t("settings.progressAiKeyMissing")
              }
              label={t("settings.progressAiAnthropicKey")}
              onChange={(event) => setAnthropicApiKey(event.target.value)}
              type="password"
              value={anthropicApiKey}
            />
            {anthropicKeyConfigured ? (
              <Button
                color="inherit"
                disabled={savingProgressAi}
                onClick={() => void saveProgressAi({ clearAnthropic: true })}
                size="small"
              >
                {t("settings.progressAiClearAnthropic")}
              </Button>
            ) : null}
            {progressAiError ? (
              <Alert severity="error">{progressAiError}</Alert>
            ) : null}
            {progressAiMessage ? (
              <Alert severity="success">{progressAiMessage}</Alert>
            ) : null}
            <Button
              disabled={savingProgressAi}
              onClick={() => void saveProgressAi()}
              variant="contained"
            >
              {savingProgressAi
                ? t("settings.progressAiSaving")
                : t("settings.progressAiSave")}
            </Button>
          </Stack>
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
      </Stack>
    </Container>
  );
}
