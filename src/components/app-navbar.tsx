"use client";

import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

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
  const menuOpen = Boolean(anchorEl);
  const homeHref = `/${locale}`;
  const loginHref = `/${locale}/login`;
  const registerHref = `/${locale}/register`;
  const uploadHref = `/${locale}/upload`;
  const settingsHref = `/${locale}/settings`;
  const avatarLabel = userEmail ? emailInitials(userEmail) : "??";

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

          <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}>
            <ProjectSelector />
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
                  alt=""
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
                  href={settingsHref}
                  onClick={() => setAnchorEl(null)}
                >
                  <ListItemText primary={t("nav.settings")} />
                </MenuItem>
                <MenuItem
                  component={Link}
                  href={uploadHref}
                  onClick={() => setAnchorEl(null)}
                >
                  <ListItemText primary={t("nav.uploadSnapshot")} />
                </MenuItem>
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
