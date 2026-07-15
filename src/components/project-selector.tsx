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

  return (
    <FormControl size="small" sx={{ minWidth: { xs: 140, sm: 220 } }}>
      <InputLabel id="nordika-project-selector-label">Project</InputLabel>
      <Select
        label="Project"
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
