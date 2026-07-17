import { Box, Container } from "@mui/material";
import { cookies } from "next/headers";

import { ProjectDashboard } from "@/components/project-dashboard";
import { CORE_ACCESS_COOKIE } from "@/lib/core-auth";

export default async function Home() {
  const authenticated = Boolean(
    (await cookies()).get(CORE_ACCESS_COOKIE)?.value,
  );

  return (
    <Box component="main" sx={{ minHeight: "100vh", py: { xs: 3, sm: 5 } }}>
      <Container maxWidth="lg">
        <ProjectDashboard authenticated={authenticated} />
      </Container>
    </Box>
  );
}
