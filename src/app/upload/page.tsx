import { Box, Container, Stack, Typography } from "@mui/material";
import { cookies } from "next/headers";
import { SnapshotUploadForm } from "@/components/snapshot-upload-form";
import { CORE_ACCESS_COOKIE } from "@/lib/core-auth";

export default async function UploadPage() {
  const authenticated = Boolean(
    (await cookies()).get(CORE_ACCESS_COOKIE)?.value,
  );

  return (
    <Box component="main" sx={{ minHeight: "100vh", py: { xs: 4, sm: 8 } }}>
      <Container maxWidth="md">
        <Stack spacing={4}>
          <Box component="header">
            <Typography component="h1" variant="h3">
              Upload a project snapshot
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 640 }}>
              Paste snapshot JSON, check syntax, then send it to Nordika Core. A
              successful upload also refreshes the home project dashboard.
            </Typography>
          </Box>
          <SnapshotUploadForm authenticated={authenticated} />
        </Stack>
      </Container>
    </Box>
  );
}
