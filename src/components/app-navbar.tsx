"use client";

import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

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

export function AppNavbar({ authenticated }: { authenticated: boolean }) {
  const router = useRouter();
  const menuId = useId();
  const { mode, setMode } = useColorScheme();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuOpen = Boolean(anchorEl);
  const activeMode = (mode ?? "system") as ThemePreference;

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
            href="/"
            sx={{
              color: "text.primary",
              flexGrow: 1,
              fontWeight: 700,
              letterSpacing: 0.4,
              textDecoration: "none",
            }}
            variant="h6"
          >
            Nordika
          </Typography>

          {!authenticated ? (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button component={Link} href="/login" variant="outlined">
                Sign in
              </Button>
              <Button component={Link} href="/register" variant="contained">
                Register
              </Button>
            </Box>
          ) : (
            <>
              <IconButton
                aria-controls={menuOpen ? menuId : undefined}
                aria-expanded={menuOpen ? "true" : undefined}
                aria-haspopup="menu"
                aria-label="Open account menu"
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
                  list: { "aria-label": "Account preferences" },
                }}
              >
                <MenuItem
                  component={Link}
                  href="/upload"
                  onClick={() => setAnchorEl(null)}
                >
                  <ListItemText primary="Upload snapshot" />
                </MenuItem>
                <Divider />
                <MenuItem disabled dense>
                  <ListItemText primary="Preferences" secondary="Appearance" />
                </MenuItem>
                {(
                  [
                    ["light", "Light theme"],
                    ["dark", "Dark theme"],
                    ["system", "System theme"],
                  ] as const
                ).map(([value, label]) => (
                  <MenuItem
                    key={value}
                    onClick={() => selectTheme(value)}
                    selected={activeMode === value}
                  >
                    <ListItemIcon>
                      <ThemeCheck selected={activeMode === value} />
                    </ListItemIcon>
                    <ListItemText>{label}</ListItemText>
                  </MenuItem>
                ))}
                <Divider />
                <MenuItem disabled={isLoggingOut} onClick={logout}>
                  {isLoggingOut ? "Signing out…" : "Sign out"}
                </MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
