"use client";

import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from "@mui/material";
import { useEffect, useSyncExternalStore } from "react";

import { activateActiveProject } from "@/lib/activate-active-project";
import {
  listStoredProjects,
  readProjectLibrary,
  refreshProjectLibrary,
  selectStoredProject,
  subscribeToProjectLibrary,
  type StoredProject,
} from "@/lib/snapshot-storage";
import { useDictionary } from "@/i18n/dictionary-provider";

function getProjectsSnapshot(): StoredProject[] {
  return listStoredProjects();
}

function getSelectedIdSnapshot(): string {
  return readProjectLibrary().selectedId ?? "";
}

function getServerEmptyList(): StoredProject[] {
  return [];
}

function getServerEmptyId(): string {
  return "";
}

export function ProjectSelector() {
  const { t } = useDictionary();
  const projects = useSyncExternalStore(
    subscribeToProjectLibrary,
    getProjectsSnapshot,
    getServerEmptyList,
  );
  const selectedId = useSyncExternalStore(
    subscribeToProjectLibrary,
    getSelectedIdSnapshot,
    getServerEmptyId,
  );

  useEffect(() => {
    void refreshProjectLibrary();
  }, []);

  if (projects.length === 0) {
    return null;
  }

  function onChange(event: SelectChangeEvent) {
    const projectId = event.target.value;
    selectStoredProject(projectId);
    void activateActiveProject(projectId);
  }

  const label = t("nav.project");

  return (
    <FormControl size="small" sx={{ minWidth: { xs: 140, sm: 220 } }}>
      <InputLabel id="nodika-project-selector-label">{label}</InputLabel>
      <Select
        label={label}
        labelId="nodika-project-selector-label"
        onChange={onChange}
        value={selectedId || projects[0]?.id || ""}
      >
        {projects.map((project) => (
          <MenuItem key={project.id} value={project.id}>
            {project.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
