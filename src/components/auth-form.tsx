"use client";

import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useDictionary } from "@/i18n/dictionary-provider";

type FieldName = "email" | "password" | "token";
type AuthAction =
  "login" | "register" | "forgot-password" | "reset-password" | "verify-email";

type AuthFormProps = {
  action: AuthAction;
  fields: FieldName[];
};

type AuthFormValues = Record<FieldName, string>;

export function AuthForm({ action, fields }: AuthFormProps) {
  const { locale, t } = useDictionary();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<AuthFormValues>({
    defaultValues: { email: "", password: "", token: "" },
  });

  const heading = t(`auth.${actionKey(action)}.heading`);
  const submitLabel = t(`auth.${actionKey(action)}.submit`);
  const successMessage = t(`auth.${actionKey(action)}.success`);

  async function submit(values: AuthFormValues) {
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/auth/${action}`, {
        body: JSON.stringify(
          Object.fromEntries(fields.map((field) => [field, values[field]])),
        ),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          typeof body === "object" &&
            body !== null &&
            "message" in body &&
            typeof body.message === "string"
            ? body.message
            : t("auth.genericError"),
        );
        return;
      }

      if (action === "login" || action === "register") {
        window.location.assign(`/${locale}`);
        return;
      }

      setMessage(successMessage);
    } catch {
      setError(t("auth.unreachable"));
    }
  }

  function fieldLabel(field: FieldName) {
    return t(`auth.${field}`);
  }

  return (
    <Box component="main" sx={{ minHeight: "100vh", py: { xs: 4, sm: 8 } }}>
      <Paper
        component="section"
        elevation={2}
        sx={{ maxWidth: 480, mx: "auto", p: { xs: 2, sm: 4 } }}
      >
        <Stack component="form" spacing={3} onSubmit={handleSubmit(submit)}>
          <Typography component="h1" variant="h4">
            {heading}
          </Typography>
          {fields.map((field) => (
            <TextField
              {...register(field, {
                required: t("auth.required", { field: fieldLabel(field) }),
                ...(field === "email"
                  ? {
                      pattern: {
                        message: t("auth.invalidEmail"),
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      },
                    }
                  : {}),
              })}
              autoComplete={
                field === "email"
                  ? "email"
                  : field === "password"
                    ? "current-password"
                    : "off"
              }
              error={Boolean(errors[field])}
              fullWidth
              helperText={errors[field]?.message}
              key={field}
              label={fieldLabel(field)}
              type={field === "password" ? "password" : "text"}
            />
          ))}
          {error && (
            <Alert aria-live="polite" severity="error">
              {error}
            </Alert>
          )}
          {message && (
            <Alert aria-live="polite" severity="success">
              {message}
            </Alert>
          )}
          <Button
            disabled={isSubmitting}
            size="large"
            type="submit"
            variant="contained"
          >
            {isSubmitting ? t("auth.submitting") : submitLabel}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

function actionKey(action: AuthAction) {
  switch (action) {
    case "forgot-password":
      return "forgotPassword";
    case "reset-password":
      return "resetPassword";
    case "verify-email":
      return "verifyEmail";
    default:
      return action;
  }
}
