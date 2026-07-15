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

type ThemePreference = "light" | "dark" | "system";

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
          setSettings(body as AccountSettings);
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
      </Stack>
    </Container>
  );
}
