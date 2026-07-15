"use client";

import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Toolbar,
  Typography,
} from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useId, useState } from "react";

import { ProjectSelector } from "@/components/project-selector";
import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  locales,
  type Locale,
} from "@/i18n/config";
import { useDictionary } from "@/i18n/dictionary-provider";

type ThemePreference = "light" | "dark" | "system";

function ThemeCheck({ selected }: { selected: boolean }) {
  return (
    <Box
      aria-hidden
      component="span"
      sx={{
        color: selected ? "primary.main" : "transparent",
        fontSize: "0.875rem",
        fontWeight: 700,
        width: 16,
      }}
    >
      ✓
    </Box>
  );
}

function replaceLocale(pathname: string, nextLocale: Locale) {
  const segments = pathname.split("/");
  if (segments.length > 1 && isLocale(segments[1] ?? "")) {
    segments[1] = nextLocale;
    return segments.join("/") || `/${nextLocale}`;
  }
  return `/${nextLocale}${pathname === "/" ? "" : pathname}`;
}

export function AppNavbar({ authenticated }: { authenticated: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, t } = useDictionary();
  const menuId = useId();
  const { mode, setMode } = useColorScheme();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuOpen = Boolean(anchorEl);
  const activeMode = (mode ?? "system") as ThemePreference;
  const homeHref = `/${locale}`;
  const loginHref = `/${locale}/login`;
  const registerHref = `/${locale}/register`;
  const uploadHref = `/${locale}/upload`;

  async function logout() {
    setIsLoggingOut(true);
    setAnchorEl(null);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.refresh();
      setIsLoggingOut(false);
    }
  }

  function selectTheme(preference: ThemePreference) {
    setMode(preference);
    setAnchorEl(null);
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

  return (
    <AppBar
      color="default"
      component="nav"
      elevation={0}
      position="sticky"
      sx={{
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: 2, minHeight: 64 }}>
          <Typography
            component={Link}
            href={homeHref}
            sx={{
              color: "text.primary",
              fontWeight: 700,
              letterSpacing: 0.4,
              textDecoration: "none",
            }}
            variant="h6"
          >
            {t("nav.brand")}
          </Typography>

          <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}>
            <ProjectSelector />
          </Box>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="nordika-language-label">
              {t("nav.language")}
            </InputLabel>
            <Select
              label={t("nav.language")}
              labelId="nordika-language-label"
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

          {!authenticated ? (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button component={Link} href={loginHref} variant="outlined">
                {t("nav.signIn")}
              </Button>
              <Button component={Link} href={registerHref} variant="contained">
                {t("nav.register")}
              </Button>
            </Box>
          ) : (
            <>
              <IconButton
                aria-controls={menuOpen ? menuId : undefined}
                aria-expanded={menuOpen ? "true" : undefined}
                aria-haspopup="menu"
                aria-label={t("nav.openAccountMenu")}
                onClick={(event) => setAnchorEl(event.currentTarget)}
                size="small"
              >
                <Avatar
                  alt=""
                  sx={{ bgcolor: "primary.main", height: 36, width: 36 }}
                >
                  N
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                id={menuId}
                onClose={() => setAnchorEl(null)}
                open={menuOpen}
                slotProps={{
                  list: { "aria-label": t("nav.accountPreferences") },
                }}
              >
                <MenuItem
                  component={Link}
                  href={uploadHref}
                  onClick={() => setAnchorEl(null)}
                >
                  <ListItemText primary={t("nav.uploadSnapshot")} />
                </MenuItem>
                <Divider />
                {(
                  [
                    ["light", "nav.lightTheme"],
                    ["dark", "nav.darkTheme"],
                    ["system", "nav.systemTheme"],
                  ] as const
                ).map(([value, labelKey]) => (
                  <MenuItem
                    key={value}
                    onClick={() => selectTheme(value)}
                    selected={activeMode === value}
                  >
                    <ListItemIcon>
                      <ThemeCheck selected={activeMode === value} />
                    </ListItemIcon>
                    <ListItemText>{t(labelKey)}</ListItemText>
                  </MenuItem>
                ))}
                <Divider />
                <MenuItem disabled={isLoggingOut} onClick={logout}>
                  {isLoggingOut ? t("nav.signingOut") : t("nav.signOut")}
                </MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
