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
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent } from "react";
import { Controller, useForm } from "react-hook-form";

import { useDictionary } from "@/i18n/dictionary-provider";
import { activateActiveProject } from "@/lib/activate-active-project";
import { parseNodikaSnapshot } from "@/lib/nodika-snapshot";
import { fetchAuthed } from "@/lib/session-client";
import { activateUploadedSnapshot } from "@/lib/snapshot-storage";

type UploadFormValues = {
  snapshot: string;
};

type UploadResult = {
  id: string;
  filename: string;
  createdAt: string;
  projectId?: string | null;
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
  const router = useRouter();
  const { locale, t } = useDictionary();
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
    setValue,
  } = useForm<UploadFormValues>({
    defaultValues: {
      snapshot: sampleSnapshot,
    },
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [snapshot, setSnapshot] = useState(sampleSnapshot);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const validation = parseNodikaSnapshot(snapshot);
  const canSubmit = validation.success && authenticated && !isSubmitting;

  function applySnapshotText(text: string) {
    setValue("snapshot", text, { shouldDirty: true });
    setSnapshot(text);
    setResult(null);
    setSubmissionError(null);
    setFileError(null);
  }

  async function onSnapshotFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".json")) {
      setFileError(t("upload.fileNotJson"));
      return;
    }

    try {
      const text = await file.text();
      applySnapshotText(text);
    } catch {
      setFileError(t("upload.fileReadFailed"));
    }
  }

  async function submit(values: UploadFormValues) {
    setResult(null);
    setSubmissionError(null);

    if (!parseNodikaSnapshot(values.snapshot).success) {
      setSubmissionError(t("upload.correctSyntax"));
      return;
    }

    try {
      const response = await fetchAuthed("/api/snapshots", {
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
            : t("upload.uploadFailed");

        setSubmissionError(message);
        return;
      }

      if (!isUploadResult(body)) {
        setSubmissionError(t("upload.unexpectedResponse"));
        return;
      }

      const stored = await activateUploadedSnapshot(
        values.snapshot,
        body.projectId,
      );
      if (stored) {
        await activateActiveProject(stored.id);
      }
      setResult(body);
      router.push(`/${locale}`);
    } catch {
      setSubmissionError(t("upload.unreachable"));
    }
  }

  return (
    <Paper component="section" elevation={2} sx={{ p: { xs: 2, sm: 4 } }}>
      <Stack component="form" spacing={3} onSubmit={handleSubmit(submit)}>
        <Box>
          <Typography component="h2" variant="h6">
            {t("upload.editorTitle")}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">
            {t("upload.editorHelp")}
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{
              alignItems: { xs: "stretch", sm: "center" },
              mb: 1.5,
            }}
          >
            <input
              accept=".json,application/json"
              hidden
              onChange={onSnapshotFileChange}
              ref={fileInputRef}
              type="file"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              type="button"
              variant="outlined"
            >
              {t("upload.chooseFile")}
            </Button>
            <Typography color="text.secondary" variant="body2">
              {t("upload.fileHelp")}
            </Typography>
          </Stack>
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
                  aria-label={t("upload.editorTitle")}
                  basicSetup={{ lineNumbers: true, foldGutter: false }}
                  extensions={[json()]}
                  height="420px"
                  id="snapshot-editor"
                  onChange={(value) => {
                    field.onChange(value);
                    setSnapshot(value);
                    setFileError(null);
                  }}
                  theme="dark"
                  value={field.value}
                />
              </Box>
            )}
          />
        </Box>

        {!authenticated && (
          <Alert severity="info">{t("upload.signInPrompt")}</Alert>
        )}

        {fileError && (
          <Alert aria-live="polite" severity="error">
            {fileError}
          </Alert>
        )}

        {!validation.success && (
          <Alert aria-live="polite" severity="error">
            <AlertTitle>
              {t("upload.fixIssues", { count: validation.errors.length })}
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
            {t("upload.uploaded", {
              filename: result.filename,
              id: result.id,
              date: new Date(result.createdAt).toLocaleString(locale),
            })}
          </Alert>
        )}

        <Button
          disabled={!canSubmit}
          size="large"
          type="submit"
          variant="contained"
        >
          {isSubmitting ? t("upload.submitting") : t("upload.submit")}
        </Button>
      </Stack>
    </Paper>
  );
}
