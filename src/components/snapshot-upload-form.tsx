"use client";

import { json } from "@codemirror/lang-json";
import CodeMirror from "@uiw/react-codemirror";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { parseNodikaSnapshot } from "@/lib/nodika-snapshot";

type UploadFormValues = {
  snapshot: string;
};

type UploadResult = {
  id: string;
  filename: string;
  createdAt: string;
};

function isUploadResult(value: unknown): value is UploadResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "filename" in value &&
    "createdAt" in value &&
    typeof value.id === "string" &&
    typeof value.filename === "string" &&
    typeof value.createdAt === "string"
  );
}

const sampleSnapshot = `{
  "schema_version": "nodika-snapshot-v1",
  "meta": {
    "projectId": "proj_mrjbubmw_vbds9",
    "projectNombre": "Sin nombre",
    "ciclo_inicio": "2026-07-01",
    "ciclo_fin": "2026-07-21",
    "gestionSnapshotId": "snapshot_3",
    "exportado_en": "2026-07-15T00:50:36.611Z"
  },
  "tareas_con_objetivo": [
    {
      "id": "n1770144390987",
      "label": "CALCE DE STEEL FRAMING",
      "rubroKey": null,
      "ini": "2026-05-22",
      "fin": "2026-07-01",
      "duracion": 40,
      "avance_base": 0,
      "pct_objetivo": null,
      "sector": null,
      "agente": null
    }
  ]
}`;

export function SnapshotUploadForm({
  authenticated,
}: {
  authenticated: boolean;
}) {
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
  } = useForm<UploadFormValues>({
    defaultValues: {
      snapshot: sampleSnapshot,
    },
  });
  const [snapshot, setSnapshot] = useState(sampleSnapshot);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const validation = parseNodikaSnapshot(snapshot);
  const canSubmit = validation.success && authenticated && !isSubmitting;

  async function submit(values: UploadFormValues) {
    setResult(null);
    setSubmissionError(null);

    if (!parseNodikaSnapshot(values.snapshot).success) {
      setSubmissionError("Correct the JSON syntax errors before uploading.");
      return;
    }

    try {
      const response = await fetch("/api/snapshots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: values.snapshot,
      });
      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof body === "object" &&
          body !== null &&
          "message" in body &&
          typeof body.message === "string"
            ? body.message
            : "The snapshot could not be uploaded.";

        setSubmissionError(message);
        return;
      }

      if (!isUploadResult(body)) {
        setSubmissionError("Core returned an unexpected upload response.");
        return;
      }

      setResult(body);
    } catch {
      setSubmissionError(
        "The upload service could not be reached. Try again later.",
      );
    }
  }

  return (
    <Paper component="section" elevation={2} sx={{ p: { xs: 2, sm: 4 } }}>
      <Stack component="form" spacing={3} onSubmit={handleSubmit(submit)}>
        <Box>
          <Typography component="h2" variant="h6">
            Snapshot JSON
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">
            The editor checks JSON syntax, field names, dates, numeric ranges,
            and duplicate task IDs before upload.
          </Typography>
          <Controller
            control={control}
            name="snapshot"
            render={({ field }) => (
              <Box
                sx={{
                  "& .cm-editor": {
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    overflow: "hidden",
                  },
                }}
              >
                <CodeMirror
                  aria-label="Nodika snapshot JSON"
                  basicSetup={{ lineNumbers: true, foldGutter: false }}
                  extensions={[json()]}
                  height="420px"
                  id="snapshot-editor"
                  onChange={(value) => {
                    field.onChange(value);
                    setSnapshot(value);
                  }}
                  theme="dark"
                  value={field.value}
                />
              </Box>
            )}
          />
        </Box>

        {!authenticated && (
          <Alert severity="info">
            Sign in to upload a snapshot. Your session is managed securely by
            Nordika and no token needs to be pasted here.
          </Alert>
        )}

        {!validation.success && (
          <Alert aria-live="polite" severity="error">
            <AlertTitle>
              Fix {validation.errors.length} JSON syntax issue(s)
            </AlertTitle>
            <Box component="ul" sx={{ mb: 0, pl: 2.5 }}>
              {validation.errors.map((issue) => (
                <li key={`${issue.path}-${issue.message}`}>
                  <Typography component="span" sx={{ fontFamily: "monospace" }}>
                    {issue.path}
                  </Typography>
                  : {issue.message}
                </li>
              ))}
            </Box>
          </Alert>
        )}

        {submissionError && (
          <Alert aria-live="polite" severity="error">
            {submissionError}
          </Alert>
        )}

        {result && (
          <Alert aria-live="polite" severity="success">
            Uploaded <code>{result.filename}</code> as source{" "}
            <code>{result.id}</code> at{" "}
            {new Date(result.createdAt).toLocaleString()}.
          </Alert>
        )}

        <Button
          disabled={!canSubmit}
          size="large"
          type="submit"
          variant="contained"
        >
          {isSubmitting ? "Uploading…" : "Validate and upload snapshot"}
        </Button>
      </Stack>
    </Paper>
  );
}
