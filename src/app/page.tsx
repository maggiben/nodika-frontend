import { Box, Container } from "@mui/material";
import { ProjectDashboard } from "@/components/project-dashboard";

export default function Home() {
  return (
    <Box component="main" sx={{ minHeight: "100vh", py: { xs: 3, sm: 5 } }}>
      <Container maxWidth="lg">
        <ProjectDashboard />
      </Container>
    </Box>
  );
}
