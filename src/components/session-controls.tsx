"use client";

import { Button, Stack } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SessionControls({ authenticated }: { authenticated: boolean }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function logout() {
    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.refresh();
      setIsLoggingOut(false);
    }
  }

  if (!authenticated) {
    return (
      <Stack direction="row" spacing={1}>
        <Button component={Link} href="/login" variant="outlined">
          Sign in
        </Button>
        <Button component={Link} href="/register" variant="contained">
          Register
        </Button>
      </Stack>
    );
  }

  return (
    <Button disabled={isLoggingOut} onClick={logout} variant="outlined">
      {isLoggingOut ? "Signing out…" : "Sign out"}
    </Button>
  );
}
