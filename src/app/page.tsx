import { Box, Container, Stack, Typography } from "@mui/material";
import { cookies } from "next/headers";
import { SessionControls } from "@/components/session-controls";
import { SnapshotUploadForm } from "@/components/snapshot-upload-form";
import { CORE_ACCESS_COOKIE } from "@/lib/core-auth";

export default async function Home() {
  const authenticated = Boolean(
    (await cookies()).get(CORE_ACCESS_COOKIE)?.value,
  );

  return (
    <Box component="main" sx={{ minHeight: "100vh", py: { xs: 4, sm: 8 } }}>
      <Container maxWidth="md">
        <Stack spacing={4}>
          <Box component="header">
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <SessionControls authenticated={authenticated} />
            </Box>
            <Typography
              color="text.secondary"
              sx={{ letterSpacing: 1.2 }}
              variant="overline"
            >
              Nordika
            </Typography>
            <Typography component="h1" variant="h3">
              Upload a project snapshot
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 640 }}>
              Validate a <code>nodika-snapshot-v1</code> document before sending
              it to Nordika Core.
            </Typography>
          </Box>
          <SnapshotUploadForm authenticated={authenticated} />
        </Stack>
      </Container>
    </Box>
  );
}
