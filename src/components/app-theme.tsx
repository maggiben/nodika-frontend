"use client";

import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import type { ReactNode } from "react";

const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: "data-mui-color-scheme",
  },
  colorSchemes: {
    light: {
      palette: {
        mode: "light",
        primary: {
          main: "#0F4C5C",
          contrastText: "#F4FBFC",
        },
        secondary: {
          main: "#C45C26",
        },
        background: {
          default: "#EEF2F4",
          paper: "#FFFFFF",
        },
        text: {
          primary: "#14212B",
          secondary: "#4A5B68",
        },
        divider: "#D5DEE4",
      },
    },
    dark: {
      palette: {
        mode: "dark",
        primary: {
          main: "#6BD3E2",
          contrastText: "#041016",
        },
        secondary: {
          main: "#E4A06A",
        },
        background: {
          default: "#0A1016",
          paper: "#141C24",
        },
        text: {
          primary: "#EAF1F5",
          secondary: "#A7B6C2",
        },
        divider: "#2A3642",
      },
    },
  },
  typography: {
    fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif",
  },
  shape: {
    borderRadius: 10,
  },
});

export function AppTheme({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <ThemeProvider defaultMode="system" disableTransitionOnChange theme={theme}>
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  );
}
