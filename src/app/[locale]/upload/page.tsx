import { Box, Container, Stack, Typography } from "@mui/material";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { SnapshotUploadForm } from "@/components/snapshot-upload-form";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { CORE_ACCESS_COOKIE } from "@/lib/core-auth";

export default async function UploadPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) {
    notFound();
  }

  const dictionary = await getDictionary(localeParam);
  const authenticated = Boolean(
    (await cookies()).get(CORE_ACCESS_COOKIE)?.value,
  );

  return (
    <Box component="main" sx={{ minHeight: "100vh", py: { xs: 4, sm: 8 } }}>
      <Container maxWidth="md">
        <Stack spacing={4}>
          <Box component="header">
            <Typography component="h1" variant="h3">
              {dictionary.upload.title}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 640 }}>
              {dictionary.upload.description}
            </Typography>
          </Box>
          <SnapshotUploadForm authenticated={authenticated} />
        </Stack>
      </Container>
    </Box>
  );
}
