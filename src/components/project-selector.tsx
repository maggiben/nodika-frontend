"use client";

import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from "@mui/material";
import { useSyncExternalStore } from "react";

import {
  listStoredProjects,
  readProjectLibrary,
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

  if (projects.length === 0) {
    return null;
  }

  function onChange(event: SelectChangeEvent) {
    selectStoredProject(event.target.value);
  }

  const label = t("nav.project");

  return (
    <FormControl size="small" sx={{ minWidth: { xs: 140, sm: 220 } }}>
      <InputLabel id="nordika-project-selector-label">{label}</InputLabel>
      <Select
        label={label}
        labelId="nordika-project-selector-label"
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
