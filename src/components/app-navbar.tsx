"use client";

import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { ObraProgressChip } from "@/components/obra-progress-chip";
import { ProjectSelector } from "@/components/project-selector";
import { emailInitials } from "@/lib/email-initials";
import { useDictionary } from "@/i18n/dictionary-provider";

export function AppNavbar({
  authenticated,
  userEmail,
}: {
  authenticated: boolean;
  userEmail?: string | null;
}) {
  const router = useRouter();
  const { locale, t } = useDictionary();
  const menuId = useId();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [fetchedEmail, setFetchedEmail] = useState<string | null>(null);
  const menuOpen = Boolean(anchorEl);
  const homeHref = `/${locale}`;
  const loginHref = `/${locale}/login`;
  const registerHref = `/${locale}/register`;
  const uploadHref = `/${locale}/upload`;
  const settingsHref = `/${locale}/settings`;
  const staffHref = `/${locale}/staff`;
  const resolvedEmail = userEmail ?? fetchedEmail;
  const avatarLabel = resolvedEmail ? emailInitials(resolvedEmail) : "??";

  useEffect(() => {
    if (!authenticated || userEmail || fetchedEmail) {
      return;
    }

    let cancelled = false;

    async function loadEmail() {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) {
          return;
        }
        const body: unknown = await response.json().catch(() => null);
        if (
          cancelled ||
          typeof body !== "object" ||
          body === null ||
          typeof (body as { email?: unknown }).email !== "string"
        ) {
          return;
        }
        setFetchedEmail((body as { email: string }).email);
      } catch {
        // Keep fallback initials when settings cannot be loaded.
      }
    }

    void loadEmail();
    return () => {
      cancelled = true;
    };
  }, [authenticated, userEmail, fetchedEmail]);

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

          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
              minWidth: 0,
            }}
          >
            <ProjectSelector />
            <ObraProgressChip authenticated={authenticated} />
          </Box>

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
                  alt={resolvedEmail ?? ""}
                  sx={{ bgcolor: "primary.main", height: 36, width: 36 }}
                >
                  {avatarLabel}
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
                <MenuItem
                  component={Link}
                  href={settingsHref}
                  onClick={() => setAnchorEl(null)}
                >
                  <ListItemText primary={t("nav.settings")} />
                </MenuItem>
                <MenuItem
                  component={Link}
                  href={staffHref}
                  onClick={() => setAnchorEl(null)}
                >
                  <ListItemText primary={t("nav.staff")} />
                </MenuItem>
                <Box
                  component="li"
                  role="separator"
                  sx={{
                    border: 0,
                    borderTop: (theme) => `1px solid ${theme.palette.divider}`,
                    height: "1px",
                    listStyle: "none",
                    m: 0,
                    minHeight: "1px",
                    my: 0.5,
                    p: 0,
                    width: "100%",
                  }}
                />
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
