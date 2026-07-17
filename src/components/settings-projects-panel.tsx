"use client";

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { useDictionary } from "@/i18n/dictionary-provider";
import {
  deleteStoredProject,
  listStoredProjects,
  refreshProjectLibrary,
  subscribeToProjectLibrary,
  type StoredProject,
} from "@/lib/snapshot-storage";

function getProjectsSnapshot(): StoredProject[] {
  return listStoredProjects();
}

function getServerEmptyList(): StoredProject[] {
  return [];
}

export function SettingsProjectsPanel() {
  const { locale, t } = useDictionary();
  const projects = useSyncExternalStore(
    subscribeToProjectLibrary,
    getProjectsSnapshot,
    getServerEmptyList,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StoredProject | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refreshProjectLibrary();
      if (!cancelled) {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }
    setDeleting(true);
    setError(null);
    const result = await deleteStoredProject(pendingDelete.id);
    setDeleting(false);
    if (!result.ok) {
      setError(result.message || t("settings.projectsDeleteError"));
      return;
    }
    setPendingDelete(null);
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography component="h2" variant="h6">
        {t("settings.projectsTitle")}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2, mt: 0.5 }}>
        {t("settings.projectsDescription")}
      </Typography>

      <Stack spacing={2}>
        {error ? <Alert severity="error">{error}</Alert> : null}

        {loading ? (
          <Typography color="text.secondary">
            {t("settings.projectsLoading")}
          </Typography>
        ) : projects.length === 0 ? (
          <Typography color="text.secondary">
            {t("settings.projectsEmpty")}
          </Typography>
        ) : (
          <List dense disablePadding>
            {projects.map((project) => (
              <ListItem
                key={project.id}
                disableGutters
                secondaryAction={
                  <Button
                    color="error"
                    onClick={() => {
                      setError(null);
                      setPendingDelete(project);
                    }}
                    size="small"
                  >
                    {t("settings.projectsDelete")}
                  </Button>
                }
                sx={{ pr: 12 }}
              >
                <ListItemText
                  primary={project.name}
                  secondary={project.id}
                  slotProps={{
                    secondary: { sx: { wordBreak: "break-all" } },
                  }}
                />
              </ListItem>
            ))}
          </List>
        )}

        <Box>
          <Button
            component={Link}
            href={`/${locale}/upload`}
            variant="contained"
          >
            {t("settings.projectsUpload")}
          </Button>
        </Box>
      </Stack>

      <Dialog
        aria-labelledby="settings-delete-project-title"
        onClose={() => {
          if (!deleting) {
            setPendingDelete(null);
          }
        }}
        open={pendingDelete !== null}
      >
        <DialogTitle id="settings-delete-project-title">
          {t("settings.projectsDeleteConfirmTitle")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("settings.projectsDeleteConfirm", {
              name: pendingDelete?.name ?? "",
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={deleting} onClick={() => setPendingDelete(null)}>
            {t("settings.projectsDeleteCancel")}
          </Button>
          <Button
            color="error"
            disabled={deleting}
            onClick={() => {
              void confirmDelete();
            }}
            variant="contained"
          >
            {deleting
              ? t("settings.projectsDeleting")
              : t("settings.projectsDeleteConfirmAction")}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
